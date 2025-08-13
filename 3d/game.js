import { mat4 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';



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

class Controls {
    constructor() { 
        this.keys = { 'a': false, 's': false, 'd': false, 'w': false };
        window.addEventListener('keydown', ev => this.keys[ev.key] = true);
        window.addEventListener('keyup', ev => this.keys[ev.key] = false);
    }

    get x() {
        return this.keys.d - this.keys.a;
    }
    get y() {
        return this.keys.s - this.keys.w;
    }
}

export default class AsteroidsGame {
    constructor(gpu) { 
        // console.log("game constructor");
        
        this.gpu = gpu;       
        this.canvas = _createCanvas();
        this.ctx = this.gpu.createContext(this.canvas, 'opaque')
        this.controls = new Controls();
        this.angle = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        const fov = 60 * Math.PI / 180
        const aspect = this.canvas.width / this.canvas.height;
        const near = 0.1;
        const far = 100;
        this.perspective = mat4.perspective(fov, aspect, near, far);
    }


    async reset(nAsteroids, noise) {

        this.starBackground = await this.gpu.createBackground({
            image: '3d/images/stars.jpg',
            shader: '3d/shaders/cubeMap.wgsl'
        });

    }

    update(elapsed) {
        // console.log(elapsed);
        
        
        this.rotation.x += this.controls.x * elapsed;
        this.rotation.y += this.controls.y * elapsed;

        this.angle.x += this.rotation.x * elapsed;
        this.angle.y += this.rotation.y * elapsed;

        // console.log(this.controls.x);
        // console.log(this.angle);
        
        // mat4.identity(this.view); // replace with your camera's rotation
        

        // const proj = mat4.perspective(Math.PI / 2, this.canvas.width / this.canvas.height, 0.01, 100);
        let view = mat4.create();
        mat4.identity(view); // replace with your camera's rotation
        view = mat4.rotateX(view, this.angle.y);
        view = mat4.rotateY(view, this.angle.x);
        view = mat4.rotateZ(view, this.angle.z);
        const viewProjMatrix = mat4.multiply(this.perspective, view);
        this.gpu.device.queue.writeBuffer(this.starBackground.buffer, 0, viewProjMatrix.buffer, viewProjMatrix.byteOffset, 64);

        

    }

    draw() {
        console.log("game draw");

        this.gpu.render(this.ctx.getCurrentTexture().createView(), (pass) => {
            this.starBackground.draw(pass);
        });

        // render?
    }

}


// ???
