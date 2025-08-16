import WebGPU from "./3d/gpu.js";
import AsteroidsGame from "./3d/game.js";

const gpu = await WebGPU.init();
const game = new AsteroidsGame(gpu);

window.addEventListener('resize', ev => { 
    game.resize();
})

await game.reset(200, 0.4);

let p;
function frame(ts) {
    const elapsed = (ts - p || 0) / 1000;
    p = ts;
    game.update(elapsed);
    game.draw();
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
