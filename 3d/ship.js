import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';


export default class Ship {
    constructor() {

        this.orientation = mat4.identity();
        // this.orientation = mat4.rotateY(this.orientation, Math.PI / 4);
        this.position = vec3.create();        

        this.angularVelocity = vec3.create();
        this.velocity = vec3.create();

        this.turnPower = 0.5; // radiansPerSecondPerSecond?
        this.thrustPower = 1; // mPerSecondPerSecond?
        this.pitchInput = 0;
        this.yawInput = 0;
        this.rollInput = 0;
        this.thrustInput = 0;
    }

    get transformationMatrix() { 
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

    get input() {
        return vec3.create(this.pitchInput, this.yawInput, this.rollInput);
    }

    get angularAcceleration() {
        return vec3.mulScalar(this.input, this.turnPower);
    }

    update(elapsed) {
        this.angularVelocity = vec3.add(
            this.angularVelocity, 
            vec3.mulScalar(this.angularAcceleration, elapsed)
        );

        //Damping for auto-inertia cancellation
        const dampingPerSecond = 0.99; // Decay to 99% per second
        const damping = Math.pow(dampingPerSecond, elapsed);
        this.angularVelocity = vec3.mulScalar(this.angularVelocity, damping);

        // const damping = Math.pow(0.99, elapsed / (1/60)); // Exponential decay
        // this.angularVelocity = vec3.mulScalar(this.angularVelocity, damping);

        const angle = vec3.mulScalar(this.angularVelocity, elapsed);

        const pitchRot = mat4.axisRotation(this.xAxis, angle[0]);
        const yawRot = mat4.axisRotation(this.yAxis, angle[1]);
        const rollRot = mat4.axisRotation(this.zAxis, angle[2]);

        const combinedRot = mat4.multiply(
            mat4.multiply(
                yawRot, 
                pitchRot
            ), 
            rollRot
        );

        
        this.orientation = mat4.multiply(this.orientation, combinedRot);
        // this.orientation = mat4.ortho(this.orientation);
        
        
        const linearAcceleration = vec3.mulScalar(this.zAxis, this.thrustInput * this.thrustPower);
        
        this.velocity = vec3.add(this.velocity, vec3.mulScalar(linearAcceleration, elapsed));
        
        this.position = vec3.add(this.position, vec3.mulScalar(this.velocity, elapsed));
        
        // this.velocity = mat4.multiply(this.acceleration, this.velocity);
        // this.position = mat4.multiply(this.position, this.velocity);
    }


}
