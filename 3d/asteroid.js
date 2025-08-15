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

    createVertices(segmentCount, size) {
        const segmentAngle = 2 * Math.PI / segmentCount;
        const coords = Array.from({length: segmentCount**2}, (_, i) => {
            const theta1 = segmentAngle * Math.floor(i / segmentCount);
            const phi1 = segmentAngle * (i % segmentCount);
            console.log(theta1, phi1);
            const theta2 = theta1 + segmentAngle;
            const phi2 = phi1 + segmentAngle;
            return [
                this.createVertex(theta1, phi1, size),
                this.createVertex(theta1, phi2, size),
                this.createVertex(theta2, phi1, size),
                this.createVertex(theta2, phi1, size),
                this.createVertex(theta1, phi2, size),
                this.createVertex(theta2, phi2, size),
            ];
        });
        return new Float32Array(coords.flat(2));
    }

    constructor(gpu, module, nAsteroids) {
        this.nAsteroids = nAsteroids;
        this.gpu = gpu;
        this.vertices = this.createVertices(4, 1);
        console.log(this.vertices);


        

        this.instanceData = Array.from({length: nAsteroids}, _ => {
            let tm = mat4.identity();
            tm = mat4.rotateX(tm, 2 * Math.PI * (Math.random() - 0.5));
            tm = mat4.rotateY(tm, 2 * Math.PI * (Math.random() - 0.5));
            tm = mat4.rotateZ(tm, 2 * Math.PI * (Math.random() - 0.5));
            tm = mat4.translate(tm, [0, 0, 10 + Math.random() * 20]);
            tm = mat4.rotateX(tm, 2 * Math.PI * (Math.random() - 0.5));
            tm = mat4.rotateY(tm, 2 * Math.PI * (Math.random() - 0.5));
            tm = mat4.rotateZ(tm, 2 * Math.PI * (Math.random() - 0.5));
            return Array.from(mat4.transpose(tm));
        }).flat();
        this.projectionBuffer = gpu.createUniformBuffer(144);
        this.vertexBuffer = gpu.createVertexBuffer(this.vertices.byteLength);
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.vertices);
        this.vertexBuffer.unmap();

        this.asteroidBuffer = gpu.createStorageBuffer(64 * nAsteroids, true);
        new Float32Array(this.asteroidBuffer.getMappedRange()).set(this.instanceData);
        this.asteroidBuffer.unmap();

        this.pipeline = gpu.createRenderPipeline(module, "vsMain", module, "fsMain", "back");
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