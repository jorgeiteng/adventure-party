import { createInput } from "./input.js";
import { createCamera, updateCamera } from "./camera.js";
import { createGame, updateGame } from "./game.js?v=4";
import { drawWorld, drawEntities } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const input = createInput(canvas);
const camera = createCamera();
const game = createGame();
window.__hp = { game, input, camera };

function resize() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  camera.w = window.innerWidth;
  camera.h = window.innerHeight;
}

window.addEventListener("resize", resize);
resize();

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateGame(game, input, now, dt);
  updateCamera(camera, game.heroes[0], { width: camera.w, height: camera.h }, game.world);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ratio = window.devicePixelRatio || 1;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawWorld(ctx, game.world, camera, now);
  drawEntities(ctx, camera, game.heroes, game.monsters, game.chests, now);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
