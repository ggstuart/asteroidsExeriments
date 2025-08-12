import AsteroidsGame from "./asteroids.js";

const game = new AsteroidsGame(0.4);
game.reset(2);
game.draw();

let p;
function frame(ts) {
    const elapsed = (ts - p || 0) / 1000;
    p = ts;
    game.update(elapsed);
    game.draw();
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
