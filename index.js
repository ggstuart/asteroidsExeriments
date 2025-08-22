import WebGPU from "./3d/gpu.js";
import AsteroidsGame from "./3d/game.js";
import { createCube } from "./3d/cube.js";
import { createSphere } from "./3d/sphere.js";

// récupérer le paramètre mode dans l'URL
const urlParams = new URLSearchParams(window.location.search);
let mode = urlParams.get("background") || "cube";

// mettre à jour le select pour refléter le mode actuel
const select = document.getElementById("background");
select.value = mode;

// quand on change de mode → recharge la page avec le bon paramètre
select.addEventListener("change", () => {
  window.location.search = "?background=" + select.value;
});

async function startGame() {
  // importer dynamiquement selon le mode choisi
  // const { default: WebGPU } = await import(`./${mode}/gpu.js`);
  // const { default: AsteroidsGame } = await import(`./${mode}/game.js`);
  let geometry = null;
  if (mode == "cube") {
    geometry = createCube();
  } else if (mode == "sphere") {
    geometry = createSphere();
  }

  const gpu = await WebGPU.init();
  const game = new AsteroidsGame(gpu);

  window.addEventListener("resize", () => game.resize());

  await game.reset(120, 0.4, geometry);

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
