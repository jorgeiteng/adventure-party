import { createWorld, shrineCenter, randomWalkableNear, zorasDomainCenter, createCavernWorld, TILE } from "./world.js?v=5";
import { spawnParty, updateParty } from "./hero.js?v=5";
import { spawnMonsters, updateMonsters, createMonster, randomKind, lynelSpec, aquamentusSpec } from "./monster.js?v=5";
import { spawnChests, updateChests } from "./chest.js?v=5";
import { spawnNpcs, getNearbyNpc } from "./npc.js?v=5";
import { updateHud, setBanner, setWipe, setComplete, drawShrineRelics } from "./render.js?v=5";
import { sound } from "./audio.js?v=5";

const WAVE_COUNT = 6;
const RUNE_COUNT = 5;
const RUNE_SYMBOLS = ["💧", "🔥", "⚡", "🌙", "⭐"];
const RUNE_COLORS = ["#00bcd4", "#ff5722", "#ffeb3b", "#9c27b0", "#4caf50"];

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
    shrineRelics: [],
    gameComplete: false,
    puzzle: {
      state: "inactive",
      runes: [],
      sequence: [],
      playerSequence: [],
      nextStep: 0,
      showIndex: 0,
      showTimer: 0,
      wrongFlash: 0,
      completed: false,
    },
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

