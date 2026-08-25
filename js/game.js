import { createWorld, shrineCenter, randomWalkableNear, zorasDomainCenter, createCavernWorld, TILE } from "./world.js?v=5";
import { spawnParty, updateParty } from "./hero.js?v=5";
import { spawnMonsters, updateMonsters, createMonster, randomKind, lynelSpec, aquamentusSpec } from "./monster.js?v=5";
import { spawnChests, updateChests } from "./chest.js?v=5";
import { spawnNpcs, getNearbyNpc } from "./npc.js?v=5";
import { updateHud, setBanner, setWipe } from "./render.js?v=5";
import { sound } from "./audio.js?v=5";

const WAVE_COUNT = 6;

export function createGame() {
  return resetGame();
}

export function resetGame() {
  const world = createWorld();
  const heroes = spawnParty(world);
  const monsters = spawnMonsters(world);
  const chests = spawnChests(world);
  const npcs = spawnNpcs(world);
  updateHud(heroes, chests, false);
  setBanner("");
  setWipe(false);
  return {
    world,
    heroes,
    monsters,
    chests,
    npcs,
    wiped: false,
    nearShrine: false,
    bannerText: "",
    bannerUntil: 0,
    shrineState: "idle",
    shrineWave: [],
    shrineBoss: null,
    shrineTriggered: false,
    hasMedal: false,
    currentNpc: null,
    currentMap: "overworld",
    cavernWorld: null,
    cavernMonsters: [],
    cavernBoss: null,
    cavernBossState: "idle",
    nearPortal: false,
    portalCooldown: 0,
  };
}

function spawnWaveMonsters(game) {
  const center = shrineCenter(game.world);
  const wave = [];
  for (let i = 0; i < WAVE_COUNT; i++) {
    const spec = randomKind(game.world);
    const pos = randomWalkableNear(game.world, center, 100);
    const m = createMonster(spec, pos.x, pos.y);
    m.noRespawn = true;
    wave.push(m);
    game.monsters.push(m);
  }
  game.shrineWave = wave;
}

function spawnBoss(game) {
  const center = shrineCenter(game.world);
  const pos = randomWalkableNear(game.world, center, 40);
  const boss = createMonster(lynelSpec(), pos.x, pos.y);
  boss.noRespawn = true;
  game.shrineBoss = boss;
  game.monsters.push(boss);
}

function healParty(heroes) {
  for (const hero of heroes) {
    hero.hp = hero.maxHp;
  }
}

function switchToCavern(game) {
  if (!game.cavernWorld) {
    game.cavernWorld = createCavernWorld();
    game.cavernMonsters = spawnMonsters(game.cavernWorld, 18);
  }
  game.currentMap = "cavern";
  game.world = game.cavernWorld;
  game.monsters = game.cavernMonsters;
  const spawnPx = {
    x: game.world.spawn.tx * TILE + TILE / 2,
    y: game.world.spawn.ty * TILE + TILE / 2,
  };
  for (const hero of game.heroes) {
    hero.x = spawnPx.x;
    hero.y = spawnPx.y;
  }
}

function switchToOverworld(game) {
  game.currentMap = "overworld";
  game.world = createWorld();
  game.monsters = spawnMonsters(game.world);
  const dest = zorasDomainCenter(game.world);
  for (const hero of game.heroes) {
    hero.x = dest.x;
    hero.y = dest.y;
  }
}

