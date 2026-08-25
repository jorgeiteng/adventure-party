import { createWorld, shrineCenter } from "./world.js?v=3";
import { spawnParty, updateParty } from "./hero.js";
import { spawnMonsters, updateMonsters } from "./monster.js";
import { spawnChests, updateChests } from "./chest.js?v=1";
import { updateHud, setBanner, setWipe } from "./render.js";
import { sound } from "./audio.js";

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
  };
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

  const shrine = shrineCenter(game.world);
  const leader = game.heroes[0];
  const wasNearShrine = game.nearShrine;
  game.nearShrine = Math.hypot(leader.x - shrine.x, leader.y - shrine.y) < 48;

  if (game.bannerUntil && now < game.bannerUntil) {
    setBanner(game.bannerText);
  } else if (game.nearShrine) {
    if (!wasNearShrine) {
      sound.playShrine();
    }
    setBanner("The sealed shrine waits. The final trial comes in Phase 2.");
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


