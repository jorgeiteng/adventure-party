import { createWorld, shrineCenter, randomWalkableNear } from "./world.js?v=5";
import { spawnParty, updateParty } from "./hero.js?v=5";
import { spawnMonsters, updateMonsters, createMonster, randomKind, lynelSpec } from "./monster.js?v=5";
import { spawnChests, updateChests } from "./chest.js?v=5";
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
  updateHud(heroes, chests);
  setBanner("");
  setWipe(false);
  return {
    world,
    heroes,
    monsters,
    chests,
    wiped: false,
    nearShrine: false,
    bannerText: "",
    bannerUntil: 0,
    shrineState: "idle",
    shrineWave: [],
    shrineBoss: null,
    shrineTriggered: false,
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

  updateHud(game.heroes, game.chests);

  // --- Shrine puzzle state machine ---
  const shrine = shrineCenter(game.world);
  const leader = game.heroes[0];
  const distToShrine = Math.hypot(leader.x - shrine.x, leader.y - shrine.y);
  const nearShrineRadius = 48;
  const wasNearShrine = game.nearShrine;
  game.nearShrine = distToShrine < nearShrineRadius;

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
      sound.playVictory();
      healParty(game.heroes);
      game.bannerText = "The shrine is sealed. The party is blessed!";
      game.bannerUntil = now + 6000;
    }
  }

  // Banner display
  if (game.shrineState === "defense") {
    const alive = game.shrineWave.filter((m) => m.hp > 0).length;
    setBanner(`Defend the shrine! Enemies remaining: ${alive}`);
  } else if (game.shrineState === "boss" && game.shrineBoss && game.shrineBoss.hp > 0) {
    setBanner("A Lynel emerges! Defeat it!");
  } else if (game.bannerUntil && now < game.bannerUntil) {
    setBanner(game.bannerText);
  } else if (game.shrineState === "idle" && game.nearShrine) {
    if (!wasNearShrine) {
      sound.playShrine();
    }
    setBanner("The sealed shrine awaits...");
  } else {
    setBanner("");
  }

  if (game.heroes.every((hero) => hero.hp <= 0)) {
    game.wiped = true;
    sound.playWipe();
    setWipe(true);
    setBanner("");
  }
}
