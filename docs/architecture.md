# Architecture

## Directory Structure

```
adventure-party/
├── index.html              # Single-page HTML entry point
├── serve.py                # Python dev server (port 8080)
├── serve.ps1               # PowerShell dev server (Windows)
├── css/
│   └── style.css           # HUD, banners, welcome screen, game over styles
├── js/
│   ├── main.js             # Bootstrap + game loop (requestAnimationFrame)
│   ├── game.js             # Central game state & update orchestration
│   ├── world.js            # Procedural tile map generation & collision
│   ├── hero.js             # Party definitions, spawning, companion AI
│   ├── monster.js          # Monster definitions, spawning, AI behavior
│   ├── combat.js           # Melee hit detection, damage, knockback
│   ├── chest.js            # Treasure chest definitions & loot application
│   ├── npc.js              # NPC definitions & dialogue system
│   ├── input.js            # Keyboard/mouse input handling
│   ├── camera.js           # Viewport tracking & world-to-screen transform
│   ├── render.js           # Canvas 2D drawing for all entities, world, HUD
│   └── audio.js            # Procedural Web Audio sound engine & BGM
└── docs/                   # This documentation
```

## Module Dependency Graph

```
main.js
├── input.js        (keyboard/mouse state)
├── camera.js       (viewport transform)
├── game.js         (game state & update loop)
│   ├── world.js    (tile map, collision)
│   ├── hero.js     (party spawning, AI)
│   │   ├── world.js
│   │   ├── combat.js
│   │   └── audio.js
│   ├── monster.js  (monster spawning, AI)
│   │   ├── world.js
│   │   ├── combat.js
│   │   └── audio.js
│   ├── chest.js    (loot definitions)
│   │   ├── world.js
│   │   └── audio.js
│   ├── npc.js      (dialogue system)
│   │   └── world.js
│   ├── render.js   (HUD updates, banners)
│   └── audio.js    (sound triggers)
└── render.js       (drawing world + entities)
    ├── world.js    (tile data)
    └── camera.js   (coordinate transform)
```

## Game Loop

The game loop runs in `js/main.js:46` via `requestAnimationFrame`:

```
Each frame:
  1. Calculate delta time (dt), capped at 50ms
  2. If game started:
     a. updateGame(game, input, now, dt)
     b. updateCamera(camera, leader, canvas, world)
  3. Clear canvas
  4. drawWorld(ctx, world, camera, now)
  5. drawEntities(ctx, camera, heroes, monsters, chests, ...)
  6. requestAnimationFrame(frame)
```

### Update Phase (`game.js:updateGame`)

1. **Input processing** — leader movement via `input.axis()`
2. **Party update** — leader moves, companions follow/auto-fight (`hero.js:updateParty`)
3. **Monster update** — aggro AI, wandering, respawning (`monster.js:updateMonsters`)
4. **Chest check** — proximity detection, loot application (`chest.js:updateChests`)
5. **Shrine state machine** — idle → defense → boss → completed
6. **NPC dialogue** — proximity-based dialogue cycling
7. **Portal transitions** — overworld ↔ cavern (post-victory)
8. **Party wipe check** — game over if leader dies

### Render Phase

1. **World tiles** — only visible tiles are drawn (camera culling)
2. **Entities** — sorted by Y position for depth ordering
3. **Boss HUD** — health bar overlay during boss fight
4. **HTML overlays** — party HUD, banners, game over screen

## Game State Object

Created by `createGame()` in `game.js:11`, the central state object contains:

| Field | Type | Description |
|---|---|---|
| `world` | object | Tile map, dimensions, spawn points |
| `heroes` | array | 4 party members with HP, position, stats |
| `monsters` | array | All active monsters (including respawnable) |
| `chests` | array | 6 treasure chests with loot definitions |
| `npcs` | array | NPCs at Zora's Domain |
| `shrineState` | string | `"idle"` / `"defense"` / `"boss"` / `"completed"` |
| `shrineWave` | array | Monsters in current defense wave |
| `shrineBoss` | object | The Lynel boss (or null) |
| `hasMedal` | boolean | True after defeating the Lynel |
| `currentMap` | string | `"overworld"` or `"cavern"` |
| `wiped` | boolean | True when party is defeated |

## Shrine Puzzle State Machine

```
idle ──(approach shrine)──> defense ──(all wave mobs dead)──> boss ──(Lynel dead)──> completed
  ^                              |                                |
  │                         (6 mobs spawn)                  (heal party,
  │                         "Defend the shrine!"            earn medal,
  │                                                        teleport to
  └──────────────(restart with R)───────────────────────── Zora's Domain)
```

## Coordinate Systems

- **Tile coordinates** — integer grid (0–63 x, 0–63 y), each tile is 32×32 pixels
- **World coordinates** — pixel position (tile * 32 + 16 for center)
- **Screen coordinates** — relative to camera viewport (`worldToScreen()`)

The camera follows the leader and clamps to world boundaries (`camera.js:5`).
