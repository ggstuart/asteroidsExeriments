struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec3<f32>, // 3D direction for cube map
};

struct Background {
    mvpMatrix: mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> background: Background;
@group(0) @binding(1) var my_sampler: sampler;
@group(0) @binding(2) var texture: texture_cube<f32>;

@vertex
fn vsMain(
        @location(0) pos: vec3<f32>,
        @location(1) uv : vec2<f32>
    ) -> VertexOutput {
    var out: VertexOutput;
    // Transform cube vertices by MVP (includes translation to ship.position)
    out.position = background.mvpMatrix * vec4<f32>(pos, 1.0);
    // Set depth to max (z/w = 1.0) to render behind other objects
    out.position.z = out.position.w;
    // Pass vertex position as cube map direction
    out.texCoord = pos;
    return out;
}

@fragment
fn fsMain(in: VertexOutput) -> @location(0) vec4<f32> {
    // Sample cube map with 3D direction
    return textureSample(texture, my_sampler, in.texCoord);
}