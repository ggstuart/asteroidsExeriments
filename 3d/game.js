import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

import Asteroids from './asteroid.js';
import Camera from './camera.js';
import Ship from './ship.js';
import Controls from "./controls.js";


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

        
        this.camera = new Camera(this.canvas);
        this.ship = new Ship(this.camera);

        this.controls = new Controls();
        
        this.frameBuffer = gpu.createUniformBuffer(4);
        this.projectionMatrixBuffer = gpu.createUniformBuffer(144);        
    }

    resize() {
        resize(this.canvas);
        this.camera.resize(this.canvas);
    }

    async reset(nAsteroids, noise) {

        this.starBackground = await this.gpu.createBackground({
            image: '3d/images/stars.jpg',
            shader: '3d/shaders/cubeMap.wgsl',
            projectionMatrixBuffer: this.projectionMatrixBuffer
        });

        this.asteroids = await Asteroids.withModule(
            this.gpu,
            {
                frameBuffer: this.frameBuffer,
                projectionBuffer: this.projectionMatrixBuffer,
                nAsteroids,
                noise
            }
        );

    }

    get projectionMatrix() {
        return mat4.multiply(this.camera.perspective, this.ship.location);
    }

    update(elapsed) {
        if(this.controls.fov) {
            this.camera.fov += this.controls.fov * elapsed;
        }
        this.ship.x = this.controls.x * elapsed ** 2;
        this.ship.y = this.controls.y * elapsed ** 2;
        this.ship.z = this.controls.z * elapsed ** 2;
        this.ship.update(elapsed);

        this.gpu.writeBuffer(this.frameBuffer, 0, new Float32Array([elapsed]));
        
        this.gpu.compute((pass) => {
            this.asteroids.compute(pass);
        }, (encoder) => {
            this.asteroids.copy(encoder);
        });

    }

    draw() {

        // tells the render shaders about the ship angle
        const pm = this.projectionMatrix;
        this.gpu.writeBuffer(this.projectionMatrixBuffer, 0, pm.buffer, pm.byteOffset, 64);

        // console.debug("game draw");
        this.gpu.render(this.ctx.getCurrentTexture().createView(), (pass) => {
            this.starBackground.draw(pass);
            this.asteroids.draw(pass);
            // Draw other stuff
        });
    }

}

