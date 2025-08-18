import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

import Controls from "./controls.js";

export default class Ship {
    constructor(camera) {
        this.controls = new Controls();
        this.location = mat4.identity();
        // this.rotation = { x: 0, y: 0, z: 0 };
        this.motion = mat4.identity();
        this.camera = camera;
    }

    update(elapsed) {

        // This is clearly wrong
        // It should be calculated
        if(this.controls.fov) {
            this.camera.fov += this.controls.fov * elapsed;       
        }

        // Calculate the additional forces for this frame
        let diff = mat4.identity();
        diff = mat4.rotateX(diff, this.controls.y * elapsed * 0.01);
        diff = mat4.rotateY(diff, this.controls.x * elapsed * 0.01);
        // diff = mat4.translate(diff, [0, 0, this.controls.thrust * elapsed * 0.01]);
        this.motion = mat4.multiply(this.motion, diff);
        this.location = mat4.multiply(this.location, this.motion);


    }

    get projectionMatrix() {
        // let view = mat4.identity();
        // view = mat4.rotateY(view, this.angle.x);
        // view = mat4.rotateX(view, this.angle.y);
        // view = mat4.rotateZ(view, this.angle.z);

        return mat4.multiply(this.camera.perspective, this.location);

    }
}
