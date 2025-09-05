import { mat4, vec3 } from 'https://wgpu-matrix.org/dist/3.x/wgpu-matrix.module.min.js';

export default class Ship {
    constructor() {
        this.orientation = mat4.identity();
        this.position = vec3.create();
        this.velocity = vec3.create();
        this.turnPower = 1.5;
        this.thrustPower = 1.0; 
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

    moveLocal(forward, right, up) {
        const local = vec3.create(right, up, forward);
        const orientationOnly = mat4.clone(this.orientation);
        orientationOnly[12] = orientationOnly[13] = orientationOnly[14] = 0; 
        const world = vec3.transformMat4(local, orientationOnly);
        this.position[0] += world[0];
        this.position[1] += world[1];
        this.position[2] += world[2];
    }

    update(elapsed) {
        // const pitchRot = mat4.axisRotation(this.xAxis, this.pitchInput * this.turnPower * elapsed);
        // const yawRot  = mat4.axisRotation(this.yAxis, this.yawInput   * this.turnPower * elapsed);
        // const rollRot = mat4.axisRotation(this.zAxis, this.rollInput  * this.turnPower * elapsed);

        const pitchRot = mat4.rotationX(this.pitchInput * this.turnPower * elapsed);
        const yawRot   = mat4.rotationY(this.yawInput   * this.turnPower * elapsed);
        const rollRot  = mat4.rotationZ(this.rollInput  * this.turnPower * elapsed);

    const combinedRot = mat4.multiply(
            mat4.multiply(
                yawRot, 
                pitchRot
            ), 
            rollRot
        );
        this.orientation = mat4.multiply(this.orientation, combinedRot);

        const forward = vec3.negate(this.zAxis);
        
        const linearAcceleration = vec3.mulScalar(forward, this.thrustInput * this.thrustPower);

        this.velocity = vec3.add(this.velocity, vec3.mulScalar(linearAcceleration, elapsed));

        this.position = vec3.add(this.position, vec3.mulScalar(this.velocity, elapsed));
    }
}
