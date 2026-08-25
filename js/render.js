import { TILE, MAP_W, MAP_H, Tiles, tileAt } from "./world.js?v=5";
import { worldToScreen } from "./camera.js?v=5";

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



function drawHeroEyes(ctx, r, flash) {
  if (flash) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(r * 0.45, -2, 1.4, 0, Math.PI * 2);
    ctx.arc(r * 0.45, 2, 1.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = "#1e1b29";
  ctx.beginPath();
  ctx.arc(r * 0.48, -2.1, 1.3, 0, Math.PI * 2);
  ctx.arc(r * 0.48, 2.1, 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(r * 0.52, -2.4, 0.5, 0, Math.PI * 2);
  ctx.arc(r * 0.52, 1.8, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCody(ctx, entity, time, flash) {
  const r = entity.r;
  const isAttacking = time < entity.swingUntil;
  const skinColor = flash ? "#ffffff" : "#fddbb0";
  const tunicColor = flash ? "#fff6d8" : entity.color;
  const darkColor = flash ? "#ffffff" : entity.accent;

  // Tunic body
  ctx.fillStyle = tunicColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belt
  ctx.fillStyle = flash ? "#ffffff" : "#4a3520";
  ctx.fillRect(-r * 0.2, -r * 0.8, 2.5, r * 1.6);
  ctx.fillStyle = flash ? "#ffffff" : "#f1c40f";
  ctx.fillRect(-r * 0.2, -2, 2.5, 4);

  // Left hand: Round Shield (-Y)
  ctx.save();
  ctx.translate(r * 0.2, -r * 0.85);
  ctx.fillStyle = flash ? "#ffffff" : "#7c4a1e";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? "#ffffff" : "#d0d7de";
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = flash ? "#ffffff" : "#f1c40f";
  ctx.beginPath();
  ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(r * 0.22, 0, r * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Adventurer Cap
  ctx.fillStyle = tunicColor;
  ctx.beginPath();
  ctx.moveTo(r * 0.3, -r * 0.6);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.8, -r * 0.9, -r * 0.2);
  ctx.lineTo(-r * 0.2, r * 0.6);
  ctx.quadraticCurveTo(r * 0.3, r * 0.6, r * 0.45, 0);
  ctx.closePath();
  ctx.fill();

  // Cap trim & front hair fringe
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(r * 0.2, 0, r * 0.6, -1.2, 1.2);
  ctx.stroke();

  if (!flash) {
    ctx.fillStyle = "#6d4c27";
    ctx.beginPath();
    ctx.arc(r * 0.4, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(r * 0.4, 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  drawHeroEyes(ctx, r, flash);

  // Right hand & Broadsword (+Y)
  ctx.save();
  const handX = r * 0.3;
  const handY = r * 0.8;
  ctx.translate(handX, handY);

  let swordAngle = 0.2;
  let swordLen = 14;
  if (isAttacking) {
    swordAngle = -0.7 + Math.sin(time * 0.03) * 0.5;
    swordLen = 16;
  }
  ctx.rotate(swordAngle);

  // Sword hilt & crossguard
  ctx.fillStyle = flash ? "#ffffff" : "#c99700";
  ctx.fillRect(-1, -3, 2.5, 6);
  ctx.fillStyle = flash ? "#ffffff" : "#5d4037";
  ctx.fillRect(-3.5, -1, 3, 2);

  // Steel blade
  ctx.fillStyle = flash ? "#ffffff" : "#e4eaed";
  ctx.beginPath();
  ctx.moveTo(1.5, -2);
  ctx.lineTo(1.5 + swordLen, 0);
  ctx.lineTo(1.5, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = flash ? "#ffffff" : "#94a3b8";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();

  // Hand node
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(handX, handY, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Slash trail arc
  if (isAttacking) {
    ctx.strokeStyle = "rgba(240, 246, 252, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r + 13, -0.8, 0.8);
    ctx.stroke();
  }
}

function drawZack(ctx, entity, time, flash) {
  const r = entity.r;
  const isAttacking = time < entity.swingUntil;
  const skinColor = flash ? "#ffffff" : "#fcd0a1";
  const tunicColor = flash ? "#fff6d8" : entity.color;
  const darkColor = flash ? "#ffffff" : entity.accent;

  // Trailing headband scarf ribbons (-X)
  const ribbonWag = Math.sin(time * 0.015) * 3;
  ctx.strokeStyle = tunicColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, -2);
  ctx.quadraticCurveTo(-r * 1.1, -4 + ribbonWag, -r * 1.5, -3 + ribbonWag);
  ctx.moveTo(-r * 0.5, 2);
  ctx.quadraticCurveTo(-r * 1.1, 4 - ribbonWag, -r * 1.5, 5 - ribbonWag);
  ctx.stroke();

  // Tunic body
  ctx.fillStyle = tunicColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rogue dark vest straps
  ctx.fillStyle = darkColor;
  ctx.fillRect(-r * 0.3, -r * 0.85, 3, r * 1.7);

  // Head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(r * 0.2, 0, r * 0.58, 0, Math.PI * 2);
  ctx.fill();

  // Spiky dark hair
  if (!flash) {
    ctx.fillStyle = "#221929";
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -r * 0.6);
    ctx.lineTo(-r * 0.4, -r * 0.8);
    ctx.lineTo(-r * 0.2, -r * 0.3);
    ctx.lineTo(-r * 0.7, 0);
    ctx.lineTo(-r * 0.2, r * 0.3);
    ctx.lineTo(-r * 0.4, r * 0.8);
    ctx.lineTo(r * 0.2, r * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  // Headband
  ctx.fillStyle = tunicColor;
  ctx.fillRect(-r * 0.1, -r * 0.6, 2.5, r * 1.2);

  // Eyes
  drawHeroEyes(ctx, r, flash);

  // Dual Daggers (Left and Right hands)
  const leftX = r * 0.4;
  const leftY = -r * 0.75;
  const rightX = r * 0.4;
  const rightY = r * 0.75;

  const dagExt = isAttacking ? 4 : 0;

  // Left Dagger
  ctx.save();
  ctx.translate(leftX + dagExt, leftY);
  ctx.fillStyle = flash ? "#ffffff" : "#d0d7de";
  ctx.beginPath();
  ctx.moveTo(0, -1);
  ctx.lineTo(9, -2);
  ctx.lineTo(2, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Right Dagger
  ctx.save();
  ctx.translate(rightX + dagExt, rightY);
  ctx.fillStyle = flash ? "#ffffff" : "#d0d7de";
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(9, 2);
  ctx.lineTo(2, -2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Hands
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(leftX + dagExt, leftY, 2, 0, Math.PI * 2);
  ctx.arc(rightX + dagExt, rightY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Dual Cross-Slash Flurry Arc
  if (isAttacking) {
    ctx.strokeStyle = "#ff4d4d";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(r * 0.3, 0, r + 9, -0.75, 0.75);
    ctx.stroke();
  }
}

function drawJustin(ctx, entity, time, flash) {
  const r = entity.r;
  const isAttacking = time < entity.swingUntil;
  const skinColor = flash ? "#ffffff" : "#ffdeb8";
  const tunicColor = flash ? "#fff6d8" : entity.color;
  const darkColor = flash ? "#ffffff" : entity.accent;

  // Ponytail (-X)
  const hairWag = Math.sin(time * 0.014) * 2.5;
  if (!flash) {
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, 0);
    ctx.quadraticCurveTo(-r * 0.9, hairWag, -r * 1.4, hairWag * 1.5);
    ctx.lineTo(-r * 0.5, 3);
    ctx.closePath();
    ctx.fill();
  }

  // Tunic body
  ctx.fillStyle = tunicColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scout shoulder pauldron (-Y)
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(-r * 0.1, -r * 0.75, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(r * 0.22, 0, r * 0.58, 0, Math.PI * 2);
  ctx.fill();

  // Blue scout circlet / headband
  ctx.fillStyle = tunicColor;
  ctx.fillRect(r * 0.1, -r * 0.58, 2.5, r * 1.16);
  ctx.fillStyle = flash ? "#ffffff" : "#e0f2fe";
  ctx.fillRect(r * 0.1, -1.2, 2.5, 2.4);

  // Hair bangs
  if (!flash) {
    ctx.fillStyle = "#3e2723";
    ctx.beginPath();
    ctx.arc(r * 0.1, -r * 0.45, 2, 0, Math.PI * 2);
    ctx.arc(r * 0.1, r * 0.45, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  drawHeroEyes(ctx, r, flash);

  // Long Spear (reaching forward +X)
  const thrust = isAttacking ? 8 : 0;
  const spearY = r * 0.35;
  const shaftStart = -r * 0.6 + thrust;
  const shaftEnd = r + 16 + thrust;

  // Wooden Spear Shaft
  ctx.strokeStyle = flash ? "#ffffff" : "#8d6e63";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(shaftStart, spearY);
  ctx.lineTo(shaftEnd, spearY * 0.3);
  ctx.stroke();

  // Azure Pennant / Ribbon
  ctx.fillStyle = tunicColor;
  ctx.beginPath();
  ctx.moveTo(shaftEnd - 6, spearY * 0.4);
  ctx.lineTo(shaftEnd - 12, spearY * 0.4 + 4 + Math.sin(time * 0.02) * 2);
  ctx.lineTo(shaftEnd - 6, spearY * 0.4 + 2);
  ctx.closePath();
  ctx.fill();

  // Gleaming Diamond Spearhead
  ctx.fillStyle = flash ? "#ffffff" : "#f1f5f9";
  ctx.strokeStyle = flash ? "#ffffff" : "#64748b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(shaftEnd - 4, spearY * 0.3 - 3);
  ctx.lineTo(shaftEnd + 6, spearY * 0.3);
  ctx.lineTo(shaftEnd - 4, spearY * 0.3 + 3);
  ctx.lineTo(shaftEnd - 1, spearY * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hands holding spear
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(r * 0.1 + thrust * 0.5, spearY, 2, 0, Math.PI * 2);
  ctx.arc(r * 0.5 + thrust * 0.8, spearY * 0.6, 2, 0, Math.PI * 2);
  ctx.fill();

  // Pierce wind swoosh on attack
  if (isAttacking) {
    ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(shaftEnd - 2, spearY * 0.3 - 5);
    ctx.lineTo(shaftEnd + 10, spearY * 0.3);
    ctx.lineTo(shaftEnd - 2, spearY * 0.3 + 5);
    ctx.stroke();
  }
}

function drawBillieJean(ctx, entity, time, flash) {
  const r = entity.r;
  const isAttacking = time < entity.swingUntil;
  const skinColor = flash ? "#ffffff" : "#ffe4c4";
  const armorColor = flash ? "#fff6d8" : entity.color;
  const darkColor = flash ? "#ffffff" : entity.accent;

  // Flowing golden hair (-X)
  if (!flash) {
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.4, 3, 0, Math.PI * 2);
    ctx.arc(-r * 0.3, r * 0.4, 3, 0, Math.PI * 2);
    ctx.arc(-r * 0.6, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Paladin Armor / Breastplate
  ctx.fillStyle = armorColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // White Holy Crest / Cross on chest
  ctx.fillStyle = flash ? "#ffffff" : "#fef08a";
  ctx.fillRect(-r * 0.3, -2, r * 0.6, 4);
  ctx.fillRect(-1.5, -r * 0.45, 3, r * 0.9);

  // Left hand: Holy Aegis / Healing Relic (-Y)
  const relicGlow = 0.5 + Math.sin(time * 0.008) * 0.4;
  ctx.fillStyle = flash ? "#ffffff" : `rgba(254, 240, 138, ${relicGlow})`;
  ctx.beginPath();
  ctx.arc(r * 0.2, -r * 0.8, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : "#fef9c3";
  ctx.beginPath();
  ctx.arc(r * 0.2, -r * 0.8, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(r * 0.22, 0, r * 0.58, 0, Math.PI * 2);
  ctx.fill();

  // Winged Guardian Helm / Circlet
  ctx.strokeStyle = armorColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(r * 0.15, 0, r * 0.6, -1.1, 1.1);
  ctx.stroke();

  // Wing ornaments on helm sides
  ctx.fillStyle = flash ? "#ffffff" : "#fef08a";
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.lineTo(-r * 0.4, -r * 1.1);
  ctx.lineTo(r * 0.3, -r * 0.7);
  ctx.moveTo(0, r * 0.6);
  ctx.lineTo(-r * 0.4, r * 1.1);
  ctx.lineTo(r * 0.3, r * 0.7);
  ctx.fill();

  // Eyes
  drawHeroEyes(ctx, r, flash);

  // Heavy Warhammer (+Y)
  ctx.save();
  const hammerHandX = r * 0.3;
  const hammerHandY = r * 0.8;
  ctx.translate(hammerHandX, hammerHandY);

  let hammerAngle = 0.2;
  if (isAttacking) {
    hammerAngle = -0.8 + Math.sin(time * 0.035) * 0.7;
  }
  ctx.rotate(hammerAngle);

  // Hammer shaft
  ctx.strokeStyle = flash ? "#ffffff" : "#78350f";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(12, 0);
  ctx.stroke();

  // Heavy steel hammer head
  ctx.fillStyle = flash ? "#ffffff" : "#94a3b8";
  ctx.strokeStyle = flash ? "#ffffff" : "#ca8a04";
  ctx.lineWidth = 1.2;
  ctx.fillRect(8, -5, 6, 10);
  ctx.strokeRect(8, -5, 6, 10);

  ctx.restore();

  // Hand node
  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(hammerHandX, hammerHandY, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Golden smash impact arc
  if (isAttacking) {
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 11, -0.7, 0.7);
    ctx.stroke();
  }
}

function drawMossCrawler(ctx, entity, time, flash) {
  const r = entity.r;
  const legPhase = Math.sin(time * 0.008);

  ctx.strokeStyle = flash ? "#ffffff" : entity.accent;
  ctx.lineWidth = 1.6;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const lx = -r * 0.3 + i * r * 0.4;
      const wag = legPhase * side * 2 * (i % 2 === 0 ? 1 : -1);
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx + wag, side * r * 0.75 + side * 4);
      ctx.stroke();
    }
  }

  ctx.fillStyle = flash ? "#ffffff" : entity.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : "#5a7d2e";
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.25, 3.5, 0, Math.PI * 2);
  ctx.arc(r * 0.2, -r * 0.35, 2.8, 0, Math.PI * 2);
  ctx.arc(r * 0.1, r * 0.3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : entity.accent;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.2, r * 0.7, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  const antWag = Math.sin(time * 0.006) * 3;
  ctx.strokeStyle = flash ? "#ffffff" : entity.accent;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.7);
  ctx.quadraticCurveTo(-r * 0.6, -r * 1.1 + antWag, -r * 0.4, -r * 1.3 + antWag);
  ctx.moveTo(r * 0.3, -r * 0.7);
  ctx.quadraticCurveTo(r * 0.6, -r * 1.1 - antWag, r * 0.4, -r * 1.3 - antWag);
  ctx.stroke();

  ctx.fillStyle = flash ? "#ffffff" : "#a3c74e";
  ctx.beginPath();
  ctx.arc(-r * 0.4, -r * 1.3 + antWag, 1.5, 0, Math.PI * 2);
  ctx.arc(r * 0.4, -r * 1.3 - antWag, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : "#e8d44d";
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.15, 2.2, 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.15, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : "#1a1a1a";
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.15, 1, 0, Math.PI * 2);
  ctx.arc(r * 0.35, -r * 0.15, 1, 0, Math.PI * 2);
  ctx.fill();
}

function drawFanglet(ctx, entity, time, flash) {
  const r = entity.r;
  const tailWag = Math.sin(time * 0.012) * 4;

  ctx.strokeStyle = flash ? "#ffffff" : entity.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, 0);
  ctx.quadraticCurveTo(-r * 1.2, tailWag, -r * 1.5, tailWag * 0.5);
  ctx.stroke();

  ctx.fillStyle = flash ? "#ffffff" : "#d4a574";
  ctx.beginPath();
  ctx.arc(-r * 1.5, tailWag * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : entity.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.95, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : "#d4a574";
  ctx.beginPath();
  ctx.ellipse(r * 0.15, r * 0.1, r * 0.45, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : entity.color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, -r * 0.7);
  ctx.lineTo(-r * 0.4, -r * 1.3);
  ctx.lineTo(r * 0.1, -r * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.15, -r * 0.7);
  ctx.lineTo(r * 0.4, -r * 1.3);
  ctx.lineTo(r * 0.4, -r * 0.65);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : "#c4826e";
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, -r * 0.75);
  ctx.lineTo(-r * 0.32, -r * 1.1);
  ctx.lineTo(r * 0.02, -r * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : "#f5e6c8";
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.15, 2.5, 1.8, 0.15, 0, Math.PI * 2);
  ctx.ellipse(r * 0.25, -r * 0.15, 2.5, 1.8, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? "#ffffff" : "#8b1a1a";
  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.15, 1.2, 0, Math.PI * 2);
  ctx.arc(r * 0.25, -r * 0.15, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : "#f0f0f0";
  ctx.beginPath();
  ctx.moveTo(-r * 0.15, r * 0.35);
  ctx.lineTo(-r * 0.08, r * 0.7);
  ctx.lineTo(-r * 0.02, r * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.15, r * 0.35);
  ctx.lineTo(r * 0.08, r * 0.7);
  ctx.lineTo(r * 0.02, r * 0.35);
  ctx.closePath();
  ctx.fill();
}

function drawSkyGnat(ctx, entity, time, flash) {
  const r = entity.r;
  const wingAngle = Math.sin(time * 0.025) * 0.6;

  ctx.save();
  ctx.rotate(-0.3 + wingAngle);
  ctx.fillStyle = flash ? "rgba(255,255,255,0.6)" : "rgba(180, 170, 220, 0.45)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.5, r * 0.9, r * 0.4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? "#ffffff" : "rgba(120, 100, 180, 0.6)";
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.rotate(0.3 - wingAngle);
  ctx.fillStyle = flash ? "rgba(255,255,255,0.6)" : "rgba(180, 170, 220, 0.45)";
  ctx.beginPath();
  ctx.ellipse(r * 0.4, -r * 0.5, r * 0.9, r * 0.4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? "#ffffff" : "rgba(120, 100, 180, 0.6)";
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = flash ? "#ffffff" : entity.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.65, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : entity.accent;
  ctx.beginPath();
  ctx.arc(0, -r * 0.65, r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : "#c8b8e8";
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.72, 1.8, 0, Math.PI * 2);
  ctx.arc(r * 0.22, -r * 0.72, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? "#ffffff" : "#5a4a8a";
  ctx.beginPath();
  ctx.moveTo(0, r * 0.8);
  ctx.lineTo(-1.5, r * 1.2);
  ctx.lineTo(1.5, r * 1.2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = flash ? "#ffffff" : entity.accent;
  ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i++) {
    const legDangle = Math.sin(time * 0.01 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(i * r * 0.25, r * 0.3);
    ctx.lineTo(i * r * 0.35, r * 0.8 + legDangle);
    ctx.stroke();
  }
}

function drawLynel(ctx, entity, time, flash) {
  const r = entity.r;
  const isAttacking = time < entity.swingUntil;
  const bodyColor = flash ? "#ffffff" : entity.color;

  // Horse lower body / haunches
  ctx.fillStyle = flash ? "#ffffff" : "#6d1520";
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, r * 0.2, r * 0.8, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // Four horse legs
  const walkPhase = Math.sin(time * 0.006);
  ctx.fillStyle = flash ? "#ffffff" : "#5a0f1a";
  const legPositions = [
    { x: -r * 0.4, y: r * 0.65 },
    { x: -r * 0.1, y: r * 0.7 },
    { x: r * 0.2, y: r * 0.7 },
    { x: r * 0.45, y: r * 0.65 },
  ];
  for (let i = 0; i < 4; i++) {
    const wag = walkPhase * (i % 2 === 0 ? 3 : -3);
    ctx.fillRect(legPositions[i].x - 2, legPositions[i].y - 4 + wag, 4, 12);
  }

  // Horse tail
  const tailWag = Math.sin(time * 0.01) * 5;
  ctx.strokeStyle = flash ? "#ffffff" : "#2a0808";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, r * 0.1);
  ctx.quadraticCurveTo(-r * 1.1, tailWag, -r * 1.3, tailWag * 0.8);
  ctx.stroke();

  // Humanoid torso
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.25, r * 0.65, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // White mane flowing from head down
  if (!flash) {
    ctx.fillStyle = "#e8e0d0";
    const maneWag = Math.sin(time * 0.008) * 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.15, -r * 0.7);
    ctx.quadraticCurveTo(-r * 0.4, -r * 0.3 + maneWag, -r * 0.6, r * 0.1 + maneWag);
    ctx.lineTo(-r * 0.3, r * 0.1 + maneWag);
    ctx.quadraticCurveTo(-r * 0.15, -r * 0.2, -r * 0.05, -r * 0.65);
    ctx.closePath();
    ctx.fill();
  }

  // Head (horse-like with humanoid features)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(r * 0.15, -r * 0.65, r * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Muzzle / snout
  ctx.fillStyle = flash ? "#ffffff" : "#a02030";
  ctx.beginPath();
  ctx.ellipse(r * 0.45, -r * 0.55, r * 0.2, r * 0.15, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Two golden horns
  ctx.fillStyle = flash ? "#ffffff" : "#d4a520";
  ctx.beginPath();
  ctx.moveTo(-r * 0.05, -r * 0.85);
  ctx.lineTo(-r * 0.2, -r * 1.35);
  ctx.lineTo(r * 0.1, -r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.2, -r * 0.85);
  ctx.lineTo(r * 0.35, -r * 1.3);
  ctx.lineTo(r * 0.4, -r * 0.85);
  ctx.closePath();
  ctx.fill();

  // Glowing red eyes
  ctx.fillStyle = flash ? "#ffffff" : "#ff2222";
  ctx.beginPath();
  ctx.arc(r * 0.05, -r * 0.72, 2, 0, Math.PI * 2);
  ctx.arc(r * 0.28, -r * 0.72, 2, 0, Math.PI * 2);
  ctx.fill();

  // Left arm with round shield (-Y)
  ctx.save();
  ctx.translate(-r * 0.1, -r * 0.5);
  ctx.fillStyle = flash ? "#ffffff" : "#8b1a2a";
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? "#ffffff" : "#d4a520";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = flash ? "#ffffff" : "#d4a520";
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right arm with spear (+Y)
  ctx.save();
  const spearHandX = r * 0.3;
  const spearHandY = r * 0.3;
  ctx.translate(spearHandX, spearHandY);

  let spearAngle = 0.3;
  let spearLen = 22;
  if (isAttacking) {
    spearAngle = -0.9 + Math.sin(time * 0.03) * 0.7;
    spearLen = 26;
  }
  ctx.rotate(spearAngle);

  // Spear shaft
  ctx.strokeStyle = flash ? "#ffffff" : "#78350f";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(spearLen, 0);
  ctx.stroke();

  // Spearhead
  ctx.fillStyle = flash ? "#ffffff" : "#d4a520";
  ctx.beginPath();
  ctx.moveTo(spearLen - 2, -4);
  ctx.lineTo(spearLen + 6, 0);
  ctx.lineTo(spearLen - 2, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Hand node
  ctx.fillStyle = flash ? "#ffffff" : "#a02030";
  ctx.beginPath();
  ctx.arc(spearHandX, spearHandY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Spear thrust trail on attack
  if (isAttacking) {
    ctx.strokeStyle = "rgba(255, 180, 60, 0.7)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r + 15, -0.6, 0.6);
    ctx.stroke();
  }
}

function drawCreature(ctx, camera, entity, time) {
  if (entity.hp <= 0) return;
  const p = worldToScreen(camera, entity.x, entity.y);
  const flash = time < entity.flashUntil;
  const hover = entity.hover ? Math.sin(time / 180) * 3 : 0;
  const bodyY = p.y - hover;

  // Ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + entity.r * 0.7, entity.r * 0.9, entity.r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  const ang = Math.atan2(entity.facing.y, entity.facing.x);
  ctx.save();
  ctx.translate(p.x, bodyY);
  ctx.rotate(ang);

  if (entity.kind === "monster") {
    if (entity.id === "mossCrawler") {
      drawMossCrawler(ctx, entity, time, flash);
    } else if (entity.id === "fanglet") {
      drawFanglet(ctx, entity, time, flash);
    } else if (entity.id === "skyGnat") {
      drawSkyGnat(ctx, entity, time, flash);
    } else if (entity.id === "lynel") {
      drawLynel(ctx, entity, time, flash);
    } else {
      ctx.fillStyle = flash ? "#fff6d8" : entity.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, entity.r * 0.95, entity.r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Hero outline ring
    ctx.strokeStyle = flash ? "#ffffff" : "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, entity.r + 1.5, 0, Math.PI * 2);
    ctx.stroke();

    if (entity.id === "cody") {
      drawCody(ctx, entity, time, flash);
    } else if (entity.id === "zack") {
      drawZack(ctx, entity, time, flash);
    } else if (entity.id === "justin") {
      drawJustin(ctx, entity, time, flash);
    } else if (entity.id === "billieJean") {
      drawBillieJean(ctx, entity, time, flash);
    } else {
      ctx.fillStyle = flash ? "#fff6d8" : entity.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, entity.r * 0.95, entity.r * 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  // Health bar
  const ratio = entity.hp / entity.maxHp;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  roundRect(ctx, p.x - 12, bodyY - entity.r - 12, 24, 4, 2);
  ctx.fill();
  ctx.fillStyle = ratio > 0.4 ? "#6fd36f" : "#d4544a";
  roundRect(ctx, p.x - 12, bodyY - entity.r - 12, 24 * ratio, 4, 2);
  ctx.fill();
}

function drawChest(ctx, camera, chest, time) {
  const p = worldToScreen(camera, chest.x, chest.y);
  if (p.x < -30 || p.x > camera.w + 30 || p.y < -30 || p.y > camera.h + 30) return;

  // Ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 7, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!chest.opened) {
    // Closed Chest
    // Base wood box
    ctx.fillStyle = "#854d0e";
    roundRect(ctx, p.x - 11, p.y - 7, 22, 14, 2);
    ctx.fill();

    // Wood highlight
    ctx.fillStyle = "#a16207";
    ctx.fillRect(p.x - 9, p.y - 5, 18, 4);

    // Iron reinforcing bands
    ctx.fillStyle = "#334155";
    ctx.fillRect(p.x - 9, p.y - 7, 3, 14);
    ctx.fillRect(p.x + 6, p.y - 7, 3, 14);
    ctx.fillRect(p.x - 11, p.y - 1, 22, 2);

    // Golden lock & latch
    ctx.fillStyle = "#f59e0b";
    roundRect(ctx, p.x - 3, p.y - 2, 6, 6, 1);
    ctx.fill();
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(p.x, p.y + 1, 1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Open Chest
    // Open lid tilted back
    ctx.fillStyle = "#713f12";
    roundRect(ctx, p.x - 11, p.y - 14, 22, 7, 2);
    ctx.fill();
    ctx.fillStyle = "#334155";
    ctx.fillRect(p.x - 9, p.y - 14, 3, 7);
    ctx.fillRect(p.x + 6, p.y - 14, 3, 7);

    // Deep chest interior
    ctx.fillStyle = "#451a03";
    ctx.fillRect(p.x - 9, p.y - 7, 18, 5);

    // Chest front wall
    ctx.fillStyle = "#854d0e";
    roundRect(ctx, p.x - 11, p.y - 2, 22, 9, 2);
    ctx.fill();

    // Corner bands
    ctx.fillStyle = "#334155";
    ctx.fillRect(p.x - 9, p.y - 2, 3, 9);
    ctx.fillRect(p.x + 6, p.y - 2, 3, 9);

    // Golden hinge latch
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(p.x - 2.5, p.y - 2, 5, 3);

    // Ascending golden sparkle particles
    if (chest.sparkles) {
      for (const s of chest.sparkles) {
        const cycle = ((time * 0.0012 * s.speed + s.phase) % 1);
        const sparkY = p.y - 4 - cycle * 20;
        const sparkAlpha = Math.sin(cycle * Math.PI) * 0.85;
        ctx.fillStyle = `rgba(253, 224, 71, ${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x + s.ox, sparkY, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Floating discovery badge if recently opened
  if (chest.opened && chest.openedAt && time - chest.openedAt < 3500) {
    const elapsed = (time - chest.openedAt) / 1000;
    const popY = Math.min(22, elapsed * 18);
    const popAlpha = elapsed < 2.3 ? 1 : Math.max(0, 1 - (elapsed - 2.3) * 0.85);

    ctx.save();
    ctx.globalAlpha = popAlpha;
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    roundRect(ctx, p.x - 52, p.y - 30 - popY, 104, 20, 4);
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${chest.loot.icon} ${chest.loot.name}`, p.x, p.y - 20 - popY);
    ctx.restore();
  }
}

export function drawEntities(ctx, camera, heroes, monsters, chests, time, boss) {
  const all = [...(chests || []), ...heroes, ...monsters].sort((a, b) => a.y - b.y);
  for (const entity of all) {
    if (entity.loot) {
      drawChest(ctx, camera, entity, time);
    } else {
      drawCreature(ctx, camera, entity, time);
    }
  }
  if (boss) drawBossHud(ctx, boss, camera);
}

export function updateHud(heroes, chests, hasMedal) {
  const root = document.getElementById("party-hud");
  const heroHtml = heroes
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

  let chestHtml = "";
  if (chests && chests.length > 0) {
    const opened = chests.filter((c) => c.opened).length;
    chestHtml = `<div class="chest-hud">🎁 Chests: ${opened} / ${chests.length}</div>`;
  }

  let medalHtml = "";
  if (hasMedal) {
    medalHtml = `<div class="medal-hud">🏅 Shrine Medal</div>`;
  }

  root.innerHTML = heroHtml + chestHtml + medalHtml;
}

export function drawBossHud(ctx, boss, camera) {
  if (!boss || boss.hp <= 0) return;
  const barW = 220;
  const barH = 10;
  const x = (camera.w - barW) / 2;
  const y = 16;
  const ratio = boss.hp / boss.maxHp;

  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  roundRect(ctx, x - 4, y - 18, barW + 8, 32, 4);
  ctx.fill();

  ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ff4444";
  ctx.fillText(boss.name, x + barW / 2, y - 16);

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  roundRect(ctx, x, y, barW, barH, 3);
  ctx.fill();

  ctx.fillStyle = ratio > 0.3 ? "#e04040" : "#ff6666";
  roundRect(ctx, x, y, barW * ratio, barH, 3);
  ctx.fill();

  ctx.restore();
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

