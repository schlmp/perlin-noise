const p = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
];

for (let i = 0; i < 256; i++) {
    p.push(p[i]);
}

const sqrtOneHalf = Math.sqrt(0.5);

const g = [
    [0, 1],
    [sqrtOneHalf, sqrtOneHalf],
    [1, 0],
    [sqrtOneHalf, -sqrtOneHalf],
    [0, -1],
    [-sqrtOneHalf, -sqrtOneHalf],
    [-1, 0],
    [-sqrtOneHalf, sqrtOneHalf]
];

function getGradient(x, y) {
    x = x % 256;
    y = y % 256;
    gradientIndex = p[p[x] + y];
    return g[gradientIndex % 8];
}

function lerp(a0, a1, w) {
    return (1 - w) * a0 + w * a1;
}

function dotGridGradient(ix, iy, x, y) {
    let dx = x - ix;
    let dy = y - iy;
    let gradient = getGradient(ix, iy);
    return dx * gradient[0] + dy * gradient[1];
}

function fade(x) {
    return x * x * x * (x * (x * 6 - 15) + 10);
}

function perlin(x, y) {
    let x0 = Math.floor(x);
    let x1 = x0 + 1;
    let y0 = Math.floor(y);
    let y1 = y0 + 1;

    let sx = x - x0;
    let sy = y - y0;

    let fx = fade(sx);
    let fy = fade(sy);

    let n0 = dotGridGradient(x0, y0, x, y);
    let n1 = dotGridGradient(x1, y0, x, y);
    let ix0 = lerp(n0, n1, fx);

    n0 = dotGridGradient(x0, y1, x, y);
    n1 = dotGridGradient(x1, y1, x, y);
    let ix1 = lerp(n0, n1, fx);

    return lerp(ix0, ix1, fy);
}

const gl = document.getElementById("gl").getContext("webgl");
const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

const uniforms = {
    u_mvp: twgl.m4.idendity
};

const X_OFFSET = 0.1;
const Z_OFFSET = 0.1;

const noise_grid = [];
for (let z = 0; z < 20; z += Z_OFFSET) {
    let line = [];
    for (let x = 0; x < 30; x += X_OFFSET) {
        line.push([x, perlin(x, z), z]);
    }
    noise_grid.push(line);
}

const drawObjects = [];
noise_grid.forEach(function (line) {
    let l = {
        a_position: {
            numComponents: 3,
            data: line.flat()
        }
    };

    drawObjects.push({
        programInfo: programInfo,
        bufferInfo: twgl.createBufferInfoFromArrays(gl, l),
        type: gl.LINE_STRIP
    });
});

let cur_end = 20;

function render(time) {
    time *= 0.004;

    const projection_matrix = twgl.m4.perspective(0.5, gl.canvas.width / gl.canvas.height, 0.1, 50);
    const view_matrix = twgl.m4.lookAt([15, 5, -4 + time], [15, 0, 6 + time], [0, 1, 0]);
    twgl.m4.inverse(view_matrix, view_matrix);
    const view_projection_matrix = twgl.m4.multiply(projection_matrix, view_matrix);
    const model_matrix = twgl.m4.rotationX(0);
    const mvp_matrix = twgl.m4.multiply(view_projection_matrix, model_matrix);

    for (let i = cur_end; i < parseInt((time + 21) / Z_OFFSET) * Z_OFFSET; i += Z_OFFSET) {
        let line = [];
        for (let x = 0; x < 30; x += X_OFFSET) {
            line.push([x, perlin(x, cur_end), cur_end]);
        }

        noise_grid.push(line);
        noise_grid.shift();

        let l = {
            a_position: {
                numComponents: 3,
                data: line.flat()
            }
        };

        drawObjects.push({
            programInfo: programInfo,
            bufferInfo: twgl.createBufferInfoFromArrays(gl, l),
            type: gl.LINE_STRIP
        });
        drawObjects.shift();

        cur_end += Z_OFFSET;
    }

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 0.85);
    gl.clear(gl.COLOR_BUFFER_BIT);

    uniforms.u_mvp = mvp_matrix;

    gl.useProgram(programInfo.program);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawObjectList(gl, drawObjects);
    requestAnimationFrame(render);
}

requestAnimationFrame(render);
