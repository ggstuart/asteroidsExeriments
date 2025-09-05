import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';


export default class Camera {

    constructor(canvas) {
        this._fov = 60 * Math.PI / 180;
        this.resize(canvas);
        this._near = 0.4;
        this._far = 100000;
        this.position = [0, 0, 0];
        this.maxZ = 20;
        this.yaw = 0;
    }

    resize(canvas) {
        this._aspect = canvas.width / canvas.height;
        this._perspective = undefined;
    }

    get fov() {
        return this._fov;
    }

    set fov(newFov) {
        this._fov = newFov;
        this._perspective = undefined;
    }

    set near(newNear) {
        this._near = newNear;
        this._perspective = undefined;
    }

    set far(newFar) {
        this._far = newFar;
        this._perspective = undefined;
    }

    turnLeft(angle) {
        this.yaw -= angle;
    }

    turnRight(angle) {
        this.yaw += angle;
    }

    moveForward(delta) {
        this.position[0] += Math.sin(this.yaw) * delta;
        this.position[2] += Math.cos(this.yaw) * delta;
        this.position[2] = Math.min(this.position[2], this.maxZ);
    }

    moveBackward(delta) {
        this.position[0] -= Math.sin(this.yaw) * delta;
        this.position[2] -= Math.cos(this.yaw) * delta;
        this.position[2] = Math.max(this.position[2], 0);
    }

    moveLeft(delta) {
        this.position[0] += Math.sin(this.yaw - Math.PI / 2) * delta;
        this.position[2] += Math.cos(this.yaw - Math.PI / 2) * delta;
    }

    moveRight(delta) {
        this.position[0] += Math.sin(this.yaw + Math.PI / 2) * delta;
        this.position[2] += Math.cos(this.yaw + Math.PI / 2) * delta;
    }

    get viewMatrix() {
        let m = mat4.identity();
        m = mat4.rotateY(m, -this.yaw);
        m = mat4.translate(m, [-this.position[0], -this.position[1], -this.position[2]]);
        return m;
    }

    get perspective() {
        if (!this._perspective) {
            this._perspective = mat4.perspective(
                this._fov,
                this._aspect,
                this._near,
                this._far
            )
        }
        return this._perspective;
    }

    get viewProjMatrix() {
        return mat4.multiply(this.perspective, this.viewMatrix);
    }
}
