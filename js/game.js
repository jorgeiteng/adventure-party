import { createWorld, shrineCenter } from "./world.js?v=3";
import { spawnParty, updateParty } from "./hero.js";
import { spawnMonsters, updateMonsters } from "./monster.js";
import { updateHud, setBanner, setWipe } from "./render.js";

export function createGame() {
  return resetGame();
}

export function resetGame() {
  const world = createWorld();
  const heroes = spawnParty(world);
  const monsters = spawnMonsters(world);
  updateHud(heroes);
  setBanner("");
  setWipe(false);
  return {
    world,
    heroes,
    monsters,
    wiped: false,
    nearShrine: false,
  };
}

export function updateGame(game, input, now, dt) {
  if (game.wiped) {
    if (input.wantsRestart()) {
      const next = resetGame();
      Object.assign(game, next);
    }
    return;
  }

  updateParty(game.heroes, game.monsters, game.world, input, now, dt);
  updateMonsters(game.monsters, game.heroes, game.world, now, dt);
  updateHud(game.heroes);

  const shrine = shrineCenter(game.world);
  const leader = game.heroes[0];
  game.nearShrine = Math.hypot(leader.x - shrine.x, leader.y - shrine.y) < 48;
  if (game.nearShrine) {
    setBanner("The sealed shrine waits. The final trial comes in Phase 2.");
  } else {
    setBanner("");
  }

  if (game.heroes.every((hero) => hero.hp <= 0)) {
    game.wiped = true;
    setWipe(true);
    setBanner("");
  }
}
