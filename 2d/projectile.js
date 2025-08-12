export default class Projectile {
    constructor(position, speed) {
        this.position = position;
        this.speed = speed;
    }

    update(elapsed) {
        this.position.x += this.speed.x * elapsed;        
        this.position.y += this.speed.y * elapsed;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = "yellow";
        ctx.translate(this.position.x * ctx.canvas.width, this.position.y * ctx.canvas.height);
        ctx.arc(0, 0, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
    }
}