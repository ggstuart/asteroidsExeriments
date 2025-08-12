struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) normal: vec2<f32>
};


struct Background {
    mvpMatrix: mat4x4<f32>,
    normalMatrix: mat4x4<f32>,
    lightDir: vec4<f32>
}

@group(0) @binding(0) var<uniform> background: Background;
@group(0) @binding(1) var my_sampler: sampler;
@group(0) @binding(2) var texture: texture_2d<f32>;

@vertex
fn vsMain() -> VertexOutput {
    let a = background;
    var out: VertexOutput;
    return out;
}

@fragment
fn fsMain(
    @location(0) uv: vec2<f32>,
    @location(1) position: vec2<f32>
) -> @location(0) vec4<f32> {
    return textureSample(texture, my_sampler, uv);
}