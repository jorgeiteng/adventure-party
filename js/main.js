import { createInput } from "./input.js?v=5";
import { createCamera, updateCamera } from "./camera.js?v=5";
import { createGame, updateGame } from "./game.js?v=5";
import { drawWorld, drawEntities, drawPuzzleRunes, drawShrineRelics, setComplete } from "./render.js?v=5";

const VERSION = "0.13";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const input = createInput(canvas);
const camera = createCamera();
const game = createGame();
window.__hp = { game, input, camera };

document.getElementById("version").textContent = `v${VERSION}`;

let started = false;
const welcomeEl = document.getElementById("welcome");

function dismissWelcome() {
  if (started) return;
  started = true;
  welcomeEl.style.display = "none";
}

welcomeEl.addEventListener("click", dismissWelcome);
window.addEventListener("keydown", dismissWelcome, { once: false });
window.addEventListener("mousedown", dismissWelcome, { once: false });

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
  if (started) {
    updateGame(game, input, now, dt);
    updateCamera(camera, game.heroes[0], { width: camera.w, height: camera.h }, game.world);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const ratio = window.devicePixelRatio || 1;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawWorld(ctx, game.world, camera, now);
  drawPuzzleRunes(ctx, camera, game.puzzle, now);
  drawShrineRelics(ctx, camera, game.shrineRelics, now);
  drawEntities(ctx, camera, game.heroes, game.monsters, game.chests, now, game.cavernBoss, game.npcs);
  if (game.gameComplete) setComplete(true);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
