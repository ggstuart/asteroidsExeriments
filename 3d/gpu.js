export default class WebGPU {

    static async init() {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported by this browser.");
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("Unable to get a GPU adapter.");
        const device = await adapter.requestDevice();
        return new WebGPU(device);
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

    async createCubeTexture(facePaths, format) {
        const bitmaps = await Promise.all(facePaths.map(this.createSquareBitmap));
        const size = bitmaps[0].width; // assume square faces
        const texture = this.device.createTexture({
            size: [size, size, 6],
            format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });
        for (let i = 0; i < 6; ++i) {
            this.device.queue.copyExternalImageToTexture(
                { source: bitmaps[i] },
                { texture, origin: [0, 0, i] },
                [size, size]
            );
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

    async createTexture(path, format) {
        const image = new Image();
        image.src = path;
        await image.decode();
        const source = await createImageBitmap(image);
        const texture = this.device.createTexture({
            size: [source.width, source.height, 1],
            format,
            usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT            
        });
        this.device.queue.copyExternalImageToTexture(
            {source}, 
            {texture},
            [source.width, source.height]
        )
        return texture;
    }

    createUniformBuffer(size, mappedAtCreation=false) {
        return this.device.createBuffer({
            size,
            mappedAtCreation,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        })
    }

    createStorageBuffer(size, mappedAtCreation=false) {
        return this.device.createBuffer({
            size,
            mappedAtCreation,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })
    }

    createVertexBuffer(size) {
        return this.device.createBuffer({
            size,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true
        });
    }

    createSampler() {
        return this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear"
        })
    }

    async createShader(path) {
        const response = await fetch(path);
        const code = await response.text();
        return this.device.createShaderModule({ code, label: path });
    }

    createRenderPipeline(vModule, vEntry, fModule, fEntry, cullMode="none") {
        return this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module,
                entryPoint: "vsMain",
                buffers: [{
                arrayStride: 5 * 4, // 8 floats * 4 bytes
                attributes: [
                    { shaderLocation: 0, offset: 0, format: "float32x3" }, // position
                    { shaderLocation: 1, offset: 3 * 4, format: "float32x2" }  // uv
                ]
            }]
            },
            fragment: {
                module,
                entryPoint: "fsMain",
                targets: [{ format: this.format }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode
            }
        });        
    }


    async createBackground({image, shader, mvpBuffer}) {
        const texture = await this.createTexture(image);
        const sampler = this.createSampler();
        const pipeline = await this.createRenderPipeline(shader);
        const bindGroup = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: {buffer: mvpBuffer} },
                { binding: 1, resource: sampler },
                { binding: 2, resource: texture.createView() }
            ]
        });
        const vertexBuff = this.createVertexBuffer(this.createSphereVertices());
        return new Background(pipeline, bindGroup, vertexBuff);
    }

    pass(view, callback) {
        const encoder = this.device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view,
                clearValue: [0, 0, 0, 1],
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        
        // renderPass.setPipeline(renderPipeline);
        // renderPass.setBindGroup(0, renderBindGroup);
        // renderPass.draw(??, ??);
        callback(renderPass);
        renderPass.end();        
        this.device.queue.submit([encoder.finish()]);
    }

}

class Background {
    constructor(pipeline, bindGroup, vertexBuffer) {
        this.pipeline = pipeline;
        this.bindGroup = bindGroup;
        this.vertexBuffer = vertexBuffer;
    }

    draw(pass) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer)
        pass.draw(this.vertexBuffer.size / (5 * 4), 1, 0, 0);

    }
}