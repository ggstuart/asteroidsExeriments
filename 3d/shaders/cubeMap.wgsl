struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vDir: vec3<f32>,
};

@group(0) @binding(0) var<uniform> viewProj: mat4x4<f32>;
@group(0) @binding(1) var skyboxSampler: sampler;
@group(0) @binding(2) var skyboxTexture: texture_cube<f32>;

@vertex
fn vsMain(@location(0) position: vec3<f32>) -> VertexOutput {
    var output: VertexOutput;
    output.vDir = position;
    output.position = viewProj * vec4<f32>(position, 1.0);
    return output;
}

@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    var result1 = textureSample(skyboxTexture, skyboxSampler, normalize(input.vDir));
    var result2 = vec4<f32>(1.0, 0.0, 0.0, 1.0);
    return result1;
}