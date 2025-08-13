
// this mat4 to use the matrix (we can do it manually)
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js";

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
        // create device?
        // some external object?
        
        // this.device = ??? requires lots of stuff in this class

        // this.renderer = new Renderer()? push details out to another class
        // this.computer = new Computer()?

        // this.renderPipeline = ???

        this.angleX = 0;
        this.angleY = 0;
        this.distance = 2;

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this._initMouseControls();


    }

    _initMouseControls() {
        this.canvas.addEventListener("mousedown", (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        window.addEventListener("mouseup", () => {
            this.isDragging = false;
        });

        window.addEventListener("mousemove", (e) => {
            if (!this.isDragging) return;

            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;

            this.angleY += dx * 0.005; 
            this.angleX += dy * 0.005;

            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        this.canvas.addEventListener("wheel", (e) => {
            this.distance += e.deltaY * 0.01;
            this.distance = Math.max(0.5, Math.min(5, this.distance));
        });
    }



    // createBackground(path) {

    // }

    async reset(nAsteroids, noise) {
        this.mvpBuffer = this.gpu.createImageBuffer();
        this.starBackground = await this.gpu.createBackground({
            // image: '3d/images/test.jpg', //it was a test with 3d photo !! you can test it
            image: '3d/images/test.jpg',
            shader: '3d/shaders/background.wgsl',
            mvpBuffer : this.mvpBuffer
        })

        this.angleX = 0;
        this.angleY = 0;
        // this.starBackgroundTexture = await this.gpu.createTexture('3d/images/stars.jpg');
        // this.starBackgroundBuffer = this.gpu.createImageBuffer();
        // this.starBackgroundSampler = this.gpu.createSampler();

        // this.starBackgroundRenderPipeline = this.gpu.createRenderPipeline({
        //     layout: "auto",
        //     vertex: {
        //         module,
        //         entryPoint: "vsMain"
        //     },
        //     fragment: {
        //         module,
        //         entryPoint: "fsMain",
        //         targets: this.ui.targets
        //     },
        //     primitive: { topology: "triangle-list" }
        // });

        // this.starBackgroundBindGroup = this.gpu.createBindGroup({
        //     label: `update ${collection.label} bindGroup`,
        //     layout: updatePipeline.getBindGroupLayout(1),
        //     entries: [
        //         { binding: 0, resource: { buffer: updateBuffer } },
        //         { binding: 1, resource: { buffer: this.frameBuffer } }
        //     ],
        // });
        //create asteroid data?
        // this.background = this.createBackground('3d/images/stars.jpg');
        // this.background.texture
        // this.background.sampler
        // this.background.buffer
        // this.backgroundBuffer = ??
        // this.backgroundSampler = ??

        console.log(this.starBackground);
        
    }

    update(elapsed) {
        // to make automatic rotation (can be removed)
        this.angleY += elapsed * 0.1;
        this.angleX += elapsed * 0.05;

        // create identity matrix
        const model = mat4.create();
        // rotate on x
        mat4.rotateX(model, model, this.angleX);
        // rotate on Y
        mat4.rotateY(model, model, this.angleY);
        // to show inside the sphere
        mat4.scale(model, model, [-1, 1, 1]);



        // crete the view matrix
        const view = mat4.create();


        // create the projection matrix
        const projection = mat4.create();
        mat4.perspective(projection, Math.PI / 2, this.canvas.width / this.canvas.height, 0.1, 2000);


        // create the model view proction matrix = the final one to calculate the procduct
        const mvp = mat4.create();
        // mvp = projection*view
        // mvp = mvp*model= projection*view*model
        mat4.multiply(mvp, projection, view);
        mat4.multiply(mvp, mvp, model);
        // we create the matrix on our buffer
        this.gpu.device.queue.writeBuffer(this.mvpBuffer, 0, mvp);
            //move things? Compute shader?
    }

    draw() {
        this.gpu.pass(this.ctx.getCurrentTexture().createView(), (pass) => {
            this.starBackground.draw(pass);
        });

        // render?
    }

}


// ???
