import { TILE, moveWithCollision, randomWalkable } from "./world.js?v=5";
import { nearest, tryMelee, tickKnockback } from "./combat.js?v=5";

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

const CAVERN_KINDS = [
  {
    id: "biri",
    name: "Biri",
    color: "#00e5ff",
    accent: "#006064",
    r: 8,
    speed: 70,
    maxHp: 22,
    damage: 6,
    attackRange: 14,
    attackCooldown: 600,
    aggro: 140,
    knockback: 25,
    hover: true,
  },
  {
    id: "tektite",
    name: "Tektite",
    color: "#1a237e",
    accent: "#4a148c",
    r: 10,
    speed: 95,
    maxHp: 32,
    damage: 10,
    attackRange: 16,
    attackCooldown: 750,
    aggro: 170,
    knockback: 45,
  },
  {
    id: "darkutch",
    name: "Darknut",
    color: "#263238",
    accent: "#b71c1c",
    r: 13,
    speed: 40,
    maxHp: 55,
    damage: 14,
    attackRange: 18,
    attackCooldown: 1100,
    aggro: 120,
    knockback: 20,
  },
];

const LYNEL_SPEC = {
  id: "lynel",
  name: "Lynel",
  color: "#8b1a2a",
  accent: "#5a0f1a",
  r: 16,
  speed: 65,
  maxHp: 120,
  damage: 18,
  attackRange: 22,
  attackCooldown: 800,
  aggro: 300,
  knockback: 70,
};

const AQUAMENTUS_SPEC = {
  id: "aquamentus",
  name: "Aquamentus",
  color: "#004d40",
  accent: "#00bcd4",
  r: 22,
  speed: 45,
  maxHp: 180,
  damage: 22,
  attackRange: 28,
  attackCooldown: 1200,
  aggro: 350,
  knockback: 80,
};

export function createMonster(spec, x, y) {
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

export function scaleMonster(m, mult) {
  if (!mult) return m;
  m.maxHp = Math.round(m.maxHp * mult.monHp);
  m.hp = m.maxHp;
  m.damage = Math.round(m.damage * mult.monDmg);
  m.speed = Math.round(m.speed * mult.monSpeed);
  m.aggro = Math.round(m.aggro * mult.monAggro);
  m.attackCooldown = Math.round(m.attackCooldown * mult.monCd);
  m.respawnMult = mult.respawn;
  return m;
}

export function spawnMonsters(world, mult = null, count = 22) {
  const list = [];
  const spawnPx = {
    x: world.spawn.tx * TILE + TILE / 2,
    y: world.spawn.ty * TILE + TILE / 2,
  };
  const kinds = world.isCavern ? CAVERN_KINDS : KINDS;
  for (let i = 0; i < count; i++) {
    const spec = kinds[Math.floor(world.rand() * kinds.length)];
    const pos = randomWalkable(world, spawnPx, 140);
    list.push(scaleMonster(createMonster(spec, pos.x, pos.y), mult));
  }
  return list;
}

export function updateMonsters(monsters, heroes, world, now, dt) {
  const liveHeroes = heroes.filter((h) => h.hp > 0);
  for (const monster of monsters) {
    if (monster.hp <= 0) {
      if (monster.noRespawn) continue;
      if (!monster.respawnAt) monster.respawnAt = now + (7000 + world.rand() * 4000) * (monster.respawnMult || 1);
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

export function randomKind(world) {
  const kinds = world.isCavern ? CAVERN_KINDS : KINDS;
  return kinds[Math.floor(world.rand() * kinds.length)];
}

export function lynelSpec() {
  return LYNEL_SPEC;
}

export function aquamentusSpec() {
  return AQUAMENTUS_SPEC;
}
