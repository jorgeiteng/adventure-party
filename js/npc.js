import { TILE } from "./world.js?v=5";

const NPC_DEFS = [
  {
    name: "King Dorephan",
    color: "#1a6b8a",
    accent: "#ffd700",
    role: "King of the Zora",
    size: 1.4,
    dialogue: [
      "Welcome, heroes. You have defeated the Lynel.",
      "The shrine is sealed. The waters flow pure once more.",
      "Take this medal as token of our gratitude.",
    ],
  },
  {
    name: "Princess Sidon",
    color: "#2196f3",
    accent: "#e3f2fd",
    role: "Princess",
    size: 1.1,
    dialogue: [
      "You did it! I knew you could!",
      "The Zora people owe you a great debt.",
      "Come visit anytime. The falls are beautiful at sunset.",
    ],
  },
  {
    name: "Zora Elder",
    color: "#0d47a1",
    accent: "#90caf9",
    role: "Elder",
    size: 1.2,
    dialogue: [
      "Long has the shrine been corrupted...",
      "The Lynel was a curse upon this land.",
      "Peace returns to Zora's Domain thanks to you.",
    ],
  },
  {
    name: "Zora Guard",
    color: "#1565c0",
    accent: "#42a5f5",
    role: "Royal Guard",
    size: 1.0,
    dialogue: [
      "Halt! ...Oh, it's the heroes.",
      "The King awaits you in the inner chamber.",
      "Stay vigilant. Not all monsters are vanquished.",
    ],
  },
  {
    name: "Zora Child",
    color: "#64b5f6",
    accent: "#bbdefb",
    role: "Child",
    size: 0.8,
    dialogue: [
      "Wow, you're so strong!",
      "Can you teach me to fight?",
      "I want to be a hero like you someday!",
    ],
  },
];

export function spawnNpcs(world) {
  const center = {
    x: world.zorasDomain.tx * TILE + TILE / 2,
    y: world.zorasDomain.ty * TILE + TILE / 2,
  };

  const npcs = [];
  const offsets = [
    { dx: -3, dy: -2 },
    { dx: 3, dy: -1 },
    { dx: -2, dy: 2 },
    { dx: 2, dy: 3 },
    { dx: 0, dy: -3 },
  ];

  for (let i = 0; i < NPC_DEFS.length; i++) {
    const def = NPC_DEFS[i];
    const off = offsets[i % offsets.length];
    npcs.push({
      ...def,
      x: center.x + off.dx * TILE,
      y: center.y + off.dy * TILE,
      r: 10 * def.size,
      currentLine: 0,
      lastSpoke: 0,
    });
  }

  return npcs;
}

export function updateNpcs(npcs, hero, now) {
  for (const npc of npcs) {
    const dist = Math.hypot(hero.x - npc.x, hero.y - npc.y);
    if (dist < 60 && now - npc.lastSpoke > 100) {
      npc.lastSpoke = now;
    }
  }
}

export function getNearbyNpc(npcs, hero) {
  let closest = null;
  let closestDist = 64;
  for (const npc of npcs) {
    const dist = Math.hypot(hero.x - npc.x, hero.y - npc.y);
    if (dist < closestDist) {
      closestDist = dist;
      closest = npc;
    }
  }
  return closest;
}
