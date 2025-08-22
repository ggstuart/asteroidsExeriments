
// this mat4 to use the matrix (we can do it manually)
// import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";
import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

import Asteroids from '../3d/asteroid.js';
import Camera from '../3d/camera.js';
import Ship from '../3d/ship.js';
import Controls from "../3d/controls.js";

function _createCanvas() {
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
    document.body.style.display = "grid";
    document.body.style.margin = "0";
    document.body.style.minHeight = "100dvh";
    canvas.style.backgroundColor = "black";
    canvas.height = document.body.clientHeight;
    canvas.width = document.body.clientWidth;
    return canvas;
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
        this.resize();

        // this.angleX = 0;
        // this.angleY = 0;
        // this.distance = 2;

        // this.isDragging = false;
        // this.lastMouseX = 0;
        // this.lastMouseY = 0;

        // this._initMouseControls();


    }

    // _initMouseControls() {
    //     this.canvas.addEventListener("mousedown", (e) => {
    //         this.isDragging = true;
    //         this.lastMouseX = e.clientX;
    //         this.lastMouseY = e.clientY;
    //     });

    //     window.addEventListener("mouseup", () => {
    //         this.isDragging = false;
    //     });

    //     window.addEventListener("mousemove", (e) => {
    //         if (!this.isDragging) return;

    //         const dx = e.clientX - this.lastMouseX;
    //         const dy = e.clientY - this.lastMouseY;

    //         this.angleY += dx * 0.005; 
    //         this.angleX += dy * 0.005;

    //         this.lastMouseX = e.clientX;
    //         this.lastMouseY = e.clientY;
    //     });

    //     this.canvas.addEventListener("wheel", (e) => {
    //         this.distance += e.deltaY * 0.01;
    //         this.distance = Math.max(0.5, Math.min(5, this.distance));
    //     });
    // }

    resize() {
        this.canvas.height = document.body.clientHeight;
        this.canvas.width = document.body.clientWidth;
        this.camera.resize(this.canvas);
    }

    async reset(nAsteroids, noise) {
        this.mvpBuffer = this.gpu.createUniformBuffer(64);
        this.starBackground = await this.gpu.createBackground({
            // image: '3d/images/test.jpg', //it was a test with 3d photo !! you can test it
            // image: '3dSphericalBackground/images/test.jpg',
            image: '3dSphericalBackground/images/stars.jpg',
            shader: '3dSphericalBackground/shaders/background.wgsl',
            mvpBuffer : this.mvpBuffer
        })


        this.asteroids = await Asteroids.withModule(
            this.gpu,
            {
                frameBuffer: this.frameBuffer,
                projectionBuffer: this.mvpBuffer,
                nAsteroids,
                noise
            }
        );

        // this.angleX = 0;
        // this.angleY = 0;
        // console.log(this.starBackground);
        
    }

    get projectionMatrix() {
        return mat4.multiply(this.camera.perspective, this.ship.transformationMatrix);
    }

    updateFrameBuffer(elapsed) {
        this.gpu.writeBuffer(this.frameBuffer, 0, new Float32Array([elapsed]));
    }

    update(elapsed) {
        this.updateFrameBuffer(elapsed);

        if(this.controls.fov) {
            this.camera.fov += this.controls.fov * elapsed;
        }
        this.ship.pitchInput = this.controls.y; // w/s for pitch (w = negative pitch?)
        this.ship.yawInput = this.controls.z; // ArrowLeft/Right for yaw
        this.ship.rollInput = this.controls.x; // a/d for roll
        this.ship.thrustInput = this.controls.thrust;
        // this.ship.x = this.controls.x * elapsed ** 2;
        // this.ship.y = this.controls.y * elapsed ** 2;
        // this.ship.z = this.controls.z * elapsed ** 2;
        this.ship.update(elapsed);

        this.gpu.writeBuffer(this.frameBuffer, 0, new Float32Array([elapsed]));
        
        this.gpu.compute((pass) => {
            this.asteroids.compute(pass);
        }, (encoder) => {
            this.asteroids.copy(encoder);
        });
        // // to make automatic rotation (can be removed)
        // // this.angleY += elapsed * 0.1;
        // // this.angleX += elapsed * 0.05;

        // // create identity matrix
        // const model = mat4.create();
        // // rotate on x
        // mat4.rotateX(model, model, this.angleX);
        // // rotate on Y
        // mat4.rotateY(model, model, this.angleY);
        // // to show inside the sphere
        // mat4.scale(model, model, [-1, 1, 1]);



        // // crete the view matrix
        // const view = mat4.create();


        // // create the projection matrix
        // const projection = mat4.create();
        // mat4.perspective(projection, Math.PI / 2, this.canvas.width / this.canvas.height, 0.1, 2000);


        // // create the model view proction matrix = the final one to calculate the procduct
        // const mvp = mat4.create();
        // // mvp = projection*view
        // // mvp = mvp*model= projection*view*model
        // mat4.multiply(mvp, projection, view);
        // mat4.multiply(mvp, mvp, model);
        // // we create the matrix on our buffer
        // this.gpu.device.queue.writeBuffer(this.mvpBuffer, 0, mvp);
        //     //move things? Compute shader?
    }

    draw() {
            // tells the render shaders about the ship angle
        const pm = this.projectionMatrix;
        this.gpu.writeBuffer(this.mvpBuffer, 0, pm.buffer, pm.byteOffset, 64);

        // console.debug("game draw");
        this.gpu.render(this.ctx.getCurrentTexture().createView(), (pass) => {
            this.starBackground.draw(pass);
            this.asteroids.draw(pass);
            // Draw other stuff
        });
        // this.gpu.pass(this.ctx.getCurrentTexture().createView(), (pass) => {
        //     this.starBackground.draw(pass);
        // });
    }

}
