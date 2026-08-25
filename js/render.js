import { TILE, MAP_W, MAP_H, Tiles, tileAt } from "./world.js?v=3";
import { worldToScreen } from "./camera.js";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGrass(ctx, x, y, variant) {
  ctx.fillStyle = variant > 0.5 ? "#4f9a4a" : "#458b42";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "rgba(210, 230, 120, 0.18)";
  ctx.fillRect(x + 4, y + 6, 5, 3);
  ctx.fillRect(x + 18, y + 20, 6, 3);
}

function drawFlowers(ctx, x, y) {
  drawGrass(ctx, x, y, 0.2);
  const petals = ["#f2d66b", "#e889b0", "#f4f0e0"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = petals[i];
    ctx.beginPath();
    ctx.arc(x + 8 + i * 8, y + 10 + (i % 2) * 10, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPath(ctx, x, y) {
  ctx.fillStyle = "#c4a36a";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#a9844f";
  ctx.fillRect(x + 6, y + 10, 4, 3);
  ctx.fillRect(x + 18, y + 20, 5, 3);
}

function drawWater(ctx, x, y, time) {
  const wave = Math.sin(time / 400 + x * 0.04 + y * 0.03);
  ctx.fillStyle = wave > 0 ? "#3a8fc4" : "#2f7aaf";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "rgba(190, 230, 255, 0.25)";
  ctx.fillRect(x + 4, y + 12 + wave * 3, 14, 2);
}

function drawTree(ctx, x, y) {
  ctx.fillStyle = "#3d7a38";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#6b4220";
  ctx.fillRect(x + 13, y + 18, 6, 12);
  ctx.fillStyle = "#2f6b32";
  ctx.beginPath();
  ctx.arc(x + 16, y + 14, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4f9a4a";
  ctx.beginPath();
  ctx.arc(x + 11, y + 12, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(ctx, x, y) {
  ctx.fillStyle = "#6d7a68";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#8b9684";
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 18, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5c6658";
  ctx.beginPath();
  ctx.ellipse(x + 12, y + 17, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawShrine(ctx, x, y, time) {
  ctx.fillStyle = "#d7c89a";
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = "#b9a36f";
  ctx.fillRect(x + 4, y + 20, 24, 8);
  const glow = 0.45 + Math.sin(time / 280) * 0.25;
  ctx.fillStyle = `rgba(120, 210, 255, ${glow})`;
  ctx.fillRect(x + 13, y + 4, 6, 18);
  ctx.fillStyle = "#f4e8b0";
  ctx.beginPath();
  ctx.arc(x + 16, y + 6, 5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawWorld(ctx, world, camera, time) {
  const minTx = Math.max(0, Math.floor(camera.x / TILE));
  const maxTx = Math.min(MAP_W - 1, Math.floor((camera.x + camera.w) / TILE));
  const minTy = Math.max(0, Math.floor(camera.y / TILE));
  const maxTy = Math.min(MAP_H - 1, Math.floor((camera.y + camera.h) / TILE));

  ctx.fillStyle = "#2a5a38";
  ctx.fillRect(0, 0, camera.w, camera.h);

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const tile = tileAt(world, tx, ty);
      const p = worldToScreen(camera, tx * TILE, ty * TILE);
      if (tile === Tiles.FLOWERS) drawFlowers(ctx, p.x, p.y);
      else if (tile === Tiles.PATH) drawPath(ctx, p.x, p.y);
      else if (tile === Tiles.WATER) drawWater(ctx, p.x, p.y, time);
      else if (tile === Tiles.TREE) drawGrass(ctx, p.x, p.y, 0.7);
      else if (tile === Tiles.ROCK) drawGrass(ctx, p.x, p.y, 0.4);
      else if (tile === Tiles.SHRINE) drawShrine(ctx, p.x, p.y, time);
      else drawGrass(ctx, p.x, p.y, (tx * 13 + ty * 7) % 10 / 10);
    }
  }

  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const tile = tileAt(world, tx, ty);
      const p = worldToScreen(camera, tx * TILE, ty * TILE);
      if (tile === Tiles.TREE) drawTree(ctx, p.x, p.y);
      if (tile === Tiles.ROCK) drawRock(ctx, p.x, p.y);
    }
  }
}

function drawCreature(ctx, camera, entity, time) {
  if (entity.hp <= 0) return;
  const p = worldToScreen(camera, entity.x, entity.y);
  const flash = time < entity.flashUntil;
  const hover = entity.hover ? Math.sin(time / 180) * 3 : 0;
  const bodyY = p.y - hover;

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + entity.r * 0.7, entity.r * 0.9, entity.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#fff6d8" : entity.color;
  ctx.beginPath();
  ctx.ellipse(p.x, bodyY, entity.r * 0.95, entity.r * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#fff" : entity.accent;
  ctx.beginPath();
  ctx.arc(p.x + entity.facing.x * 2, bodyY - entity.r * 0.55, entity.r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  if (entity.kind === "hero") {
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, bodyY, entity.r + 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (time < entity.swingUntil) {
    ctx.strokeStyle = entity.kind === "hero" ? "#f4ead0" : "#c45c4a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const ang = Math.atan2(entity.facing.y, entity.facing.x);
    ctx.arc(p.x, bodyY, entity.r + entity.attackRange * 0.55, ang - 0.9, ang + 0.9);
    ctx.stroke();
  }

  const ratio = entity.hp / entity.maxHp;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  roundRect(ctx, p.x - 12, bodyY - entity.r - 12, 24, 4, 2);
  ctx.fill();
  ctx.fillStyle = ratio > 0.4 ? "#6fd36f" : "#d4544a";
  roundRect(ctx, p.x - 12, bodyY - entity.r - 12, 24 * ratio, 4, 2);
  ctx.fill();
}

export function drawEntities(ctx, camera, heroes, monsters, time) {
  const all = [...heroes, ...monsters].sort((a, b) => a.y - b.y);
  for (const entity of all) drawCreature(ctx, camera, entity, time);
}

export function updateHud(heroes) {
  const root = document.getElementById("party-hud");
  root.innerHTML = heroes
    .map((hero) => {
      const pct = Math.max(0, (hero.hp / hero.maxHp) * 100);
      return `<div class="hero-row">
        <span class="hero-swatch" style="background:${hero.color}"></span>
        <div class="hero-meta">
          <div class="hero-name">${hero.name} · ${hero.role}</div>
          <div class="hp-bar"><div class="hp-fill" style="width:${pct}%"></div></div>
        </div>
      </div>`;
    })
    .join("");
}

export function setBanner(text) {
  const el = document.getElementById("banner");
  if (!text) {
    el.classList.add("hidden");
    el.textContent = "";
    return;
  }
  el.textContent = text;
  el.classList.remove("hidden");
}

export function setWipe(show) {
  document.getElementById("wipe").classList.toggle("hidden", !show);
}

export function updateSoundButton(muted) {
  const btn = document.getElementById("sound-btn");
  if (btn) {
    btn.textContent = muted ? "🔇" : "🔊";
    btn.classList.toggle("muted", muted);
    btn.title = muted ? "Unmute Sound (M)" : "Mute Sound (M)";
  }
}

