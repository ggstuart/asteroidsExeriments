import Asteroids from './asteroid.js';
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

        // stores elapsed time
        this.frameBuffer = gpu.createUniformBuffer(4);
        // stores camera data
        this.projectionMatrixBuffer = gpu.createUniformBuffer(144);        
        const camera = new Camera(this.canvas);
        this.ship = new Ship(camera);

    }

    resize() {
        resize(this.canvas);
    }

    async reset(nAsteroids, noise) {

        this.starBackground = await this.gpu.createBackground({
            image: '3d/images/stars.jpg',
            shader: '3d/shaders/cubeMap.wgsl',
            projectionMatrixBuffer: this.projectionMatrixBuffer
        });

        this.asteroids = await Asteroids.withModule(
            this.gpu,
            this.frameBuffer,
            this.projectionMatrixBuffer,
            nAsteroids,
            noise
        );

    }

    update(elapsed) {

        // tells the compute shader how much time has elapsed
        this.gpu.writeBuffer(this.frameBuffer, 0, new Float32Array([elapsed]));
        this.ship.update(elapsed);

        // tells the render shaders about the ship angle
        this.gpu.writeBuffer(this.projectionMatrixBuffer, 0, this.ship.projectionMatrix.buffer, this.ship.projectionMatrix.byteOffset, 64);
        // this.asteroids.writeBuffer(this.ship.projectionMatrix)
        
        this.gpu.compute((pass) => {
            this.asteroids.compute(pass);
        }, (encoder) => {
            this.asteroids.copy(encoder);
        });

    }

    draw() {
        // console.debug("game draw");
        this.gpu.render(this.ctx.getCurrentTexture().createView(), (pass) => {
            this.starBackground.draw(pass);
            this.asteroids.draw(pass);
            // Draw other stuff
        });
    }

}

