struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texture: vec2<f32>,
    @location(1) normal: vec3<f32>, 
};

struct Asteroid {
    transformationMatrix: mat4x4<f32>
};

struct Frame {
    elapsed: f32
};

@group(0) @binding(0) var<uniform> viewProj: mat4x4<f32>;
@group(0) @binding(1) var<storage> asteroids: array<Asteroid>;
@group(0) @binding(2) var my_sampler: sampler;
@group(0) @binding(3) var texture: texture_2d<f32>;


@vertex
fn vsMain(  @builtin(vertex_index) vertexIndex: u32, 
            @builtin(instance_index) instanceIndex: u32, 
            @location(0) position: vec3<f32>, 
            @location(1) texture : vec2<f32>,
            @location(2) normal: vec3<f32>  ) 
    -> VertexOutput {
    var output: VertexOutput;
    let asteroid = asteroids[instanceIndex];
    let worldPos = (vec4<f32>(position, 1) * asteroid.transformationMatrix).xyz;
    let worldNormal = normalize((vec4<f32>(normal, 0) * asteroid.transformationMatrix).xyz);
    output.normal = worldNormal;
    output.texture = texture;
    output.position = viewProj * vec4<f32>(worldPos, 1);
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    // return input.colour;//vec4(1, input.position.x, 0, 1);
    let color = textureSample(texture, my_sampler, input.texture);
    // let color = vec2<f32>(1.0, 1.0);

    // Simple lumière directionnelle
    let lightDir = normalize(vec3<f32>(0.5, 0.7, 1.0));
    // let diffuse = max(dot(input.normal, lightDir), 0.4);

    let diffuse = dot(input.normal, lightDir);

    return vec4(color.rgb * diffuse, color.a);}


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