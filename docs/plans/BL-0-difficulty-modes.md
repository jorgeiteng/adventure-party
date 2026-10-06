# Plan: BL-0 — Difficulty Modes on Welcome Screen (Easy / Medium / Hard)

**Status**: Planned · **Size**: Medium · **Requested by**: JJ

---

## Goal
Add an **Easy / Medium / Hard** selection to the welcome screen (`#welcome`) that meaningfully changes game balance. Medium = current v0.14 balance.

---

## Files to Modify

| File | Changes |
|------|---------|
| `index.html` | Add three difficulty buttons inside `#welcome` |
| `css/style.css` | Style button group (hover/active/selected) |
| `js/main.js` | Capture selection, pass to `createGame(difficulty)` |
| `js/game.js` | Store `difficulty` in state; compute multipliers; pass to spawners |
| `js/hero.js` | `spawnParty(mult)` applies hero multipliers |
| `js/monster.js` | `spawnMonsters(world, count, mult)` applies monster multipliers |
| `docs/gameplay.md` | Document the three modes |
| `js/main.js` | Bump `VERSION = "0.15"` |
| `docs/README.md` | Update `Current: 0.15` |
| `tests/test.py` | Add new button IDs + CSS selector assertions |

---

## Difficulty Multipliers (Proposed)

| Stat | Easy | Medium (base) | Hard |
|------|------|---------------|------|
| Hero maxHp | ×1.25 | ×1.0 | ×0.8 |
| Hero damage | ×1.2 | ×1.0 | ×0.85 |
| Hero speed | ×1.1 | ×1.0 | ×0.9 |
| Billie Jean healPulse | ×1.3 | ×1.0 | ×0.7 |
| Monster maxHp | ×0.75 | ×1.0 | ×1.3 |
| Monster damage | ×0.7 | ×1.0 | ×1.25 |
| Monster speed | ×0.85 | ×1.0 | ×1.15 |
| Monster aggro | ×0.8 | ×1.0 | ×1.2 |
| Monster attackCooldown | ×1.2 | ×1.0 | ×0.8 |
| Respawn time | ×1.5 | ×1.0 | ×0.7 |
| Shrine wave count | 4 | 6 | 8 |

Medium matches current values exactly (×1.0).

---

## Implementation Steps

### 1. UI — `index.html` + `css/style.css`

Add inside `#welcome` (after `<h1>` and tagline):

```html
<div id="difficulty-select" role="radiogroup" aria-label="Difficulty">
  <button type="button" data-diff="easy" title="Easier enemies, stronger heroes">Easy</button>
  <button type="button" data-diff="medium" class="selected" title="Standard balance">Medium</button>
  <button type="button" data-diff="hard" title="Tougher enemies, weaker heroes">Hard</button>
</div>
<p class="welcome-hint">Click a difficulty, then press any key to start</p>
```

CSS (`css/style.css`, near `#welcome` rules):

```css
#difficulty-select {
  display: inline-flex;
  gap: 8px;
  margin: 16px 0;
}
#difficulty-select button {
  padding: 8px 18px;
  font-size: 15px;
  font-family: inherit;
  background: rgba(244, 234, 208, 0.12);
  border: 2px solid rgba(244, 234, 208, 0.3);
  color: #f4ead0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 120ms ease;
}
#difficulty-select button:hover {
  background: rgba(244, 234, 208, 0.25);
  border-color: #f4ead0;
}
#difficulty-select button.selected {
  background: #fef08a;
  color: #080c0a;
  border-color: #d4af37;
}
```

### 2. Selection Logic — `js/main.js`

```js
// top of file
let selectedDifficulty = "medium";

// inside DOMContentLoaded
const diffButtons = document.querySelectorAll("#difficulty-select button");
diffButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedDifficulty = btn.dataset.diff;
    diffButtons.forEach((b) => b.classList.toggle("selected", b === btn));
  });
});

// modify dismissWelcome
function dismissWelcome() {
  welcomeEl.style.display = "none";
  const game = createGame(selectedDifficulty);
  startLoop(game);
}
```

Keep "any key" working — it uses current `selectedDifficulty` (defaults to Medium).

### 3. Game State — `js/game.js`

```js
// near top
const DIFFICULTY = {
  easy:   { heroHp: 1.25, heroDmg: 1.2, heroSpeed: 1.1, heroHeal: 1.3,
            monHp: 0.75, monDmg: 0.7, monSpeed: 0.85, monAggro: 0.8,
            monCd: 1.2, respawn: 1.5, shrineWaves: 4 },
  medium: { heroHp: 1.0,  heroDmg: 1.0, heroSpeed: 1.0, heroHeal: 1.0,
            monHp: 1.0,   monDmg: 1.0, monSpeed: 1.0,  monAggro: 1.0,
            monCd: 1.0,   respawn: 1.0, shrineWaves: 6 },
  hard:   { heroHp: 0.8,  heroDmg: 0.85, heroSpeed: 0.9, heroHeal: 0.7,
            monHp: 1.3,   monDmg: 1.25,  monSpeed: 1.15, monAggro: 1.2,
            monCd: 0.8,   respawn: 0.7,  shrineWaves: 8 },
};

export function createGame(difficulty = "medium") {
  const mult = DIFFICULTY[difficulty] || DIFFICULTY.medium;
  const game = {
    // ...existing fields
    difficulty,
    diffMult: mult,
  };
  // spawnParty(game.heroes, mult)
  // spawnMonsters(game.world, 22, mult)
  return game;
}
```

