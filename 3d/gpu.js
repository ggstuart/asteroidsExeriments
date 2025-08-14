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

    createImageBuffer() {
        return this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            // mappedAtCreation: false
        })
    }

    createSphereVertices(rad = 1, latSeg = 100000, longSeg = 10) {
        // 5000  |||||||||||||||||||||||||||||||||||||||||||||||
        // 10 -- -- -- -- -- -- -- -- -- -- -- -- 
        // the purpose is to divide the sphere on parts 

        const vertices = [];
        for (let y = 0; y <= latSeg; y++) {
            // go from 0 to pi
            const radAngle = y * Math.PI / latSeg;
            const sinAngle = Math.sin(radAngle);
            const cosAngle = Math.cos(radAngle);
            // Now we fix the longitude segments
            for (let x = 0; x <= longSeg; x++) {
                // go from 0 to 2 pi
                const phi = x * 2 * Math.PI / longSeg;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const vx = rad * sinAngle * cosPhi; //Position X long
                const vy = rad * cosAngle; //position Y lat
                const vz = rad * sinAngle * sinPhi; //posuition z deep
                //to map the image on the sphere 
                const u = x / longSeg; //hor
                const v = y / latSeg; //ver
                // vertices is composed of vx vy and vz
                // and the u, v coords => for the texturing
                vertices.push(vx, vy, vz, u, v);
            }
        }
        return new Float32Array(vertices);
    }

    createVertexBuffer(vertices) {
        // to write vertices on the buffer
        console.log(vertices)
        const vertexBuff =  this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
        this.device.queue.writeBuffer(vertexBuff, 0, vertices);
        return vertexBuff;
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

    async createRenderPipeline(shader) {
        const module = await this.createShader(shader);
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
            primitive: { topology: "triangle-list" }
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