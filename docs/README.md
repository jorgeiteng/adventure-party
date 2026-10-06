# Adventure Party — Documentation

A Zelda-inspired browser action-adventure game. Lead a party of four heroes through a procedurally generated overworld, fight monsters, collect loot, and face the shrine boss.

All art and sound are generated procedurally — no external image or audio assets.

## Table of Contents

| Document | Description |
|---|---|
| [Getting Started](getting-started.md) | Setup, installation, and running locally |
| [Architecture](architecture.md) | Module structure, data flow, and game loop |
| [Gameplay](gameplay.md) | Controls, characters, monsters, loot, and shrine puzzle |
| [Technical Details](technical.md) | Rendering, audio, world generation, and combat internals |
| [Contributing](contributing.md) | Code conventions and how to extend the project |
| [Backlog](backlog.md) | Planned work: Spec-Driven Development and other open items |

## Quick Start

```bash
git clone <repo-url> && cd adventure-party
python serve.py
# Open http://localhost:8080
```

## Tech Stack

- **Vanilla JavaScript** (ES Modules, no build tools)
- **HTML5 Canvas 2D** for all rendering
- **Web Audio API** for procedural sound effects and music
- **Zero dependencies** — runs directly from source

## Project Version

Current: `0.15`
