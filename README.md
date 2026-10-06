# Adventure Party

A Zelda-inspired overworld in the browser: you lead one hero while three companions follow and auto-fight wandering monsters. Original names and art only — no Nintendo assets.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Why this repo exists

**Adventure Party** began as a vacation/weekend project with my 10-year-old son, a big Zelda fan who wanted to understand how a video game is actually made. He had just started coding classes, and I taught him to use AI coding tools as a learning partner — asking good questions, reading the suggestions, and iterating until the game did what he pictured. The goal was to teach software fundamentals through something worth playing: the project is deliberately small (≈4k lines, no build step, no dependencies), so the whole thing is readable in one sitting — and every concept below exists in real, working code rather than in a textbook example.

| Fundamental concept | Where it lives |
|---|---|
| Game loop and frame timing | `js/main.js` (rAF loop), `js/game.js` (`updateGame`) |
| Finite state machines | Shrine/boss flow — see `docs/architecture.md` |
| Deterministic randomness (seeded PRNG) | Mulberry32 in `js/world.js` |
| Data-driven design ("specs", not hardcoded behavior) | Recipes in `docs/contributing.md`, specs in `js/monster.js` |
| Modular code without a bundler | ES modules + `?v=5` cache-busting |
| Procedural generation and audio synthesis | `js/render.js`, `js/audio.js` |
| Testing without a framework | `tests/test.py` — 243 assertions |
| Writing documentation before code | `docs/` (architecture, technical, gameplay, contributing) |

## Play

This uses ES modules, so a local static server is more reliable than opening `index.html` as a file.

From this folder (PowerShell):

```powershell
.\serve.ps1
```

Or with Python:

```bash
python3 serve.py
# or: python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Controls

- **WASD** or **arrow keys** — move the leader
- **Space** or **click** — melee strike
- **R** — restart after a party wipe or on the completion screen
- **M** — toggle sound / mute (or click the 🔊 / 🔇 icon in HUD)

## The Adventure

1. Defend the sealed shrine in the northeast, then defeat the **Lynel**
2. Earn the Shrine Medal — the party is healed and travels to Zora's Domain
3. Talk to the villagers, then take the portal into **Zora's Cavern**
4. Slay **Aquamentus** in the depths and collect its relic to complete the adventure

Treasure chests scattered across the overworld grant permanent party upgrades.

### How the project is run

- **Small, versioned steps** — features landed as `v0.6`, `v0.7` … `v0.15`, each one reviewable on its own.
- **One onboarding document** — [`AGENTS.md`](AGENTS.md) tells any contributor (human or AI coding assistant) the commands, gotchas, and conventions in under a minute.
- **Tests as guardrails** — `tests/test.py` catches broken imports, unbalanced braces, game-state invariants, and CSS selectors, so a mistake is found in seconds, not at play time.
- **Docs that match the code** — module graph, game loop, and state machines are written down in `docs/architecture.md`.

## Repository layout

```
index.html        entry point (canvas + HUD)
js/               game modules — game, world, hero, monster, combat,
                  render, audio, npc, chest, camera, input, main
css/style.css     HUD and screens
tests/test.py     smoke/structural test suite (no framework)
docs/             architecture, technical, gameplay, contributing, getting started
AGENTS.md         contributor onboarding
serve.py          static dev server
```

## Tests

```bash
python3 tests/test.py
```

243 assertions, no dependencies. Run it after any change.

## Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md) — module graph, game loop, shrine state machine
- [Technical Notes](docs/technical.md) — rendering, audio, world generation
- [Gameplay](docs/gameplay.md) — heroes, monsters, loot, boss fights
- [Contributing](docs/contributing.md) — how to add a monster, hero, or item

## License

[MIT](LICENSE) — free to read, fork, and learn from.
