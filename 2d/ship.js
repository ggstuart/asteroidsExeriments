import Projectile from "./projectile.js";

export default class Ship {
    constructor() {
        this.size = 0.025;
        this.turnPower = 5;
        this.thrustPower = 0.4;
        this.weaponPower = 0.5;
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
        ctx.fillStyle = "white";
        ctx.translate(this.position.x * ctx.canvas.width, this.position.y * ctx.canvas.height);
        ctx.rotate(this.position.angle);
        ctx.lineTo(ctx.canvas.width * this.size, 0);
        ctx.lineTo(ctx.canvas.width * this.size * 1.2, 0);
        ctx.lineTo(ctx.canvas.width * this.size, 0);
        ctx.rotate(2 * Math.PI / 3);
        ctx.lineTo(ctx.canvas.width * this.size / 2, 0);
        ctx.rotate(2 * Math.PI / 3);
        ctx.lineTo(ctx.canvas.width * this.size / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
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

    get xComponent() {
        return Math.cos(this.position.angle);
    }
    get yComponent() {
        return Math.sin(this.position.angle);
    }

    get weaponTip() {
        return {
            x: this.position.x + this.xComponent * this.size,
            y: this.position.y + this.yComponent * this.size,
        }
    }

    spawnProjectile() {
        return new Projectile(this.weaponTip, {
            x: this.speed.x + Math.cos(this.position.angle) * this.weaponPower,
            y: this.speed.y + Math.sin(this.position.angle) * this.weaponPower,
        });
    }
}

