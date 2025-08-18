import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';


export default class Ship {
    constructor(camera) {
        this.location = mat4.identity();
        this.motion = mat4.identity();
        // this.acceleration = mat4.identity();
        // this.camera = camera;
        this.rotatePower = 1; // radiansPerSecondPerSecond?
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }

    get xAxis() {
        return mat4.getAxis(this.location, 0);
    }
    get yAxis() {
        return mat4.getAxis(this.location, 1);
    }
    get zAxis() {
        return mat4.getAxis(this.location, 2);
    }
    get acceleration() { 
        const xRot = mat4.axisRotation(this.xAxis, this.y * this.rotatePower);
        const yRot = mat4.axisRotation(this.yAxis, this.x * this.rotatePower);
        const zRot = mat4.axisRotation(this.zAxis, this.z * this.rotatePower);
        return mat4.multiply(mat4.multiply(xRot, yRot),zRot);
    }

    update(elapsed) {
        // should I be using elapsed?
        this.motion = mat4.multiply(this.acceleration, this.motion);
        this.location = mat4.multiply(this.location, this.motion);
    }


}
