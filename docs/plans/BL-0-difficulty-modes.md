# Plan: BL-0 — Difficulty Modes on Welcome Screen (Easy / Medium / Hard)

**Status**: Done — shipped as v0.15 (`60be48a`), browser pass ✓ · **Size**: Medium · **Requested by**: JJ
**Decisions locked**: R restarts with the **same** difficulty (no welcome re-show) · bosses scale with the same multipliers · no `localStorage` (future idea) · version → `0.15`

## Goal

Add an **Easy / Medium / Hard** choice to the welcome screen (`#welcome`) that meaningfully changes balance. **Medium is bit-for-bit identical to v0.14.**

## Files to Modify

| File | Change |
|---|---|
| `index.html:29-33` | Difficulty button group inside `#welcome` |
| `css/style.css` (~after `#welcome` rules, ~line 266) | Button group styles |
| `js/main.js:6,12,20-28` | `VERSION = "0.15"`; import `resetGame`; selection logic + event guards |
| `js/game.js:14-24,83,145,163,175,364` | `DIFFICULTY` table; `resetGame(difficulty)`; boss/portal/restart call sites |
| `js/hero.js:79` | `spawnParty(world, mult)` |
| `js/monster.js:145,165` + new helper | `spawnMonsters(world, mult, count)`; `scaleMonster()`; respawn timing |
| `docs/gameplay.md` | New "Difficulty Modes" section |
| `docs/README.md:34`, `README.md:54,59,83` | Version → `0.15`; assertion count |
| `docs/backlog.md` | Close **BL-1** (superseded by this bump) |
| `tests/test.py:61,189,345` | New id/state/CSS assertions |

No new JS modules → no new imports → no `?v=` changes (test-enforced).

## Difficulty Multipliers

| Stat | Easy | Medium | Hard |
|---|---|---|---|
| Hero maxHp | ×1.25 | ×1.0 | ×0.8 |
| Hero damage | ×1.2 | ×1.0 | ×0.85 |
| Hero speed | ×1.1 | ×1.0 | ×0.9 |
| Billie Jean healPulse | ×1.3 | ×1.0 | ×0.7 |
| Monster maxHp | ×0.75 | ×1.0 | ×1.3 |
| Monster damage | ×0.7 | ×1.0 | ×1.25 |
| Monster speed | ×0.85 | ×1.0 | ×1.15 |
| Monster aggro | ×0.8 | ×1.0 | ×1.2 |
| Monster attackCooldown | ×1.2 | ×1.0 | ×0.8 |
| Respawn delay | ×1.5 | ×1.0 | ×0.7 |

Removed from the original draft: **"Shrine wave count"** — `spawnWaveMonsters` (`game.js:66`) is dead code, never called (shrine flow = rune puzzle → boss). Leave the function untouched: `test.py:207` requires it to exist. Consequence: `docs/gameplay.md:114-118` ("Phase 1: Defense") is already stale — noted, out of scope for BL-0.

## Implementation Steps

### 1. UI — `index.html` + `css/style.css`

```html
<div id="difficulty-select" role="group" aria-label="Difficulty">
  <button type="button" id="diff-easy" data-diff="easy">Easy</button>
  <button type="button" id="diff-medium" data-diff="medium" class="selected">Medium</button>
  <button type="button" id="diff-hard" data-diff="hard">Hard</button>
</div>
<p class="welcome-hint">Pick a difficulty, then click or press any key to start</p>
```

Ids **and** `data-diff`: ids satisfy `test.py:61` (which checks `id="..."`), `data-diff` drives the logic. CSS: `#difficulty-select` inline-flex, gap 8px; buttons outlined; `.selected` filled gold (`#fef08a` on `#080c0a`), matching the `#welcome h1` palette.

### 2. Selection + dismissal — `js/main.js` (blocker fix)

The risk: `dismissWelcome` is bound to welcome **click**, window **mousedown**, and window **keydown** (`main.js:26-28`), so a click on a button would dismiss the welcome *before* selection registers. Fix by stopping group events from reaching those listeners:

```js
let selectedDifficulty = "medium";
const diffGroup = document.getElementById("difficulty-select");

diffGroup.addEventListener("mousedown", (e) => e.stopPropagation());
diffGroup.addEventListener("click", (e) => e.stopPropagation());      // button handler still runs first
diffGroup.addEventListener("keydown", (e) => {                        // Enter/Space activate the button…
  if (e.key === "Enter" || e.key === " ") e.stopPropagation();        // …without starting the game
});
diffGroup.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedDifficulty = btn.dataset.diff;
    diffGroup.querySelectorAll("button").forEach((b) => b.classList.toggle("selected", b === btn));
    btn.blur();   // focus returns to body → next plain keypress starts the game
  });
});

function dismissWelcome(e) {
  if (started) return;
  started = true;
  welcomeEl.style.display = "none";
  Object.assign(game, resetGame(selectedDifficulty));
}
```

Also: `import { createGame, updateGame, resetGame } from "./game.js?v=5"`.

