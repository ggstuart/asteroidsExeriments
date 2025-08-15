import Background from "./background.js";

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
                module: vModule,
                entryPoint: vEntry,
                buffers: [
                    {
                        arrayStride: 12, // 3 * 4 bytes (vec3<f32>)
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x3"
                            }
                        ]
                    }
                ]
            },
            fragment: {
                module: fModule,
                entryPoint: fEntry,
                targets: [{ format: this.format }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode
            }
        });        
    }

    createBindGroup(...args) { 
        return this.device.createBindGroup(...args);
    }


    async createBackground({ image, shader }) {
        return Background.fromPaths(this, { image, shader });
    }


    render(view, callback) {
        const encoder = this.device.createCommandEncoder();
        const renderPass = encoder.beginRenderPass({
            // depthStencilAttachments: {
            //     depthClearValue: 0.5,
            //     depthLoadOp: 'clear',
            //     depthStoreOp: "store",
            //     view
            // },
            colorAttachments: [{
                view,
                clearValue: [1, 1, 0, 1],
                loadOp: "clear",
                storeOp: "store"
            }]
        });

        callback(renderPass);
        renderPass.end();        
        this.device.queue.submit([encoder.finish()]);
    }

}
