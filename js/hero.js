import { TILE, moveWithCollision } from "./world.js?v=3";
import { nearest, tryMelee, tickKnockback } from "./combat.js";

export const PARTY = [
  {
    id: "cody",
    name: "Cody",
    role: "Leader",
    color: "#3cb86a",
    accent: "#1f7a40",
    isLeader: true,
    speed: 145,
    maxHp: 80,
    damage: 9,
    attackRange: 22,
    attackCooldown: 380,
    knockback: 110,
  },
  {
    id: "zack",
    name: "Zack",
    role: "Striker",
    color: "#d4544a",
    accent: "#8a221c",
    offset: { x: -28, y: 34 },
    speed: 150,
    maxHp: 70,
    damage: 12,
    attackRange: 20,
    attackCooldown: 340,
    knockback: 130,
  },
  {
    id: "justin",
    name: "Justin",
    role: "Reach",
    color: "#4aa3e0",
    accent: "#1d5f8a",
    offset: { x: 28, y: 34 },
    speed: 135,
    maxHp: 65,
    damage: 8,
    attackRange: 30,
    attackCooldown: 420,
    knockback: 80,
  },
  {
    id: "billieJean",
    name: "Billie Jean",
    role: "Warden",
    color: "#e0c14a",
    accent: "#8a7018",
    offset: { x: 0, y: 52 },
    speed: 125,
    maxHp: 95,
    damage: 6,
    attackRange: 18,
    attackCooldown: 500,
    knockback: 70,
    healPulse: 6,
    healEvery: 4200,
  },
];

function rotateOffset(offset, facing) {
  const fx = facing.x;
  const fy = facing.y;
  const bx = -fx;
  const by = -fy;
  const rx = fy;
  const ry = -fx;
  return {
    x: rx * offset.x + bx * offset.y,
    y: ry * offset.x + by * offset.y,
  };
}

export function spawnParty(world) {
  const originX = world.spawn.tx * TILE + TILE / 2;
  const originY = world.spawn.ty * TILE + TILE / 2;
  return PARTY.map((spec, index) => ({
    ...spec,
    kind: "hero",
    x: originX + (index - 1.5) * 18,
    y: originY + index * 6,
    r: 9,
    hp: spec.maxHp,
    facing: { x: 0, y: -1 },
    nextAttack: 0,
    swingUntil: 0,
    invulnUntil: 0,
    flashUntil: 0,
    nextHeal: 0,
    knock: null,
  }));
}

export function updateParty(heroes, monsters, world, input, now, dt) {
  const leader = heroes[0];
  if (leader.hp > 0) {
    const axis = input.axis();
    if (axis.x || axis.y) {
      leader.facing = { ...axis };
      moveWithCollision(world, leader, axis.x * leader.speed * dt, axis.y * leader.speed * dt);
    }
    tickKnockback(leader, world, dt, moveWithCollision);
    if (input.consumeAttack()) {
      tryMelee(leader, monsters, now);
    }
  } else {
    tickKnockback(leader, world, dt, moveWithCollision);
  }

  const liveMonsters = monsters.filter((m) => m.hp > 0);
  for (let i = 1; i < heroes.length; i++) {
    const hero = heroes[i];
    if (hero.hp <= 0) continue;
    tickKnockback(hero, world, dt, moveWithCollision);

    const prey = nearest(hero, liveMonsters, 88);
    const distLeader = Math.hypot(hero.x - leader.x, hero.y - leader.y);
    const leash = 150;

    if (prey && distLeader < leash) {
      const dx = prey.x - hero.x;
      const dy = prey.y - hero.y;
      const d = Math.hypot(dx, dy) || 1;
      hero.facing = { x: dx / d, y: dy / d };
      if (d > hero.attackRange + prey.r * 0.6) {
        moveWithCollision(world, hero, (dx / d) * hero.speed * dt, (dy / d) * hero.speed * dt);
      }
      tryMelee(hero, liveMonsters, now);
    } else {
      const rotated = rotateOffset(hero.offset, leader.facing);
      const tx = leader.x + rotated.x;
      const ty = leader.y + rotated.y;
      const dx = tx - hero.x;
      const dy = ty - hero.y;
      const d = Math.hypot(dx, dy);
      if (d > 6) {
        const speed = Math.min(hero.speed * 1.15, d * 4);
        hero.facing = { x: dx / d, y: dy / d };
        moveWithCollision(world, hero, (dx / d) * speed * dt, (dy / d) * speed * dt);
      }
    }

    if (hero.healPulse && now >= hero.nextHeal) {
      hero.nextHeal = now + hero.healEvery;
      for (const ally of heroes) {
        if (ally.hp <= 0) continue;
        if (Math.hypot(ally.x - hero.x, ally.y - hero.y) < 70) {
          ally.hp = Math.min(ally.maxHp, ally.hp + hero.healPulse);
        }
      }
    }
  }
}
