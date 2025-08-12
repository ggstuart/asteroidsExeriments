


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




    }


    createBackground(path) {

    }

    async reset(nAsteroids, noise) {
        this.starBackground = await this.gpu.createBackground({
            image: '3d/images/stars.jpg',
            shader: '3d/shaders/background.wgsl'
        })

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

    update() {
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