Why `Object.assign(game, ...)`: `game` is a module-level `const` referenced by the rAF loop and `window.__hp` (`main.js:13`) — re-assigning would stale both. `Object.assign` mirrors the existing restart pattern (`game.js:175-176`). No `startLoop()`/`DOMContentLoaded` (neither exists — the first draft's error).

### 3. Difficulty table — `js/game.js`

```js
const DIFFICULTY = {
  easy:   { heroHp: 1.25, heroDmg: 1.2, heroSpeed: 1.1, heroHeal: 1.3,
            monHp: 0.75, monDmg: 0.7, monSpeed: 0.85, monAggro: 0.8, monCd: 1.2, respawn: 1.5 },
  medium: { heroHp: 1, heroDmg: 1, heroSpeed: 1, heroHeal: 1,
            monHp: 1, monDmg: 1, monSpeed: 1, monAggro: 1, monCd: 1, respawn: 1 },
  hard:   { heroHp: 0.8, heroDmg: 0.85, heroSpeed: 0.9, heroHeal: 0.7,
            monHp: 1.3, monDmg: 1.25, monSpeed: 1.15, monAggro: 1.2, monCd: 0.8, respawn: 0.7 },
};

export function createGame() { return resetGame("medium"); }

export function resetGame(difficulty = "medium") {
  const diffMult = DIFFICULTY[difficulty] || DIFFICULTY.medium;
  const world = createWorld();
  const heroes = spawnParty(world, diffMult);
  const monsters = spawnMonsters(world, diffMult);
  ...
  return { world, heroes, monsters, ..., difficulty, diffMult };
}
```

Threading lives in `resetGame`, not `createGame`, because restart calls `resetGame` directly (`game.js:175`) — both paths stay in sync.

### 4. Hero spawning — `js/hero.js:79`

`spawnParty(world, mult = null)` — `world` stays first (spawn position needs it). Multiply `maxHp`/`damage`/`speed`, and `healPulse` only when present on the spec; `hp = maxHp` after scaling. `Math.round` on every stat. Guard with `mult ? ... : value` so `null` = exact current behavior.

### 5. Monster spawning + scaling — `js/monster.js` & boss/portal sites

```js
export function scaleMonster(m, mult) {
  // applies monHp/monDmg/monSpeed/monAggro/monCd; hp = maxHp;
  // m.respawnMult = mult.respawn; returns m; no-op when mult is null
}
export function spawnMonsters(world, mult = null, count = 22) { ... scaleMonster(createMonster(spec, x, y), mult) ... }
```

Call sites updated (all in `game.js`): reset (`:21`), `switchToCavern` (`:145`), `switchToOverworld` (`:163`) — **without these, difficulty would silently reset after portal travel**.

Bosses don't go through `spawnMonsters` — wrap explicitly:

- `spawnBoss` (`game.js:83`): `scaleMonster(createMonster(lynelSpec(), ...), game.diffMult)`
- Aquamentus spawn (`game.js:364`): same with `game.diffMult`

Respawn delay (`monster.js:165`), where `respawnMult` finally gets used:

```js
monster.respawnAt = now + (7000 + world.rand() * 4000) * (monster.respawnMult || 1);
```

Respawn (`:169`) re-creates from the monster itself, so scaled stats carry over automatically.

### 6. Restart — simple option (`game.js:173-177`)

```js
if (input.wantsRestart()) {
  sound.playRestart();
  Object.assign(game, resetGame(game.difficulty));   // was: resetGame()
  setComplete(false);
}
```

Welcome screen shows **only on first launch**; R keeps the chosen difficulty. No `started`/`main.js` coordination needed.

### 7. Docs + version

- `docs/gameplay.md`: add **Difficulty Modes** section (multiplier table + note that R preserves the choice).
- `js/main.js:6`: `VERSION = "0.15"` · `docs/README.md:34`: `Current: 0.15`
- `README.md:59`: `v0.6 … v0.14` → `v0.15`; update "235 assertions" (`README.md:54,83`) to the new count.
- `docs/backlog.md`: move **BL-1** to Done (closed by this bump).

### 8. Tests — `tests/test.py`

- `:61` id list → add `"difficulty-select", "diff-easy", "diff-medium", "diff-hard"`
- `:189` required game state → add `"difficulty"`
- `:345` CSS selectors → add `"#difficulty-select"`
- Re-run: **0 failed**, new total; sync README count.

## Acceptance Criteria

- [x] Welcome shows three buttons, Medium pre-selected; clicking one selects without starting the game
- [x] Any other click/keypress starts with the selected mode (verified by headless UI harness: Enter on button selects without starting, plain keypress dismisses with selected mode; native Tab focus is browser-default)
- [x] Easy hero HP = 100/88/81/119; Hard = 64/56/52/76 (verified against `resetGame` output)
- [x] Medium stat-for-stat equals v0.14 (all multipliers ×1, `Math.round` identity — asserted by harness)
- [x] Bosses, cavern monsters, and portal round-trips all carry the chosen difficulty (all call sites wired)
- [x] **R** restarts into the same difficulty, no welcome screen (`resetGame(game.difficulty)`)
- [x] `python3 tests/test.py` → 243 passed, 0 failed · no syntax errors (`node --check`)

## Verification (manual, `python3 serve.py`)

1. Click "Hard" → welcome stays → click elsewhere → starts Hard
2. Tab to button + Enter → selects only; press W → starts
3. Press W with no selection → starts Medium (default)
4. Wipe → R → same difficulty, no welcome
5. Portal to cavern and back → difficulty persists
6. Compare Medium hero/monster stats against v0.14 values

## Effort

| Phase | Time |
|---|---|
| UI + guarded selection logic | 60 min |
| Multiplier plumbing (game/hero/monster, 6 call sites) | 75 min |
| Restart + docs + version | 25 min |
| Tests + browser verification | 30 min |
| **Total** | **~3 hrs** |

## Out of Scope

- `localStorage` persistence of last difficulty (future idea)
- Stale `docs/gameplay.md` "Phase 1: Defense" section (dead `spawnWaveMonsters` — pre-existing drift)
- Mid-game difficulty change
