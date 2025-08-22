export function createSphere(rad = 1, latSeg = 64, longSeg = 128) {
        const vertices = [];
        const indices = [];

        // Génération des sommets
        for (let y = 0; y <= latSeg; y++) {
            const teta = y * Math.PI / latSeg;
            const sinTeta = Math.sin(teta);
            const cosTeta = Math.cos(teta);

            for (let x = 0; x <= longSeg; x++) {
                const phi = x * 2 * Math.PI / longSeg;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const vx = rad * sinTeta * cosPhi;
                const vy = rad * cosTeta;
                const vz = rad * sinTeta * sinPhi;

                const u = x / longSeg;
                const v = y / latSeg;

                vertices.push(vx, vy, vz, u, v);

                const i1 = y * (longSeg + 1) + x; 
                const i2 = i1 + longSeg + 1; 
                indices.push(i1, i2, i1 + 1);
                indices.push(i1 + 1, i2, i2 + 1); 
            }
        }

        return {
            vertices: new Float32Array(vertices),
            indices: new Uint16Array(indices),
            length: vertices.length/(5*4)
        };
    }