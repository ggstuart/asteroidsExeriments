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
            " ": false
        };
        window.addEventListener('keydown', ev => this.keys[ev.key] = true);
        window.addEventListener('keyup', ev => this.keys[ev.key] = false);
    }

    get x() {
        return this.keys.d - this.keys.a;
    }
    get y() {
        return this.keys.s - this.keys.w;
    }
    get z() {
        return this.keys.ArrowLeft - this.keys.ArrowRight
    }
    get fov() {
        return this.keys.ArrowUp - this.keys.ArrowDown
    }
    get thrust() { 
        return this.keys[" "];
    }
}
