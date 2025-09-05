import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';
import Asteroids from './asteroid.js';
import Camera from './camera.js';
import Ship from './ship.js';
import Controls from "./controls.js";


export default class AsteroidsGame {
    constructor(gpu, backgroundType = "cubique") { 
        this.gpu = gpu;
        this.backgroundType = backgroundType;

        this.canvas = this._createCanvas();
        this.ctx = this.gpu.createContext(this.canvas, 'opaque');

        this.camera = new Camera(this.canvas);
        this.ship = new Ship();
        this.controls = new Controls();

        this.skyBuffer = gpu.createUniformBuffer(64);
        this.worldBuffer = gpu.createUniformBuffer(64);

        this.frameBuffer = gpu.createUniformBuffer(4);
        this.resize();
    }

    _createCanvas() {
        const canvas = document.createElement('canvas');
        document.body.append(canvas);
        document.body.style.display = "grid";
        document.body.style.margin = "0";
        document.body.style.minHeight = "100dvh";
        canvas.style.backgroundColor = "black";
        return canvas;
    }

    resize() {
        this.canvas.height = document.body.clientHeight;
        this.canvas.width = document.body.clientWidth;
        this.camera.resize(this.canvas);
    }

    async reset(nAsteroids, noise) {
        if (this.backgroundType === "cubique") {
            this.starBackground = await this.gpu.createBackground({
                image: '3d/images/stars.jpg',
                shader: '3d/shaders/backgroundMap.wgsl',
                projectionMatrixBuffer: this.skyBuffer, 
                backgroundType: "cubique"
            });
        } else {
            this.starBackground = await this.gpu.createBackground({
                image: '3d/images/test.jpg',
                shader: '3d/shaders/background.wgsl',
                mvpBuffer: this.skyBuffer, 
                backgroundType: "spherique"
            });
        }

        // You can change the texture here, the website is https://ambientcg.com/list?category=Rock&sort=popular
        this.asteroidTexture = await this.gpu.createTexture('3d/images/asteroid.jpg');


        this.asteroids = await Asteroids.withModule(this.gpu, {
            frameBuffer: this.frameBuffer,
            projectionBuffer: this.worldBuffer,
            nAsteroids,
            noise,
            texture: this.asteroidTexture
        });
    }

    get projection() { return this.camera.perspective; }

    get viewMatrix() {
        return mat4.inverse(this.ship.transformationMatrix);
    }

    get skyViewMatrix() {
        return mat4.inverse(this.ship.orientation);
    }

    get worldVP() {
        return mat4.multiply(this.projection, this.viewMatrix);
    }

    get skyVP() {
        return mat4.multiply(this.projection, this.skyViewMatrix);
    }

    updateFrameBuffer(elapsed) {
        this.gpu.writeBuffer(this.frameBuffer, 0, new Float32Array([elapsed]));
    }

    update(elapsed) {
        this.updateFrameBuffer(elapsed);

        if (this.controls.fovZoomOut) {
            const maxFov = 120 * Math.PI / 180;
            this.camera.fov = Math.min(this.camera.fov + 1 * elapsed, maxFov);
        }
        if (this.controls.fovZoomIn) {
            const minFov = 30 * Math.PI / 180;
            this.camera.fov = Math.max(this.camera.fov - 1 * elapsed, minFov);
        }

        this.ship.pitchInput  = this.controls.y;      
        this.ship.yawInput    = this.controls.z;      
        this.ship.rollInput   = this.controls.x;      
        this.ship.thrustInput = this.controls.thrust; 

        this.ship.update(elapsed);
        
        this.gpu.compute(pass => this.asteroids.compute(pass), encoder => this.asteroids.copy(encoder));
    }

    draw() {
        const sky = this.skyVP;      
        const vp  = this.worldVP;     

        this.gpu.writeBuffer(this.skyBuffer,   0, sky.buffer,  sky.byteOffset,  64);
        this.gpu.writeBuffer(this.worldBuffer, 0, vp.buffer,   vp.byteOffset,   64);

        this.gpu.render(this.ctx.getCurrentTexture().createView(), pass => {
            this.starBackground.draw(pass);
            this.asteroids.draw(pass);      
        });
    }
}