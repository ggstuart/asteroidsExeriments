import AsteroidsGame from "./2d/game.js";

const canvas = document.createElement('canvas');
document.body.append(canvas);
document.body.style.display = "grid";
document.body.style.margin = "0";
document.body.style.minHeight = "100dvh";
canvas.style.backgroundColor = "black";
canvas.height = document.body.clientHeight;
canvas.width = document.body.clientWidth;

const game = new AsteroidsGame(canvas, 0.4);
game.reset(2);

let p;
function frame(ts) {
    const elapsed = (ts - p || 0) / 1000;
    p = ts;
    game.update(elapsed);
    game.draw();
    requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
