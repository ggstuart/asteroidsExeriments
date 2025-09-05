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
    tm = mat4.rotateX(tm, (Math.random() - 0.5) * rotation);
    tm = mat4.rotateY(tm, (Math.random() - 0.5) * rotation);
    tm = mat4.rotateZ(tm, (Math.random() - 0.5) * rotation);
    return mat4.transpose(tm);
}

function createVertex(theta, phi, r) {
    const x = Math.sin(theta) * Math.cos(phi) * r;
    const y = Math.sin(theta) * Math.sin(phi) * r;
    const z = Math.cos(theta) * r;

    const u = phi / (2 * Math.PI);
    const v = theta / Math.PI;

    const normal = [x / r, y / r, z / r];

    return {
        position: [x, y, z],
        uv: [u, v],
        normal: normal
    };
}

export function sphericalVertices(segmentCount, size) {
    const segmentAngle = Math.PI / segmentCount;
    const vertices = [];
    for (let y = 0; y < segmentCount; ++y) {
        for (let x = 0; x < segmentCount; ++x) {
            const phi1 = x * 2 * Math.PI / segmentCount;
            const theta1 = y * Math.PI / segmentCount;
            const phi2 = (x + 1) * 2 * Math.PI / segmentCount;
            const theta2 = (y + 1) * Math.PI / segmentCount;

            const v1 = createVertex(theta1, phi1, size);
            const v2 = createVertex(theta1, phi2, size);
            const v3 = createVertex(theta2, phi1, size);
            const v4 = createVertex(theta2, phi2, size);

            vertices.push([...v1.position, ...v1.uv, ...v1.normal]);
            vertices.push([...v2.position, ...v2.uv, ...v2.normal]);
            vertices.push([...v3.position, ...v3.uv, ...v3.normal]);

            vertices.push([...v3.position, ...v3.uv, ...v3.normal]);
            vertices.push([...v2.position, ...v2.uv, ...v2.normal]);
            vertices.push([...v4.position, ...v4.uv, ...v4.normal]);
        }
    }
    return new Float32Array(vertices.flat());
}

const WG_SIZE = 64;

export default class Asteroids {

    static async withModule(gpu, {frameBuffer, projectionBuffer, nAsteroids, noise, texture}) {
        const module = await gpu.createShader("3d/shaders/asteroids.wgsl", {
            wgSize: WG_SIZE
        });
        return new Asteroids(gpu, {frameBuffer, projectionBuffer, module, nAsteroids, noise, texture});
    }

    constructor(gpu, {frameBuffer, projectionBuffer, module, nAsteroids, noise, texture}) {
        this.gpu = gpu;
        this.frameBuffer = frameBuffer
        this.projectionBuffer = projectionBuffer;
        this.nAsteroids = nAsteroids;
        this.texture = texture;
        this.sampler = gpu.createSampler();
        this.vertices = sphericalVertices(8, 1);
        this.vertexBuffer = gpu.createVertexBuffer(this.vertices.byteLength);
        this.gpu.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices);
        this.locations = Array.from({ length: nAsteroids }, _ => {
            let tm = randomlyOrientedDistantObject(10 + Math.random() * 20);
            return Array.from(mat4.transpose(tm));
        }).flat();
        this.locationBuffer = gpu.createCopyBuffer(64 * nAsteroids, true);
        new Float32Array(this.locationBuffer.getMappedRange()).set(this.locations);
        this.locationBuffer.unmap();
        this.movements = Array.from({ length: nAsteroids }, _ => {
            let tm = randomMotion(0, Math.PI * 0);
            return Array.from(tm);
        }).flat();        
        this.movementBuffer = gpu.createCopyBuffer(64 * nAsteroids, true);
        new Float32Array(this.movementBuffer.getMappedRange()).set(this.movements);
        this.movementBuffer.unmap();
        this.updatePipeline = gpu.createComputePipeline(module, 'cpMain');
        this.updateBindGroup = gpu.createBindGroup({
            layout: this.updatePipeline.getBindGroupLayout(1),
            entries: [
                { binding: 0, resource: { buffer: this.movementBuffer } },
                { binding: 1, resource: { buffer: this.locationBuffer } },
                { binding: 2, resource: { buffer: this.frameBuffer } }
            ],
        });
        
        this.renderBuffer = gpu.createCopyBuffer(64 * nAsteroids, true);
        new Float32Array(this.renderBuffer.getMappedRange()).set(this.locations);
        this.renderBuffer.unmap();    
        this.renderPipeline = gpu.createRenderPipeline(module, "vsMain", module, "fsMain", "back");
        this.renderBindGroup = gpu.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.projectionBuffer } },
                { binding: 1, resource: { buffer: this.renderBuffer } },    
                { binding: 2, resource: this.sampler },                    
                { binding: 3, resource: this.texture.createView() }         
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
        const nWorkgroups = Math.ceil(this.nAsteroids / WG_SIZE);
        pass.setPipeline(this.updatePipeline);
        pass.setBindGroup(1, this.updateBindGroup);
        pass.dispatchWorkgroups(nWorkgroups);
    }

    copy(encoder) {
        encoder.copyBufferToBuffer(this.locationBuffer, this.renderBuffer);
    }

    draw(pass) {
        pass.setPipeline(this.renderPipeline);
        pass.setBindGroup(0, this.renderBindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertices.length / 8, this.nAsteroids, 0, 0);
    }

}