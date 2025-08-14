import Camera from './camera.js';
import Ship from './ship.js';

// this mat4 to use the matrix (we can do it manually)
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

function _createCanvas() {
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
    document.body.style.display = "grid";
    document.body.style.margin = "0";
    document.body.style.minHeight = "100dvh";
    canvas.style.backgroundColor = "black";
    resize(canvas)
    return canvas;
}

function resize(canvas) {
    canvas.height = document.body.clientHeight;
    canvas.width = document.body.clientWidth;
}


export default class AsteroidsGame {
    constructor(gpu) { 
        this.gpu = gpu;       
        this.canvas = _createCanvas();
        this.ctx = this.gpu.createContext(this.canvas, 'opaque')
        const camera = new Camera(this.canvas);
        this.ship = new Ship(camera);
    }

    resize() {
        resize(this.canvas);
    }


    // createBackground(path) {

    // }

    async reset(nAsteroids, noise) {
        this.mvpBuffer = this.gpu.createImageBuffer();
        this.starBackground = await this.gpu.createBackground({
            // image: '3d/images/test.jpg', //it was a test with 3d photo !! you can test it
            image: '3d/images/test.jpg',
            shader: '3d/shaders/background.wgsl',
            mvpBuffer : this.mvpBuffer
        })

        this.angleX = 0;
        this.angleY = 0;
        // this.starBackgroundTexture = await this.gpu.createTexture('3d/images/stars.jpg');
        // this.starBackgroundBuffer = this.gpu.createImageBuffer();
        // this.starBackgroundSampler = this.gpu.createSampler();

        // this.starBackgroundRenderPipeline = this.gpu.createRenderPipeline({
        //     layout: "auto",
        //     vertex: {
        //         module,
        //         entryPoint: "vsMain"
        //     },
        //     fragment: {
        //         module,
        //         entryPoint: "fsMain",
        //         targets: this.ui.targets
        //     },
        //     primitive: { topology: "triangle-list" }
        // });

        // this.starBackgroundBindGroup = this.gpu.createBindGroup({
        //     label: `update ${collection.label} bindGroup`,
        //     layout: updatePipeline.getBindGroupLayout(1),
        //     entries: [
        //         { binding: 0, resource: { buffer: updateBuffer } },
        //         { binding: 1, resource: { buffer: this.frameBuffer } }
        //     ],
        // });
        //create asteroid data?
        // this.background = this.createBackground('3d/images/stars.jpg');
        // this.background.texture
        // this.background.sampler
        // this.background.buffer
        // this.backgroundBuffer = ??
        // this.backgroundSampler = ??

        console.log(this.starBackground);
        
    }

    update(elapsed) {
        this.ship.update(elapsed);
        // const viewProjMatrix = this.ship.projectionMatrix;
        this.starBackground.writeBuffer(this.ship.projectionMatrix)
    }

    draw() {
        this.gpu.pass(this.ctx.getCurrentTexture().createView(), (pass) => {
            this.starBackground.draw(pass);
            // Draw other stuff
        });
    }

}

