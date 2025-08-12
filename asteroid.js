export default class Asteroid {

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