### 4. Hero Spawning — `js/hero.js`

```js
export function spawnParty(difficultyMult = {}) {
  return PARTY.map((spec, index) => ({
    // ...existing
    maxHp: Math.round(spec.maxHp * (difficultyMult.heroHp ?? 1)),
    damage: Math.round(spec.damage * (difficultyMult.heroDmg ?? 1)),
    speed: Math.round(spec.speed * (difficultyMult.heroSpeed ?? 1)),
    healPulse: Math.round((spec.healPulse ?? 0) * (difficultyMult.heroHeal ?? 1)),
    // hp starts at maxHp
    hp: Math.round(spec.maxHp * (difficultyMult.heroHp ?? 1)),
  }));
}
```

### 5. Monster Spawning — `js/monster.js`

```js
export function spawnMonsters(world, count, difficultyMult = {}) {
  // ...existing loop
  const kind = randomKind(world);
  const m = createMonster(kind, x, y);
  // apply multipliers
  m.maxHp = Math.round(m.maxHp * (difficultyMult.monHp ?? 1));
  m.hp = m.maxHp;
  m.damage = Math.round(m.damage * (difficultyMult.monDmg ?? 1));
  m.speed = Math.round(m.speed * (difficultyMult.monSpeed ?? 1));
  m.aggro = Math.round(m.aggro * (difficultyMult.monAggro ?? 1));
  m.attackCooldown = Math.round(m.attackCooldown * (difficultyMult.monCd ?? 1));
  m.respawnMult = difficultyMult.respawn ?? 1;
  // ...
}
```

Shrine wave/boss functions also read `game.diffMult.shrineWaves` and apply same multipliers.

### 6. Restart Flow

On **R** (game over or complete): re-show `#welcome` with last choice pre-selected (read from `game.difficulty` or `localStorage`).

```js
// in main.js, restart handler
welcomeEl.style.display = "flex";
diffButtons.forEach((b) => b.classList.toggle("selected", b.dataset.diff === lastDifficulty));
```

Optional: `localStorage.setItem("difficulty", selectedDifficulty)` on pick; read on load.

### 7. Docs + Version

- `docs/gameplay.md`: Add `## Difficulty Modes` section with the multiplier table.
- `js/main.js:6`: `const VERSION = "0.15";`
- `docs/README.md:34`: `Current: 0.15`

### 8. Tests — `tests/test.py`

- Line 61: add `"diff-easy", "diff-medium", "diff-hard", "difficulty-select"` to tag list
- Line 345: add `"#difficulty-select"` to CSS selector list
- Run `python3 tests/test.py` → expect 235+ passing

---

## Open Questions (Decide Before Code)

1. **Restart behavior**: Re-show welcome with last choice pre-selected, or always default to Medium? → *Recommend: remember last choice, show it pre-selected*
2. **Persist across sessions?**: `localStorage` remember last difficulty? → *Recommend: yes, one line*
3. **Boss scaling**: Lynel/Aquamentus use same multipliers? → *Recommend: yes*
4. **Version bump**: Minor (`0.15`) or patch (`0.14.1`)? → *Recommend: minor `0.15` (user-facing feature)*

---

## Acceptance Criteria

- [ ] Welcome screen shows three styled buttons; Medium pre-selected
- [ ] Clicking a button highlights it; "any key" starts with that mode
- [ ] In-game stats reflect multipliers (Easy hero HP ≈ 100/88/81/119; Hard ≈ 64/56/52/76)
- [ ] Medium behaves identically to current v0.14
- [ ] `python3 tests/test.py` passes (≥235)
- [ ] No console errors on load/play/restart

---

## Effort Estimate

| Phase | Time |
|-------|------|
| UI + selection | 45 min |
| Multiplier plumbing (game/hero/monster) | 60 min |
| Shrine wave + restart flow | 20 min |
| Docs + tests | 20 min |
| **Total** | **~2.5 hrs** |

---

## Alternative Approaches Considered

- **Simpler**: Only scale monster HP/damage (2 multipliers) — less distinct feel
- **Per-monster scaling**: Different multipliers per type — more complex
- **Preset configs**: Three full spec tables in `difficulty.js` — cleanest separation, more files

**Recommendation**: Multiplier table above — single source of truth, easy to tune, minimal file churn.