import { cubeVertices } from "./cube.js";

export default class Background {
    static async fromPaths(gpu, { image, shader, projectionMatrixBuffer }, geometry) {
        const texture = await gpu.createCubeTexture([image, image, image, image, image, image]);
        console.log("shader", shader);
        const module = await gpu.createShader(shader);
        console.log("module", module);
        const pipeline = await gpu.createRenderPipelineBackground(module);

        
        return new Background(gpu, { texture, module, projectionMatrixBuffer, pipeline }, geometry)
        
    }

    constructor(gpu, { texture, module, projectionMatrixBuffer, pipeline }) {
        this.gpu = gpu;
        this.texture = texture;
        this.projectionMatrixBuffer = projectionMatrixBuffer;
        this.sampler = gpu.createSampler();
        this.pipeline = pipeline;
        this.vertexBuffer = gpu.createVertexBuffer(cubeVertices.byteLength)
        this.gpu.device.queue.writeBuffer(this.vertexBuffer, 0, cubeVertices);
        console.log("this.pipeline", this.pipeline);
        
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

    writeBuffer(viewProjMatrix) {
        this.queue.writeBuffer(this.projectionMatrixBuffer, 0, viewProjMatrix.buffer, viewProjMatrix.byteOffset, 64);
    }

    draw(pass) {        
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(36, 1, 0, 0);
    }


}