import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';


export default class Camera {
    constructor(canvas) {
        this._fov = 60 * Math.PI / 180
        this.resize(canvas);
        this._near = 0.4;
        this._far = 100;
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

}
