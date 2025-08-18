struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) colour: vec4<f32>
};

struct Asteroid {
    transformationMatrix: mat4x4<f32>
};

struct Frame {
    elapsed: f32
};

@group(0) @binding(0) var<uniform> viewProj: mat4x4<f32>;
@group(0) @binding(1) var<storage> asteroids: array<Asteroid>;

@vertex
fn vsMain(@builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32, @location(0) position: vec3<f32>) -> VertexOutput {
    var output: VertexOutput;
    let asteroid = asteroids[instanceIndex];
    output.colour = vec4(position.z + position.x, position.x + position.y, 1 - position.y, 1);
    output.position = viewProj * (vec4<f32>(position, 1) * asteroid.transformationMatrix);
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    return input.colour;//vec4(1, input.position.x, 0, 1);
}


@group(1) @binding(0) var<storage, read_write> movement: array<Asteroid>;
@group(1) @binding(1) var<storage, read_write> location: array<Asteroid>;
@group(1) @binding(2) var<uniform> frame: Frame;

@compute
@workgroup_size(1)
fn cpMain(@builtin(global_invocation_id) id: vec3u) {
    let elapsed = frame.elapsed;
    let previousLocation = location[id.x].transformationMatrix;
    let motion = movement[id.x].transformationMatrix;
    location[id.x].transformationMatrix = previousLocation * motion;
}