// récupérer le paramètre mode dans l'URL
const urlParams = new URLSearchParams(window.location.search);
let mode = urlParams.get("mode") || "3d";

// mettre à jour le select pour refléter le mode actuel
const select = document.getElementById("mode");
select.value = mode;

// quand on change de mode → recharge la page avec le bon paramètre
select.addEventListener("change", () => {
  window.location.search = "?mode=" + select.value;
});

async function startGame() {
  // importer dynamiquement selon le mode choisi
  const { default: WebGPU } = await import(`./${mode}/gpu.js`);
  const { default: AsteroidsGame } = await import(`./${mode}/game.js`);

  const gpu = await WebGPU.init();
  const game = new AsteroidsGame(gpu);

  window.addEventListener("resize", () => game.resize());

  await game.reset(2, 0.4);

  let p;
  function frame(ts) {
    const elapsed = (ts - p || 0) / 1000;
    p = ts;
    game.update(elapsed);
    game.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

startGame();
