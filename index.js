const urlParams = new URLSearchParams(window.location.search);
let backgroundType = urlParams.get("mode") || "cubique";

const select = document.getElementById("mode");
select.value = backgroundType;

select.addEventListener("change", () => {
    window.location.search = "?mode=" + select.value;
});

async function startGame() {
    const { default: WebGPU } = await import(`./3d/gpu.js`);
    const { default: AsteroidsGame } = await import(`./3d/game.js`);

    const gpu = await WebGPU.init();
    const game = new AsteroidsGame(gpu, backgroundType);

    window.addEventListener("resize", () => game.resize());

    await game.reset(120, 0.4);

    let p;
    function frame(ts) {
        const elapsed = (ts - p || 0) / 1000;
        p = ts;
        game.controls.updateCamera(game.camera, game.ship);
        game.update(elapsed);
        game.draw();
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

startGame();
