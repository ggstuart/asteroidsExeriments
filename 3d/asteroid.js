import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

function randomlyOrient(tm) {
    tm = mat4.rotateX(tm, 2 * Math.PI * (Math.random() - 0.5));
    tm = mat4.rotateY(tm, 2 * Math.PI * (Math.random() - 0.5));
    return mat4.rotateZ(tm, 2 * Math.PI * (Math.random() - 0.5));
}

function randomlyOrientedDistantObject(distance) {
    let tm = mat4.identity();
    tm = randomlyOrient(tm)
    tm = mat4.translate(tm, [0, 0, distance]);
    tm = randomlyOrient(tm)
    return tm;
}

function randomMotion(translation, rotation) { 
    let tm = mat4.identity();
    tm = mat4.translate(tm, Array.from({ length: 3 }, _ => (Math.random() - 0.5) * translation));
    // let tm = mat4.translation();
    tm = mat4.rotateX(tm, (Math.random() - 0.5) * rotation);
    // tm = mat4.rotateY(tm, 2 * Math.PI * (Math.random() - 0.5) * rotation);
    // return mat4.rotateZ(tm, 2 * Math.PI * (Math.random() - 0.5) * rotation);
    return mat4.transpose(tm);
    // return tm;
}

function createVertex(theta, phi, r) {
    return [
        Math.sin(theta) * Math.cos(phi) * r,
        Math.sin(theta) * Math.sin(phi) * r,
        Math.cos(theta) * r,
    ]
}

function sphericalVertices(segmentCount, size) {
    const segmentAngle = 2 * Math.PI / segmentCount;
    const coords = Array.from({ length: segmentCount ** 2 }, (_, i) => {

        const x = (i % segmentCount);
        const y = Math.floor(i / segmentCount);

        const phi1 = segmentAngle * x;
        const theta1 = segmentAngle * y;
        const phi2 = phi1 + segmentAngle;
        const theta2 = theta1 + segmentAngle;        

        return [
            createVertex(theta1, phi1, size),
            createVertex(theta1, phi2, size),
            createVertex(theta2, phi1, size),
            createVertex(theta2, phi1, size),
            createVertex(theta1, phi2, size),
            createVertex(theta2, phi2, size),
        ];
    });
    return new Float32Array(coords.flat(2));
}


export default class Asteroids {

    static async withModule(gpu, {frameBuffer, projectionBuffer, nAsteroids, noise}) {
        const module = await gpu.createShader("3d/shaders/asteroids.wgsl");
        return new Asteroids(gpu, {frameBuffer, projectionBuffer, module, nAsteroids, noise});
    }

    constructor(gpu, {frameBuffer, projectionBuffer, module, nAsteroids, noise}) {
        this.gpu = gpu;
        this.frameBuffer = frameBuffer
        this.projectionBuffer = projectionBuffer;
        this.nAsteroids = nAsteroids;

        // The static vertex data
        this.vertices = sphericalVertices(8, 1);
        this.vertexBuffer = gpu.createVertexBuffer(this.vertices.byteLength);
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.vertices);
        this.vertexBuffer.unmap();

        // setup locations of each asteroid (for compute shader)
        this.locations = Array.from({ length: nAsteroids }, _ => {
            let tm = randomlyOrientedDistantObject(10 + Math.random() * 20);
            return Array.from(mat4.transpose(tm));
        }).flat();
        this.locationBuffer = gpu.createCopyBuffer(64 * nAsteroids, true);
        new Float32Array(this.locationBuffer.getMappedRange()).set(this.locations);
        this.locationBuffer.unmap();

        // setup movement of each asteroid (for compute shader)
        this.movements = Array.from({ length: nAsteroids }, _ => {
            let tm = randomMotion(0.1, Math.PI * 0);
            return Array.from(tm); //mat4.transpose(tm));
        }).flat();        
        this.movementBuffer = gpu.createStorageBuffer(64 * nAsteroids, true);
        new Float32Array(this.movementBuffer.getMappedRange()).set(this.movements);
        this.movementBuffer.unmap();

        // compute pipeline and bind group
        this.updatePipeline = gpu.createComputePipeline(module, 'cpMain');
        this.updateBindGroup = gpu.createBindGroup({
            layout: this.updatePipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: this.movementBuffer } },
                { binding: 1, resource: { buffer: this.locationBuffer } },
                { binding: 2, resource: { buffer: this.frameBuffer } }
            ],
        });
        
        // This holds the calculated asteroid locations to render
        this.renderBuffer = gpu.createStorageBuffer(64 * nAsteroids, true);
        new Float32Array(this.renderBuffer.getMappedRange()).set(this.locations);
        this.renderBuffer.unmap();

        // The render pipeline        
        this.renderPipeline = gpu.createRenderPipeline(module, "vsMain", module, "fsMain", "back");
        this.renderBindGroup = gpu.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.projectionBuffer } },
                { binding: 1, resource: { buffer: this.renderBuffer } }
            ]
        });

    }

    get queue() {
        return this.gpu.device.queue;
    }

    writeBuffer(viewProjMatrix) {
        this.queue.writeBuffer(this.projectionBuffer, 0, viewProjMatrix.buffer, viewProjMatrix.byteOffset, 64);
    }

    compute(pass) {
        pass.setPipeline(this.updatePipeline);
        pass.setBindGroup(1, this.updateBindGroup);
        pass.dispatchWorkgroups(this.nAsteroids);
    }

    copy(encoder) {
        encoder.copyBufferToBuffer(this.locationBuffer, this.renderBuffer);
    }

    draw(pass) {
        pass.setPipeline(this.renderPipeline);
        pass.setBindGroup(0, this.renderBindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length / 3, this.nAsteroids, 0, 0); // draw the cube
    }

}