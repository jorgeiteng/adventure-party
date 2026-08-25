import { TILE, circleHitsSolid } from "./world.js?v=5";
import { sound } from "./audio.js?v=5";

const CHEST_DEFS = [
  {
    id: "chest_heart",
    tx: 18,
    ty: 44,
    loot: {
      id: "heartContainer",
      name: "Heart Container",
      icon: "❤️",
      desc: "+15 Max HP & Party Fully Restored!",
      apply: (heroes) => {
        for (const hero of heroes) {
          hero.maxHp += 15;
          hero.hp = hero.maxHp;
        }
      },
    },
  },
  {
    id: "chest_boots",
    tx: 10,
    ty: 33,
    loot: {
      id: "swiftBoots",
      name: "Swift Boots",
      icon: "⚡",
      desc: "+18% Movement Speed for the whole Party!",
      apply: (heroes) => {
        for (const hero of heroes) {
          hero.speed = Math.round(hero.speed * 1.18);
        }
      },
    },
  },
  {
    id: "chest_whetstone",
    tx: 34,
    ty: 38,
    loot: {
      id: "whetstone",
      name: "Whetstone & Blade Oils",
      icon: "⚔️",
      desc: "+3 Damage & +20 Knockback for Cody & Zack!",
      apply: (heroes) => {
        for (const hero of heroes) {
          if (hero.id === "cody" || hero.id === "zack") {
            hero.damage += 3;
            hero.knockback = (hero.knockback || 100) + 20;
          }
        }
      },
    },
  },
  {
    id: "chest_shield",
    tx: 28,
    ty: 21,
    loot: {
      id: "ironShield",
      name: "Iron Crest Shield",
      icon: "🛡️",
      desc: "Party gains 20% Damage Reduction!",
      apply: (heroes) => {
        for (const hero of heroes) {
          hero.damageReduction = 0.20;
        }
      },
    },
  },
  {
    id: "chest_lance",
    tx: 41,
    ty: 27,
    loot: {
      id: "gildedLance",
      name: "Gilded Lance Tip",
      icon: "🔱",
      desc: "Justin gains +10 Attack Reach & +4 Damage!",
      apply: (heroes) => {
        const justin = heroes.find((h) => h.id === "justin");
        if (justin) {
          justin.attackRange += 10;
          justin.damage += 4;
        }
      },
    },
  },
  {
    id: "chest_rosary",
    tx: 46,
    ty: 15,
    loot: {
      id: "radiantRosary",
      name: "Radiant Rosary",
      icon: "✨",
      desc: "Billie Jean's Heal Pulse +4 HP & 25% faster pulse!",
      apply: (heroes) => {
        const bj = heroes.find((h) => h.id === "billieJean");
        if (bj) {
          bj.healPulse = (bj.healPulse || 6) + 4;
          bj.healEvery = Math.round((bj.healEvery || 4200) * 0.75);
        }
      },
    },
  },
];

function findWalkableNear(world, tx, ty) {
  const baseX = tx * TILE + TILE / 2;
  const baseY = ty * TILE + TILE / 2;
  if (!circleHitsSolid(world, baseX, baseY, 10)) {
    return { x: baseX, y: baseY };
  }
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = (tx + dx) * TILE + TILE / 2;
      const cy = (ty + dy) * TILE + TILE / 2;
      if (!circleHitsSolid(world, cx, cy, 10)) {
        return { x: cx, y: cy };
      }
    }
  }
  return { x: baseX, y: baseY };
}

export function spawnChests(world) {
  return CHEST_DEFS.map((def) => {
    const pos = findWalkableNear(world, def.tx, def.ty);
    return {
      id: def.id,
      x: pos.x,
      y: pos.y,
      r: 11,
      opened: false,
      openedAt: 0,
      loot: def.loot,
      sparkles: [
        { ox: -6, phase: 0.0, speed: 1.2 },
        { ox: 0, phase: 1.3, speed: 1.6 },
        { ox: 6, phase: 2.5, speed: 1.1 },
        { ox: -3, phase: 3.8, speed: 1.4 },
        { ox: 4, phase: 5.1, speed: 1.5 },
      ],
    };
  });
}

export function updateChests(chests, heroes, now) {
  let justOpenedText = null;

  for (const chest of chests) {
    if (chest.opened) continue;

    let openedThisFrame = false;
    for (const hero of heroes) {
      if (hero.hp <= 0) continue;
      const dist = Math.hypot(hero.x - chest.x, hero.y - chest.y);
      if (dist < chest.r + hero.r + 14) {
        openedThisFrame = true;
        break;
      }
    }

    if (openedThisFrame) {
      chest.opened = true;
      chest.openedAt = now;
      sound.playChestOpen();
      chest.loot.apply(heroes);
      justOpenedText = `${chest.loot.icon} Found ${chest.loot.name}! ${chest.loot.desc}`;
    }
  }

  return justOpenedText;
}
