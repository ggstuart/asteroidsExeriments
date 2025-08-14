struct VertexOutput {
    @builtin(position) position: vec4<f32>
};

struct Asteroid {
    transformationMatrix: mat4x4<f32>
};

@group(0) @binding(0) var<uniform> viewProj: mat4x4<f32>;
@group(0) @binding(1) var<storage> asteroids: array<Asteroid>;

@vertex
fn vsMain(@builtin(instance_index) instanceIndex: u32, @location(0) position: vec3<f32>) -> VertexOutput {
    var output: VertexOutput;
    let asteroid = asteroids[instanceIndex];
    output.position = viewProj * (vec4<f32>(position, 1) * asteroid.transformationMatrix);
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    return vec4(1, 0, 0, 1);
}