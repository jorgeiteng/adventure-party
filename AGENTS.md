# AGENTS.md

Browser game: vanilla JS ES modules + Canvas 2D + Web Audio. Single page, no framework.

## No build tooling

- There is no `package.json`, no npm/node toolchain, no bundler, no linter, no typecheck. Do not run `npm install` or look for build scripts.
- All art and audio are procedural (Canvas 2D draw functions in `js/render.js`, synthesized Web Audio in `js/audio.js`). There are no image/sound asset files.

## Commands

- Serve (required — ES modules fail under `file://`): `python3 serve.py` (port 8080, optional port arg). Then open http://localhost:8080.
- Verify: `python3 tests/test.py` — the only automated check (~235 regex-based smoke assertions: brace balance, import/export consistency, game-state invariants, CSS selectors). Run after every change.
- No CI exists. Beyond test.py, verification is manual: load the game in a browser and check the console for errors.

## Gotchas

- Every JS→JS import carries a `?v=5` cache-buster (`import ... from "./world.js?v=5"`), matching the `<script>` tag in `index.html`. When adding imports, keep `?v=5`; when bumping the version, bump it everywhere at once — `test.py` fails if any import has a `?v=` other than 5.
- World generation is deterministic (seeded Mulberry32 PRNG in `js/world.js`); changing the seed or generation order reshapes the whole map.
- `window.__hp` (`{ game, input, camera }`) is exposed in `js/main.js` for browser-console debugging.

## Conventions

- Named exports only (`export function createGame()`), 2-space indent, double quotes in JS, lowercase short filenames.
- New monsters/heroes/loot follow recipes in `docs/contributing.md`: define spec in the relevant `js/` file, then add a draw function in `js/render.js` and register it in `drawCreature`.

## Architecture pointers

`docs/architecture.md` has the module dependency graph, game loop, and shrine state machine; `docs/technical.md` covers rendering/audio/world-gen internals. Entry flow: `index.html` → `js/main.js` (rAF loop) → `js/game.js` (`updateGame` orchestrates world/hero/monster/chest/npc updates) → `js/render.js` (draws everything). Game state lives in one object from `createGame()` in `js/game.js`.
