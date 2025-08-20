import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';


export default class Ship {
    constructor() {
        this.orientation = mat4.identity();
        this.position = vec3.create();        
        this.velocity = vec3.create();
        this.angularVelocity = vec3.create();
        this.turnPower = 0.5; // radiansPerSecondPerSecond?
        this.thrustPower = 1; // mPerSecondPerSecond?
        this.pitchInput = 0;
        this.yawInput = 0;
        this.rollInput = 0;
        this.thrustInput = 0;
    }

    get location() { 
        return mat4.translate(this.orientation, this.position);
    }

    get xAxis() {
        return mat4.getAxis(this.orientation, 0);
    }
    get yAxis() {
        return mat4.getAxis(this.orientation, 1);
    }
    get zAxis() {
        return mat4.getAxis(this.orientation, 2);
    }

    get angularAcceleration() {
        return vec3.create(
            this.pitchInput * this.turnPower,
            this.yawInput * this.turnPower,
            this.rollInput * this.turnPower
        );
    }

    get acceleration() { 
        const xRot = mat4.axisRotation(this.xAxis, this.y * this.rotatePower);
        const yRot = mat4.axisRotation(this.yAxis, this.x * this.rotatePower);
        const zRot = mat4.axisRotation(this.zAxis, this.z * this.rotatePower);
        return mat4.multiply(mat4.multiply(xRot, yRot),zRot);
    }

    update(elapsed) {
        this.angularVelocity = vec3.add(this.angularVelocity, vec3.scale(this.angularAcceleration, elapsed));

        //Damping for auto-inertia cancellation
        const damping = Math.pow(0.99, elapsed / (1/60)); // Exponential decay
        this.angularVelocity = vec3.mulScalar(this.angularVelocity, damping);

        const pitchAngle = this.angularVelocity[0] * elapsed;
        const yawAngle = this.angularVelocity[1] * elapsed;
        const rollAngle = this.angularVelocity[2] * elapsed;
        const pitchRot = mat4.axisRotation(this.xAxis, pitchAngle);
        const yawRot = mat4.axisRotation(this.yAxis, yawAngle);
        const rollRot = mat4.axisRotation(this.zAxis, rollAngle);
        
        const combinedRot = mat4.multiply(mat4.multiply(yawRot, pitchRot), rollRot);
        const linearAcceleration = vec3.scale(this.zAxis, this.thrustInput * this.thrustPower);

        this.orientation = mat4.multiply(this.orientation, combinedRot);
        this.velocity = vec3.add(this.velocity, vec3.scale(linearAcceleration, elapsed));
        this.position = vec3.add(this.position, vec3.scale(this.velocity, elapsed));

        // this.velocity = mat4.multiply(this.acceleration, this.velocity);
        // this.position = mat4.multiply(this.position, this.velocity);
    }


}