export function updateGame(game, input, now, dt) {
  if (game.wiped) {
    if (input.wantsRestart()) {
      sound.playRestart();
      const next = resetGame();
      Object.assign(game, next);
    }
    return;
  }

  updateParty(game.heroes, game.monsters, game.world, input, now, dt);
  updateMonsters(game.monsters, game.heroes, game.world, now, dt);
  const chestMsg = updateChests(game.chests, game.heroes, now);
  if (chestMsg) {
    game.bannerText = chestMsg;
    game.bannerUntil = now + 4500;
  }

  updateHud(game.heroes, game.chests, game.hasMedal);

  // --- Shrine puzzle state machine ---
  const shrine = shrineCenter(game.world);
  const leader = game.heroes[0];
  const distToShrine = Math.hypot(leader.x - shrine.x, leader.y - shrine.y);
  const nearShrineRadius = 48;
  const wasNearShrine = game.nearShrine;
  game.nearShrine = distToShrine < nearShrineRadius;

  const nearbyNpc = getNearbyNpc(game.npcs, leader);
  if (nearbyNpc && game.shrineState === "completed") {
    if (game.currentNpc !== nearbyNpc) {
      game.currentNpc = nearbyNpc;
      game.currentNpc.currentLine = 0;
    } else if (now - game.currentNpc.lastSpoke > 4000) {
      game.currentNpc.currentLine = (game.currentNpc.currentLine + 1) % game.currentNpc.dialogue.length;
      game.currentNpc.lastSpoke = now;
    }
  } else {
    game.currentNpc = null;
  }

  if (game.shrineState === "idle") {
    if (game.nearShrine && !game.shrineTriggered) {
      game.shrineTriggered = true;
      game.shrineState = "defense";
      sound.playShrine();
      spawnWaveMonsters(game);
      game.bannerText = "Defend the shrine!";
      game.bannerUntil = now + 3000;
    }
  } else if (game.shrineState === "defense") {
    const allDead = game.shrineWave.every((m) => m.hp <= 0);
    if (allDead) {
      game.shrineWave = [];
      game.shrineState = "boss";
      sound.playBossSpawn();
      spawnBoss(game);
      game.bannerText = "A Lynel emerges!";
      game.bannerUntil = now + 2500;
    }
  } else if (game.shrineState === "boss") {
    if (game.shrineBoss && game.shrineBoss.hp <= 0) {
      game.shrineBoss = null;
      game.shrineState = "completed";
      game.hasMedal = true;
      sound.playVictory();
      healParty(game.heroes);
      const dest = zorasDomainCenter(game.world);
      for (const hero of game.heroes) {
        hero.x = dest.x;
        hero.y = dest.y;
      }
      game.bannerText = "The shrine is sealed. Medal earned! Teleported to Zora's Domain!";
      game.bannerUntil = now + 6000;
    }
  }

  // Banner display
  if (game.shrineState === "defense") {
    const alive = game.shrineWave.filter((m) => m.hp > 0).length;
    setBanner(`Defend the shrine! Enemies remaining: ${alive}`);
  } else if (game.shrineState === "boss" && game.shrineBoss && game.shrineBoss.hp > 0) {
    setBanner("A Lynel emerges! Defeat it!");
  } else if (game.currentMap === "cavern" && game.cavernBossState === "boss" && game.cavernBoss && game.cavernBoss.hp > 0) {
    setBanner("Aquamentus lurks in the depths!");
  } else if (game.currentNpc) {
    setBanner(`${game.currentNpc.name}: "${game.currentNpc.dialogue[game.currentNpc.currentLine]}"`);
  } else if (game.bannerUntil && now < game.bannerUntil) {
    setBanner(game.bannerText);
  } else if (game.shrineState === "idle" && game.nearShrine) {
    if (!wasNearShrine) {
      sound.playShrine();
    }
    setBanner("The sealed shrine awaits...");
  } else if (game.nearPortal && game.hasMedal) {
    setBanner("Press SPACE to enter the portal");
  } else {
    setBanner("");
  }

  if (game.heroes[0].hp <= 0 && !game.wiped) {
    game.wiped = true;
    sound.playWipe();
    setWipe(true);
    setBanner("");
  }

  if (game.currentMap === "cavern" && game.hasMedal) {
    const portalPos = {
      x: game.world.spawn.tx * TILE + TILE / 2,
      y: game.world.spawn.ty * TILE + TILE / 2,
    };
    const distToPortal = Math.hypot(leader.x - portalPos.x, leader.y - portalPos.y);
    game.nearPortal = distToPortal < 48;

    if (game.nearPortal && !game.portalCooldown) {
      switchToOverworld(game);
      game.portalCooldown = now + 2000;
      setBanner("Returned to Zora's Domain");
      game.bannerUntil = now + 3000;
    }
  }

  if (game.currentMap === "overworld" && game.hasMedal) {
    const portalPos = {
      x: game.world.zorasDomain.tx * TILE + TILE / 2 + 64,
      y: game.world.zorasDomain.ty * TILE + TILE / 2,
    };
    const distToPortal = Math.hypot(leader.x - portalPos.x, leader.y - portalPos.y);
    game.nearPortal = distToPortal < 48;

    if (game.nearPortal && !game.portalCooldown) {
      switchToCavern(game);
      game.portalCooldown = now + 2000;
      setBanner("Entered Zora's Cavern");
      game.bannerUntil = now + 3000;
    }
  }

  if (game.portalCooldown && now > game.portalCooldown) {
    game.portalCooldown = 0;
  }

  if (game.currentMap === "cavern" && game.cavernBossState === "idle") {
    const bossRoom = {
      x: game.world.bossRoom.tx * TILE + TILE / 2,
      y: game.world.bossRoom.ty * TILE + TILE / 2,
    };
    const distToBossRoom = Math.hypot(leader.x - bossRoom.x, leader.y - bossRoom.y);
    if (distToBossRoom < 120) {
      game.cavernBossState = "boss";
      game.cavernBoss = createMonster(aquamentusSpec(), bossRoom.x, bossRoom.y);
      game.cavernBoss.noRespawn = true;
      game.monsters.push(game.cavernBoss);
      sound.playBossSpawn();
      setBanner("Aquamentus awakens!");
      game.bannerUntil = now + 3000;
    }
  } else if (game.currentMap === "cavern" && game.cavernBossState === "boss") {
    if (game.cavernBoss && game.cavernBoss.hp <= 0) {
      game.cavernBoss = null;
      game.cavernBossState = "completed";
      sound.playVictory();
      healParty(game.heroes);
      setBanner("Aquamentus defeated! The cavern is cleared!");
      game.bannerUntil = now + 5000;
    }
  }
}
