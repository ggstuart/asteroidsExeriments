

export default class AsteroidsGame {
    constructor(noise) {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.append(this.canvas);
        document.body.style.display = "grid";
        document.body.style.margin = "0";
        document.body.style.minHeight = "100dvh";
        this.canvas.height = document.body.clientHeight;
        this.canvas.width = document.body.clientWidth;   
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


class Ship {
    constructor() {
        this.size = 0.025;
        this.turnPower = 5;
        this.thrustPower = 0.4;
        this.position = {
            x: 0.5,
            y: 0.5,
            angle: 0
        }
        this.speed = {
            x: 0, 
            y: 0,
            rotation: 0
        }
        this.acceleration = {
            x: 0,
            y: 0,
            rotation: 0
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = "#ffbb00";
        ctx.translate(this.position.x * ctx.canvas.width, this.position.y * ctx.canvas.height);
        ctx.rotate(this.position.angle);
        ctx.lineTo(ctx.canvas.width * this.size, 0);
        ctx.rotate(2 * Math.PI / 3);
        ctx.lineTo(ctx.canvas.width * this.size / 2, 0);
        ctx.rotate(2 * Math.PI / 3);
        ctx.lineTo(ctx.canvas.width * this.size / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    update(rotation, thrust, elapsed) {

        this.acceleration.rotation = rotation * this.turnPower;        
        this.acceleration.x = Math.cos(this.position.angle) * thrust * this.thrustPower;
        this.acceleration.y = Math.sin(this.position.angle) * thrust * this.thrustPower;

        

        this.speed.x += this.acceleration.x * elapsed;
        this.speed.y += this.acceleration.y * elapsed;
        this.speed.rotation += this.acceleration.rotation * elapsed;
        this.position.x += this.speed.x * elapsed;
        this.position.y += this.speed.y * elapsed;
        this.position.angle += this.speed.rotation * elapsed;


        if(this.position.x > 1) {
            this.position.x -= 1;
        }
        if(this.position.x <= 0) {
            this.position.x += 1;
        }
        if(this.position.y > 1) {
            this.position.y -= 1;
        }
        if(this.position.y <= 0) {
            this.position.y += 1;
        }

    }
}

class Asteroid {

    static random(noise) {
        return new Asteroid({
            noise,
            radius: 100,
            shape: Array.from({length: 24}, () => (1 + noise * (Math.random() - 0.5))),
            position: {
                x: Math.random() - 0.5,
                y: Math.random() - 0.5
            },
            speed: {
                x: (Math.random() - 0.5) * 0.2,
                y: (Math.random() - 0.5) * 0.2,
                rotation: (Math.random() - 0.5) * Math.PI
            }
        })
    }

    constructor({ noise, radius, shape, position, speed }) {
        this.noise = noise;
        this.radius = radius;
        this.shape = shape;
        this.segmentAngle = 2 * Math.PI / this.shape.length;
        this.position = position;
        this.angle = 0;
        this.speed = speed
    }

    

    _draw(ctx, x, y) {
        ctx.beginPath();
        ctx.save();
        ctx.fillStyle = "#dddddd";
        // ctx.translate(this.position.x * ctx.canvas.width, this.position.y * ctx.canvas.height);
        ctx.translate(x * ctx.canvas.width, y * ctx.canvas.height);
        ctx.rotate(this.angle);
        for(const index in this.shape) {
            const radius = this.shape[index] * this.radius;
            ctx.lineTo(radius, 0);
            ctx.rotate(this.segmentAngle);
        }
        ctx.closePath()
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
    }

    draw(ctx) {
        this._draw(ctx, this.position.x, this.position.y);
        const buffer = (this.radius * (1 + this.noise)) / ctx.canvas.width;
        if(this.position.x >= (1 - buffer)) {
            this._draw(ctx, this.position.x - 1, this.position.y);
        }
        if(this.position.x <= (buffer)) {
            this._draw(ctx, this.position.x + 1, this.position.y);
        }
        if(this.position.y >= (1 - buffer)) {
            this._draw(ctx, this.position.x, this.position.y - 1);
        }
        if(this.position.y <= (buffer)) {
            this._draw(ctx, this.position.x, this.position.y + 1);
        }
    }

    update(elapsed) {
        this.position.x += this.speed.x * elapsed;
        this.position.y += this.speed.y * elapsed;
        this.angle += this.speed.rotation * elapsed;
        if(this.position.x > 1) {
            this.position.x -= 1;
        }
        if(this.position.x <= 0) {
            this.position.x += 1;
        }
        if(this.position.y > 1) {
            this.position.y -= 1;
        }
        if(this.position.y <= 0) {
            this.position.y += 1;
        }
    }
}
