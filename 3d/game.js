import Camera from './camera.js';
import Ship from './ship.js';


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

    async reset(nAsteroids, noise) {

        this.starBackground = await this.gpu.createBackground({
            image: '3d/images/stars.jpg',
            shader: '3d/shaders/cubeMap.wgsl'
        });

    }

    update(elapsed) {
        this.ship.update(elapsed);
        // const viewProjMatrix = this.ship.projectionMatrix;
        this.starBackground.writeBuffer(this.ship.projectionMatrix)
    }

    draw() {
        console.log("game draw");

        this.gpu.render(this.ctx.getCurrentTexture().createView(), (pass) => {
            this.starBackground.draw(pass);
            // Draw other stuff
        });
    }

}

