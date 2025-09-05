import { createSphere } from "./sphere.js";
export default class WebGPU {

    static async init() {
        try {
            if (!navigator.gpu) { throw new Error("WebGPU is not supported by this browser."); }
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) throw new Error("Unable to get a GPU adapter.");
            const device = await adapter.requestDevice();
            return new WebGPU(device);
        } catch (error) {
            console.error("WebGPU initialization failed:", error.message);
            alert("Failed to initialize WebGPU. Please check browser compatibility or try a different device.");
            throw error;
        }
    }

    constructor(device) {
        this.device = device;
        this.format = navigator.gpu.getPreferredCanvasFormat();
    }

    createContext(canvas, alphaMode) {
        const ctx = canvas.getContext('webgpu');
        ctx.configure({
            device: this.device,
            format: this.format,
            alphaMode
        });
        return ctx;
    }

    createUniformBuffer(size, mappedAtCreation=false) {
        return this.device.createBuffer({
            size,
            mappedAtCreation,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
    }

    createCopyBuffer(size, mappedAtCreation = false) {
        return this.device.createBuffer({
            size,
            mappedAtCreation,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
        });
    }

    createVertexBuffer(size, mappedAtCreation = false) {
        return this.device.createBuffer({
            size,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation
        });
    }

    createSampler() {
        return this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear"
        });
    }

    async createShader(path, options) {
        console.log("Loading shader from", path);
        const response = await fetch(path);
        console.log("response", response);
        
        let code = await response.text();
        if(code.search(/@workgroup_size\(1\)/) != -1) {
            code = code.replace("@workgroup_size(1)", `@workgroup_size(${options.wgSize})`)
        }       
        return this.device.createShaderModule({ code, label: path });
    }

    createRenderPipeline(vModule, vEntry, fModule, fEntry, cullMode="none") {
        return this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: vModule,
                entryPoint: vEntry,
                buffers: [
                    {
                        arrayStride: 32,
                        attributes: [
                            { shaderLocation: 0, format: "float32x3", offset: 0 },   
                            { shaderLocation: 1, format: "float32x2", offset: 12 },  
                            { shaderLocation: 2, format: "float32x3", offset: 20 },                              
                        ]
                    }
                ]
            },
            fragment: {
                module: fModule,
                entryPoint: fEntry,
                targets: [{ format: this.format }]
            },
            primitive: { topology: "triangle-list", cullMode }
        });
    }

    async createRenderPipelineBackground(module) {        
        return this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module,
                entryPoint: "vsMain",
                buffers: [{
                    arrayStride: 5 * 4,
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: "float32x3" },
                        { shaderLocation: 1, offset: 3*4, format: "float32x2" }
                    ]
                }]
            },
            fragment: {
                module,
                entryPoint: "fsMain",
                targets: [{ format: this.format }]
            },
            primitive: { topology: "triangle-list", cullMode: "none" }
        });
    }

    createComputePipeline(module, entryPoint) {
        return this.device.createComputePipeline({
            layout: 'auto',
            compute: { module, entryPoint }
        });
    }

    createBindGroup(...args) {
        return this.device.createBindGroup(...args);
    }

    async createTexture(path) {
        const image = new Image();
        image.src = path;
        await image.decode();
        const source = await createImageBitmap(image);
        const texture = this.device.createTexture({
            size: [source.width, source.height, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.device.queue.copyExternalImageToTexture({ source }, { texture }, [source.width, source.height]);
        return texture;
    }

    async createCubeTexture(facePaths) {
        const bitmaps = await Promise.all(facePaths.map(this.createSquareBitmap));
        const size = bitmaps[0].width;
        const texture = this.device.createTexture({
            size: [size, size, 6],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
        for (let i = 0; i < 6; i++) {
            this.device.queue.copyExternalImageToTexture({ source: bitmaps[i] }, { texture, origin: [0,0,i] }, [size,size]);
        }
        return texture;
    }

    async createSquareBitmap(path) {
        const image = new Image();
        image.src = path;
        await image.decode();
        const size = Math.min(image.width, image.height);
        return createImageBitmap(image, 0, 0, size, size);
    }    

    createIndexVertexBuffer(verticesAndIndices) {
        const vertexBuff = this.createVertexBuffer(verticesAndIndices.vertices.byteLength)
        this.device.queue.writeBuffer(vertexBuff, 0, verticesAndIndices.vertices);
        const indexBuffer = this.device.createBuffer({
            size: verticesAndIndices.indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(indexBuffer, 0, verticesAndIndices.indices);
        return { vertexBuff, indexBuffer, indexCount: verticesAndIndices.indices.length };
    }

    writeBuffer(...args) {
        this.device.queue.writeBuffer(...args);
    }

    compute(computeCallback, encoderCallback) {
        const encoder = this.device.createCommandEncoder();
        const computePass = encoder.beginComputePass();
        computeCallback(computePass);
        computePass.end();
        encoderCallback(encoder);
        this.device.queue.submit([encoder.finish()]);
    }

    render(view, callback) {
        const encoder = this.device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view,
                clearValue: [1,1,0,1],
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        callback(renderPass);
        renderPass.end();
        this.device.queue.submit([encoder.finish()]);
    }

    async createBackground({ image, shader, projectionMatrixBuffer, mvpBuffer, backgroundType="cubique" }) {
        if(backgroundType === "cubique") {
            const BackgroundModule = await import("./background.js");
            return BackgroundModule.default.fromPaths(this, { image, shader, projectionMatrixBuffer });
        } else {
            const texture = await this.createTexture(image);
            const sampler = this.createSampler();
            const module = await this.createShader(shader);
            const pipeline = await this.createRenderPipelineBackground(module);
            console.log("pipeline", pipeline);
            
            const bindGroup = this.device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: mvpBuffer } },
                    { binding: 1, resource: sampler },
                    { binding: 2, resource: texture.createView() }
                ]
            });
            const buffers = this.createIndexVertexBuffer(createSphere());
            return new SphericalBackground(pipeline, bindGroup, buffers);
        }
    }

}

class SphericalBackground {
    constructor(pipeline, bindGroup, buffers) {
        this.pipeline = pipeline;
        this.bindGroup = bindGroup;
        this.vertexBuffer = buffers.vertexBuff;
        this.indexBuffer = buffers.indexBuffer;
        this.indexBufferCount = buffers.indexCount;
    }

    draw(pass) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.setIndexBuffer(this.indexBuffer, "uint16");
        pass.drawIndexed(this.indexBufferCount, 1, 0, 0, 0);
    }
}
