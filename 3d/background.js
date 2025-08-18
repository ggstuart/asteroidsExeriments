export default class Background {

    static cubeVertices = new Float32Array([
        // 36 vertices (12 triangles) for a cube, positions only
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, -1, 1, -1, // back
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, // front
        -1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, -1, 1, 1, 1, -1, 1, 1, // top
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, -1, -1, 1, // bottom
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, // right
        -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, -1, 1  // left
    ]);

    static async fromPaths(gpu, { image, shader, projectionMatrixBuffer }) {
        const texture = await gpu.createCubeTexture([image, image, image, image, image, image], "rgba8unorm");
        const module = await gpu.createShader(shader);
        return new Background(gpu, { texture, module, projectionMatrixBuffer })
        
    }

    constructor(gpu, { texture, module, projectionMatrixBuffer }) {
        this.gpu = gpu;
        this.texture = texture;
        // this.buffer = gpu.createUniformBuffer(144);
        this.projectionMatrixBuffer = projectionMatrixBuffer;
        this.sampler = gpu.createSampler();
        this.pipeline = gpu.createRenderPipeline(module, "vsMain", module, "fsMain");
        this.vertexBuffer = gpu.device.createBuffer({
            size: Background.cubeVertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(this.vertexBuffer.getMappedRange()).set(Background.cubeVertices);        
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
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(36, 1, 0, 0); // draw the cube
    }


}