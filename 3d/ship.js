import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

import Controls from "./controls.js";

export default class Ship {
    constructor(camera) {
        this.controls = new Controls();
        this.angle = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.camera = camera;
    }

    update(elapsed) {

        // This is clearly wrong
        // It should be calculated
        if(this.controls.fov) {
            this.camera.fov += this.controls.fov * elapsed;       
        }

        this.rotation.x += this.controls.x * elapsed;
        this.rotation.y += this.controls.y * elapsed;

        this.angle.x += this.rotation.x * elapsed;
        this.angle.y += this.rotation.y * elapsed;

    }

    get projectionMatrix() {
        let view = mat4.identity();
        view = mat4.rotateY(view, this.angle.x);
        view = mat4.rotateX(view, this.angle.y);
        view = mat4.rotateZ(view, this.angle.z);
        return mat4.multiply(this.camera.perspective, view);

    }
}
