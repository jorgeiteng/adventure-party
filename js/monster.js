import { TILE, moveWithCollision, randomWalkable } from "./world.js?v=3";
import { nearest, tryMelee, tickKnockback } from "./combat.js";

const KINDS = [
  {
    id: "mossCrawler",
    name: "Moss crawler",
    color: "#6b8f3a",
    accent: "#3d5a1c",
    r: 11,
    speed: 52,
    maxHp: 28,
    damage: 7,
    attackRange: 16,
    attackCooldown: 900,
    aggro: 130,
    knockback: 40,
  },
  {
    id: "fanglet",
    name: "Fanglet",
    color: "#a45c38",
    accent: "#6a3018",
    r: 9,
    speed: 88,
    maxHp: 18,
    damage: 8,
    attackRange: 15,
    attackCooldown: 700,
    aggro: 160,
    knockback: 55,
  },
  {
    id: "skyGnat",
    name: "Sky gnat",
    color: "#7a6aad",
    accent: "#3e346e",
    r: 7,
    speed: 110,
    maxHp: 12,
    damage: 5,
    attackRange: 14,
    attackCooldown: 640,
    aggro: 150,
    knockback: 30,
    hover: true,
  },
];

function createMonster(spec, x, y) {
  return {
    ...spec,
    kind: "monster",
    x,
    y,
    hp: spec.maxHp,
    facing: { x: 0, y: 1 },
    nextAttack: 0,
    swingUntil: 0,
    invulnUntil: 0,
    flashUntil: 0,
    wanderUntil: 0,
    wanderDir: { x: 0, y: 0 },
    knock: null,
    respawnAt: 0,
  };
}

export function spawnMonsters(world, count = 22) {
  const list = [];
  const spawnPx = {
    x: world.spawn.tx * TILE + TILE / 2,
    y: world.spawn.ty * TILE + TILE / 2,
  };
  for (let i = 0; i < count; i++) {
    const spec = KINDS[Math.floor(world.rand() * KINDS.length)];
    const pos = randomWalkable(world, spawnPx, 140);
    list.push(createMonster(spec, pos.x, pos.y));
  }
  return list;
}

export function updateMonsters(monsters, heroes, world, now, dt) {
  const liveHeroes = heroes.filter((h) => h.hp > 0);
  for (const monster of monsters) {
    if (monster.hp <= 0) {
      if (!monster.respawnAt) monster.respawnAt = now + 7000 + world.rand() * 4000;
      if (now >= monster.respawnAt) {
        const leader = heroes[0];
        const pos = randomWalkable(world, leader, 180);
        const fresh = createMonster(monster, pos.x, pos.y);
        Object.assign(monster, fresh);
      }
      continue;
    }

    tickKnockback(monster, world, dt, moveWithCollision);
    const prey = nearest(monster, liveHeroes, monster.aggro);
    if (prey) {
      const dx = prey.x - monster.x;
      const dy = prey.y - monster.y;
      const d = Math.hypot(dx, dy) || 1;
      monster.facing = { x: dx / d, y: dy / d };
      if (d > monster.attackRange + prey.r * 0.5) {
        moveWithCollision(
          world,
          monster,
          (dx / d) * monster.speed * dt,
          (dy / d) * monster.speed * dt,
        );
      }
      tryMelee(monster, liveHeroes, now);
    } else if (now >= monster.wanderUntil) {
      const angle = world.rand() * Math.PI * 2;
      monster.wanderDir = { x: Math.cos(angle), y: Math.sin(angle) };
      monster.wanderUntil = now + 800 + world.rand() * 1600;
    } else {
      monster.facing = monster.wanderDir;
      moveWithCollision(
        world,
        monster,
        monster.wanderDir.x * monster.speed * 0.45 * dt,
        monster.wanderDir.y * monster.speed * 0.45 * dt,
      );
    }
  }
}
