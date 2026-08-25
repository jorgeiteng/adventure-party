import { sound } from "./audio.js";

export function living(entities) {
  return entities.filter((entity) => entity.hp > 0);
}

export function nearest(from, entities, maxDist = Infinity) {
  let best = null;
  let bestD = maxDist;
  for (const entity of entities) {
    if (entity.hp <= 0) continue;
    const d = Math.hypot(entity.x - from.x, entity.y - from.y);
    if (d < bestD) {
      bestD = d;
      best = entity;
    }
  }
  return best;
}

export function tryMelee(attacker, targets, now) {
  if (now < attacker.nextAttack) return false;
  if (attacker.hp <= 0) return false;
  const reach = attacker.attackRange;
  const hx = attacker.x + attacker.facing.x * (attacker.r + reach * 0.45);
  const hy = attacker.y + attacker.facing.y * (attacker.r + reach * 0.45);
  let hit = false;
  for (const target of targets) {
    if (target.hp <= 0) continue;
    if (target === attacker) continue;
    if (now < target.invulnUntil) continue;
    const d = Math.hypot(target.x - hx, target.y - hy);
    if (d <= reach + target.r) {
      applyHit(target, attacker, now);
      hit = true;
    }
  }
  if (hit || attacker.kind === "hero") {
    attacker.nextAttack = now + attacker.attackCooldown;
    attacker.swingUntil = now + 180;
    if (attacker.kind === "hero") {
      sound.playSwing(attacker.role);
    }
    return true;
  }
  return false;
}

export function applyHit(target, attacker, now) {
  const prevHp = target.hp;
  target.hp = Math.max(0, target.hp - attacker.damage);
  target.invulnUntil = now + (target.invulnMs || 280);
  target.flashUntil = now + 120;
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const len = Math.hypot(dx, dy) || 1;
  target.knock = {
    x: (dx / len) * (attacker.knockback || 90),
    y: (dy / len) * (attacker.knockback || 90),
  };

  if (target.kind === "monster") {
    if (target.hp <= 0 && prevHp > 0) {
      sound.playMonsterDeath();
    } else {
      sound.playHit();
    }
  } else if (target.kind === "hero") {
    if (target.hp <= 0 && prevHp > 0) {
      sound.playHeroDeath();
    } else {
      sound.playHeroHurt();
    }
  }
}

export function tickKnockback(entity, world, dt, moveWithCollision) {
  if (!entity.knock) return;
  const stepX = entity.knock.x * dt;
  const stepY = entity.knock.y * dt;
  moveWithCollision(world, entity, stepX, stepY);
  const decay = Math.exp(-10 * dt);
  entity.knock.x *= decay;
  entity.knock.y *= decay;
  if (Math.hypot(entity.knock.x, entity.knock.y) < 4) entity.knock = null;
}
