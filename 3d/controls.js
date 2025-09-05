export default class Controls {
    constructor() {
        this.keys = { 
            'a': false, 
            's': false, 
            'd': false, 
            'w': false,
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            " ": false,
            Shift: false
        };
        window.addEventListener('keydown', ev => this.keys[ev.key] = true);
        window.addEventListener('keyup', ev => this.keys[ev.key] = false);
    }

    updateCamera(camera) {
        if (this.keys.ArrowLeft) camera.turnLeft(0.05);
        if (this.keys.ArrowRight) camera.turnRight(0.05);
    }

    get x() {
        return this.keys.ArrowRight - this.keys.ArrowLeft
    }
    get y() {
        return this.keys.s - this.keys.w;
    }
    get z() {
        return this.keys.d - this.keys.a;
    }
    
    get fovZoomOut() { 
        return this.keys[" "]; 
    }

    get fovZoomIn() { 
        return this.keys.Shift; 
    }

    get thrust() { 
        return this.keys.ArrowUp - this.keys.ArrowDown
    }
}