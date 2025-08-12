import Asteroid from "./asteroid.js";
import Projectile from "./projectile.js";
import Ship from "./ship.js";

export default class AsteroidsGame {
    constructor(canvas, noise) {        
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.noise = noise;
        this.keys = {'ArrowLeft': false, 'ArrowRight': false, 'ArrowUp': false, 'ArrowDown': false, " ": false};
        this.ship = new Ship()
        this.projectiles = [];
        this.totalCooldown = 0.1;
        this.weaponCooldown = 0;
        window.addEventListener('keydown', ev => this.keys[ev.key] = true);
        window.addEventListener('keyup', ev => this.keys[ev.key] = false);
    }

    reset(length) {
        this.asteroids = Array.from({length}, () => Asteroid.random(this.noise));
    }

    draw() {       
        // console.log(this.projectiles);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const asteroid of this.asteroids) {
            asteroid.draw(this.ctx);
        }
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx);
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
    get shooting() {
        return this.keys[' '];
    }

    update(elapsed) {
        for (const asteroid of this.asteroids) {
            asteroid.update(elapsed);
        }
        for (const projectile of this.projectiles) {
            projectile.update(elapsed);
        }
        this.projectiles = this.projectiles.filter(p => {
            return p.position.x >= 0 &&
                   p.position.x <= 1 &&
                   p.position.y >= 0 &&
                   p.position.y <= 1;
        });
        
        this.weaponCooldown -= elapsed;
        if(this.shooting && this.weaponCooldown <= 0) {
            this.weaponCooldown = this.totalCooldown;
            this.projectiles.push(this.ship.spawnProjectile());            
        }
        this.ship.update(this.rotation, this.thrust, elapsed);

    }
}

