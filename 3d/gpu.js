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

    async createTexture(path) {
        const image = new Image();
        image.src = path;
        await image.decode();
        const source = await createImageBitmap(image);
        const texture = this.device.createTexture({
            size: [source.width, source.height, 1],
            format: "rgba8unorm",
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
            size: 144,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: false
        })
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
                entryPoint: "vsMain"
            },
            fragment: {
                module,
                entryPoint: "fsMain",
                targets: [{ format: this.format }]
            },
            primitive: { topology: "triangle-list" }
        });        
    }


    async createBackground({image, shader}) {
        const texture = await this.createTexture(image);
        const buffer = this.createImageBuffer();
        const sampler = this.createSampler();
        const pipeline = await this.createRenderPipeline(shader);
        const bindGroup = this.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: buffer },
                { binding: 1, resource: sampler },
                { binding: 2, resource: texture.createView() }
            ]
        });
        return new Background(pipeline, bindGroup);
    }

    pass(view, callback) {
        const encoder = this.device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            depthStencilAttachments: {
                depthClearValue: 0.5,
                depthLoadOp: 'clear',
                depthStoreOp: "store",
                view
            },
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
    constructor(pipeline, bindGroup) {
        this.pipeline = pipeline;
        this.bindGroup = bindGroup;
    }

    draw(pass) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        // pass.draw(??, ??);

    }
}