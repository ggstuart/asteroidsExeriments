import Asteroid from "./asteroid.js";
import Ship from "./ship.js";

export default class AsteroidsGame {
    constructor(canvas, noise) {        
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.noise = noise;
        this.keys = {'ArrowLeft': false, 'ArrowRight': false, 'ArrowUp': false, 'ArrowDown': false};
        this.ship = new Ship()
        window.addEventListener('keydown', ev => this.keys[ev.key] = true);
        window.addEventListener('keyup', ev => this.keys[ev.key] = false);
    }

    reset(length) {
        this.asteroids = Array.from({length}, () => Asteroid.random(this.noise));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const asteroid of this.asteroids) {
            asteroid.draw(this.ctx);
        }
        this.ship.draw(this.ctx);
    }

    // User input
    get rotation() {
        return this.keys['ArrowRight'] - this.keys['ArrowLeft'];
    }
    get thrust() {
        return this.keys['ArrowUp'] - this.keys['ArrowDown'];
    }

    update(elapsed) {
        for (const asteroid of this.asteroids) {
            asteroid.update(elapsed);
        }
        this.ship.update(this.rotation, this.thrust, elapsed);
    }
}

