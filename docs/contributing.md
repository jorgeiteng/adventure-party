# Contributing

## Code Conventions

- **No build tools** — vanilla ES modules, no bundler, no transpiler
- **No external dependencies** — everything is self-contained
- **File naming**: lowercase, short, descriptive (`hero.js`, `combat.js`, `render.js`)
- **Export style**: Named exports (`export function createGame()`)
- **Module versioning**: Cache-busted via `?v=5` query strings on script/link tags
- **Indentation**: 2 spaces
- **Semicolons**: Used consistently
- **Quotes**: Double quotes for strings in JS, single quotes in CSS

## Project Layout

| Concern | Files |
|---|---|
| Bootstrap & loop | `main.js` |
| Game state & orchestration | `game.js` |
| World data & collision | `world.js` |
| Entity behavior | `hero.js`, `monster.js`, `chest.js`, `npc.js` |
| Combat mechanics | `combat.js` |
| Input handling | `input.js` |
| All rendering | `render.js` |
| Camera/viewport | `camera.js` |
| Audio engine | `audio.js` |
| Styles | `css/style.css` |

## How to Add a New Monster

1. **Define the spec** in `js/monster.js`:

```javascript
const MY_MONSTER = {
  id: "myMonster",
  name: "My Monster",
  color: "#ff0000",
  accent: "#880000",
  r: 10,           // collision radius
  speed: 70,
  maxHp: 25,
  damage: 8,
  attackRange: 16,
  attackCooldown: 800,
  aggro: 140,       // detection range
  knockback: 40,
  hover: false,     // true for flying monsters
};
```

2. **Add to `KINDS`** (overworld) or `CAVERN_KINDS` (cavern) array
3. **Add a draw function** in `js/render.js`:

```javascript
function drawMyMonster(ctx, entity, time, flash) {
  // Draw the monster using Canvas 2D
  // Use `flash` to white-out colors when hit
}
```

4. **Register in `drawCreature`** (`render.js:1238`):

```javascript
} else if (entity.id === "myMonster") {
  drawMyMonster(ctx, entity, time, flash);
}
```

## How to Add a New Loot Item

1. **Add a chest definition** in `js/chest.js`:

```javascript
{
  id: "chest_myItem",
  tx: 20,   // tile X position
  ty: 30,   // tile Y position
  loot: {
    id: "myItem",
    name: "My Item",
    icon: "🗡️",
    desc: "+5 Damage for everyone!",
    apply: (heroes) => {
      for (const hero of heroes) {
        hero.damage += 5;
      }
    },
  },
}
```

2. The chest will automatically:
   - Spawn at the tile position
   - Open when any hero walks near it
   - Play the chest open sound
   - Display the loot banner
   - Apply the stat changes permanently

## How to Add a New Party Member

1. **Add to the `PARTY` array** in `js/hero.js`:

```javascript
{
  id: "newHero",
  name: "New Hero",
  role: "Tank",
  color: "#888888",
  accent: "#444444",
  offset: { x: -28, y: -10 },  // formation offset from leader
  speed: 130,
  maxHp: 100,
  damage: 7,
  attackRange: 18,
  attackCooldown: 450,
  knockback: 80,
  // Optional:
  healPulse: 0,      // healing per pulse
  healEvery: 0,      // ms between pulses
},
```

2. **Add a draw function** in `js/render.js` (similar to `drawCody`, etc.)
3. **Register in `drawCreature`** under the hero section

## How to Modify World Generation

World generation is in `js/world.js`. Key functions:

- `createWorld(seed)` — overworld generation
- `createCavernWorld(seed)` — cavern generation
- `carveDisk(cx, cy, radius, tile)` — clear a circular area
- `carvePath(x0, y0, x1, y1)` — carve a winding path between two points

To change the map size, modify `MAP_W` and `MAP_H` (currently 64×64). To change tile size, modify `TILE` (currently 32px).

## How to Extend the Audio System

Sound effects are defined in `js/audio.js` in the `SoundEngine` class. Each effect is a method that:

1. Gets or creates the `AudioContext`
2. Creates oscillator(s) and/or noise sources
3. Connects through the gain graph: `source → effectGain → sfxGain → masterGain → destination`
4. Schedules start/stop times

Common waveforms:
- `triangle` — soft, melodic (used for swings, chimes)
- `square` — punchy, retro (used for hits)
- `sawtooth` — harsh, crunchy (used for deaths, wipes)
- `sine` — pure, clean (used for healing, bass)

## Git Workflow

1. Create a feature branch from main
2. Make changes, test in browser
3. Ensure the game loads and runs without console errors
4. Commit with a descriptive message
5. Open a PR for review

There is no CI/CD pipeline — testing is manual in the browser.
