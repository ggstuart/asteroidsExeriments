export function createCube() {
    const vertices = [
        -1, -1, -1,  // 0
        1, -1, -1,  // 1
        1,  1, -1,  // 2
        -1,  1, -1,  // 3
        -1, -1,  1,  // 4
        1, -1,  1,  // 5
        1,  1,  1,  // 6
        -1,  1,  1   // 7
    ];

    const indices = [
    // back face (z = -1)
        0, 1, 2,
        2, 3, 0,

        // front face (z = +1)
        4, 5, 6,
        6, 7, 4,

        // top face (y = +1)
        3, 2, 6,
        6, 7, 3,

        // bottom face (y = -1)
        0, 1, 5,
        5, 4, 0,

        // right face (x = +1)
        1, 2, 6,
        6, 5, 1,

        // left face (x = -1)
        0, 3, 7,
        7, 4, 0
    ];

    return {
        vertices : new Float32Array(vertices),
        indices : new Uint16Array(indices),
        length : vertices.length/3
    };
} 