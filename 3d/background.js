export default class Background {

    

    static async fromPaths(gpu, { image, shader, projectionMatrixBuffer }, geometry) {
        // !!problem in the creation of the texture !!
        const texture = await gpu.createCubeTexture([image, image, image, image, image, image], "rgba8unorm");
        const module = await gpu.createShader(shader);
        console.log(geometry.vertices)
        return new Background(gpu, { texture, module, projectionMatrixBuffer }, geometry)
        
    }

    constructor(gpu, { texture, module, projectionMatrixBuffer }, geometry) {
        this.gpu = gpu;
        this.texture = texture;
        this.geometry = geometry;
        this.projectionMatrixBuffer = projectionMatrixBuffer;
        this.sampler = gpu.createSampler();
        this.pipeline = gpu.createRenderPipeline(module, "vsMain", module, "fsMain");
        this.vertexBuffer = gpu.device.createBuffer({
            size: this.geometry.vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.geometry.vertices);        
        this.vertexBuffer.unmap();

        this.bindGroup = gpu.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.projectionMatrixBuffer } },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: this.texture.createView({ dimension: "cube" }) }
            ]
        });
    }

    get queue() {
        return this.gpu.device.queue;
    }

    draw(pass) {
        console.log(this.geometry.vertices);
        
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.geometry.length , 1, 0, 0); // draw the cube
    }


}