function initPuzzle(game) {
  const center = shrineCenter(game.world);
  const runes = [];
  const sequence = [];
  const usedAngles = [];

  for (let i = 0; i < RUNE_COUNT; i++) {
    let angle;
    let attempts = 0;
    do {
      angle = (i / RUNE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      attempts++;
    } while (usedAngles.some((a) => Math.abs(a - angle) < 0.4) && attempts < 20);
    usedAngles.push(angle);

    const dist = 55 + Math.random() * 20;
    const rx = center.x + Math.cos(angle) * dist;
    const ry = center.y + Math.sin(angle) * dist;
    runes.push({
      x: rx,
      y: ry,
      symbol: RUNE_SYMBOLS[i],
      color: RUNE_COLORS[i],
      lit: false,
      index: i,
    });
    sequence.push(i);
  }

  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }

  game.puzzle = {
    state: "showing",
    runes,
    sequence,
    playerSequence: [],
    nextStep: 0,
    showIndex: 0,
    showTimer: performance.now() + 800,
    wrongFlash: 0,
    completed: false,
  };
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
    y: game.world.spawn.ty * TILE + TILE / 2 + TILE * 3,
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
  if (game.wiped || game.gameComplete) {
    if (input.wantsRestart()) {
      sound.playRestart();
      const next = resetGame();
      Object.assign(game, next);
      setComplete(false);
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

  const leader = game.heroes[0];
  const wasNearShrine = game.nearShrine;

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

  if (game.currentMap === "overworld") {
    const shrine = shrineCenter(game.world);
    const distToShrine = Math.hypot(leader.x - shrine.x, leader.y - shrine.y);
    const nearShrineRadius = 48;
    game.nearShrine = distToShrine < nearShrineRadius;

    if (game.shrineState === "idle") {
      if (game.nearShrine && !game.shrineTriggered) {
        game.shrineTriggered = true;
        game.shrineState = "puzzle";
        sound.playShrine();
        initPuzzle(game);
        game.bannerText = "Solve the rune puzzle to seal the shrine!";
        game.bannerUntil = now + 3000;
      }
    } else if (game.shrineState === "puzzle" && !game.puzzle.completed) {
      const p = game.puzzle;
      if (p.state === "showing") {
        if (now > p.showTimer) {
          if (p.showIndex < p.sequence.length) {
            p.runes[p.sequence[p.showIndex]].lit = true;
            p.showIndex++;
            p.showTimer = now + 700;
          } else {
            p.state = "input";
            p.runes.forEach((r) => (r.lit = false));
          }
        }
      } else if (p.state === "input") {
        for (const rune of p.runes) {
          const rdist = Math.hypot(leader.x - rune.x, leader.y - rune.y);
          if (rdist < 28 && !rune.lit) {
            const expectedIndex = p.sequence[p.nextStep];
            if (rune.index === expectedIndex) {
              rune.lit = true;
              p.playerSequence.push(rune.index);
              p.nextStep++;
              sound.playShrine();

              if (p.nextStep >= p.sequence.length) {
                p.completed = true;
                p.state = "done";
                game.shrineState = "boss";
                sound.playBossSpawn();
                spawnBoss(game);
                game.bannerText = "The shrine opens! A Lynel emerges!";
                game.bannerUntil = now + 3000;
              }
            } else {
              p.wrongFlash = now + 600;
              p.state = "showing";
              p.showIndex = 0;
              p.showTimer = now + 800;
              p.nextStep = 0;
              p.playerSequence = [];
              p.runes.forEach((r) => (r.lit = false));
              setBanner("Wrong sequence! Watch again...");
              game.bannerUntil = now + 2000;
            }
            break;
          }
        }
      }
    } else if (game.shrineState === "completed") {
    }
  } else {
    game.nearShrine = false;
  }

  if (game.currentMap === "overworld" && game.shrineState === "boss") {
    if (game.shrineBoss && game.shrineBoss.hp <= 0) {
      const relicX = game.shrineBoss.x;
      const relicY = game.shrineBoss.y;
      game.shrineBoss = null;
      game.shrineState = "completed";
      game.hasMedal = true;
      sound.playVictory();
      healParty(game.heroes);
      game.shrineRelics.push({
        x: relicX,
        y: relicY,
        type: "lynel",
        collected: false,
      });
      game.bannerText = "The Lynel is vanquished! A shrine relic appeared!";
      game.bannerUntil = now + 5000;
    }
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
  } else if (game.currentMap === "overworld" && game.hasMedal) {
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
  } else {
    game.nearPortal = false;
  }

  if (game.portalCooldown && now > game.portalCooldown) {
    game.portalCooldown = 0;
  }

  for (const relic of game.shrineRelics) {
    if (relic.collected) continue;
    const dist = Math.hypot(leader.x - relic.x, leader.y - relic.y);
    if (dist < 40) {
      relic.collected = true;
      sound.playVictory();
      healParty(game.heroes);
      if (relic.type === "lynel") {
        game.bannerText = "Shrine entered! The blessing heals your entire party!";
        game.bannerUntil = now + 5000;
        const dest = zorasDomainCenter(game.world);
        for (const hero of game.heroes) {
          hero.x = dest.x;
          hero.y = dest.y;
        }
      } else if (relic.type === "aquamentus") {
        game.bannerText = "Shrine entered! The dragon's power restores your party!";
        game.bannerUntil = now + 5000;
        game.gameComplete = true;
      }
    }
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
      const relicX = game.cavernBoss.x;
      const relicY = game.cavernBoss.y;
      game.cavernBoss = null;
      game.cavernBossState = "completed";
      sound.playVictory();
      healParty(game.heroes);
      game.shrineRelics.push({
        x: relicX,
        y: relicY,
        type: "aquamentus",
        collected: false,
      });
      setBanner("Aquamentus is slain! A shrine relic appeared!");
      game.bannerUntil = now + 5000;
    }
  }

  if (game.shrineState === "puzzle" && !game.puzzle.completed) {
    if (game.puzzle.state === "showing") {
      const next = game.puzzle.sequence[game.puzzle.showIndex];
      if (next !== undefined) {
        setBanner(`Watch the sequence... ${game.puzzle.showIndex + 1} / ${game.puzzle.sequence.length}`);
      } else {
        setBanner("Now repeat the sequence!");
      }
    } else if (game.puzzle.state === "input") {
      setBanner(`Your turn! ${game.puzzle.nextStep} / ${game.puzzle.sequence.length}`);
    }
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
    setBanner("Step into the portal to travel");
  } else {
    const nearRelic = game.shrineRelics.find((r) => !r.collected && Math.hypot(leader.x - r.x, leader.y - r.y) < 70);
    if (nearRelic) {
      setBanner("A shrine relic glows before you. Step into it!");
    } else {
      setBanner("");
    }
  }

  if (game.heroes[0].hp <= 0 && !game.wiped) {
    game.wiped = true;
    sound.playWipe();
    setWipe(true);
    setBanner("");
  }
}
