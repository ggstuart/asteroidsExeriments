import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

export default class Asteroid {

    static async withModule(gpu, path, nAsteroids) {
        const module = await gpu.createShader(path);
        return new Asteroid(gpu, module, nAsteroids);

    }

    createVertex(theta, phi, r) {
        return [
            Math.sin(theta) * Math.cos(phi) * r,
            Math.sin(theta) * Math.sin(phi) * r,
            Math.cos(theta) * r,
        ]
    }

    createTriangle(theta, phi, r, segment) {
        return [
            this.createVertex(theta - segment / 2, phi - segment / 2, r),
            this.createVertex(theta + segment / 2, phi - segment / 2, r),
            this.createVertex(theta - segment / 2, phi + segment / 2, r)
        ].flat()
    }

    createVertices(segments, size) {
        const segment = 2 * Math.PI / segments;
        const coords = Array.from({length: segments * segments}, (_, i) => {
            const theta = segment * Math.floor(i / segments);
            const phi = segment * i % segments;
            return this.createTriangle(theta, phi, size, segment);
        });
        
        return new Float32Array(coords.flat());
    }

    constructor(gpu, module, nAsteroids) {
        this.nAsteroids = nAsteroids;
        this.gpu = gpu;
        this.vertices = this.createVertices(30, 1);
    

        this.instanceData = Array.from({length: nAsteroids}, _ => {
            let tm = mat4.identity();
            tm = mat4.rotateX(tm, 2 * Math.PI * (Math.random() - 0.5));
            tm = mat4.rotateY(tm, 2 * Math.PI * (Math.random() - 0.5));
            tm = mat4.rotateZ(tm, 2 * Math.PI * (Math.random() - 0.5));
            tm = mat4.translate(tm, [0, 0, 10 + Math.random() * 20]);
            return Array.from(mat4.transpose(tm));
        }).flat();
        this.projectionBuffer = gpu.createUniformBuffer(144);

        console.log(
            this.instanceData.flat()
        );

        this.vertexBuffer = gpu.createVertexBuffer(this.vertices.byteLength);
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.vertices);
        this.vertexBuffer.unmap();

        this.asteroidBuffer = gpu.createStorageBuffer(64 * nAsteroids, true);
        new Float32Array(this.asteroidBuffer.getMappedRange()).set(this.instanceData);
        this.asteroidBuffer.unmap();

        this.pipeline = gpu.createRenderPipeline(module, "vsMain", module, "fsMain");
        this.bindGroup = gpu.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.projectionBuffer } },
                { binding: 1, resource: { buffer: this.asteroidBuffer } }
            ]
        });
    }

    get queue() {
        return this.gpu.device.queue;
    }

    writeBuffer(viewProjMatrix) {
        this.queue.writeBuffer(this.projectionBuffer, 0, viewProjMatrix.buffer, viewProjMatrix.byteOffset, 64);
    }

    draw(pass) {
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length / 3, this.nAsteroids, 0, 0); // draw the cube
    }

}