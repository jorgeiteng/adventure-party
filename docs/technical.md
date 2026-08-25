# Technical Details

## Rendering Engine

All graphics are drawn procedurally using the **Canvas 2D API** — no sprite sheets, no image assets.

### World Rendering (`render.js:154`)

The world is a 64×64 grid of 32px tiles. Only visible tiles are drawn (camera culling):

```javascript
const minTx = Math.max(0, Math.floor(camera.x / TILE));
const maxTx = Math.min(MAP_W - 1, Math.floor((camera.x + camera.w) / TILE));
```

Tile drawing is a two-pass system:
1. **Pass 1**: Base tiles (grass, flowers, path, water, shrine, cavern floor/water/wall, portal)
2. **Pass 2**: Overlay tiles (trees, rocks) — drawn on top of grass

### Entity Rendering (`render.js:1220`)

Entities are sorted by Y position before drawing (`render.js:1447`) for correct depth ordering:

```javascript
const all = [...chests, ...heroes, ...monsters, ...npcs].sort((a, b) => a.y - b.y);
```

Each entity type has a dedicated drawing function:
- **Heroes**: `drawCody`, `drawZack`, `drawJustin`, `drawBillieJean` — detailed character art with weapons, armor, hair, and accessories
- **Monsters**: `drawMossCrawler`, `drawFanglet`, `drawSkyGnat`, `drawLynel`, `drawBiri`, `drawTektite`, `drawDarknut`, `drawAquamentus`
- **Chests**: `drawChest` — closed (wooden box with iron bands) or open (with sparkle particles)
- **NPCs**: `drawNpc` — simple body + head with name label

All entities face their `facing` direction using `ctx.rotate()`.

### Visual Effects

- **Damage flash**: White overlay for 120ms on hit (`flashUntil`)
- **Hover**: Sky Gnat and Biri bob vertically via `Math.sin(time / 180) * 3`
- **Water animation**: Sine-wave color shifting (`render.js:41`)
- **Chest sparkles**: 5 ascending golden particles after opening (`render.js:1361`)
- **Shrine glow**: Pulsing blue column (`render.js:77`)
- **Portal animation**: Concentric pulsing rings with orbiting particles (`render.js:119`)

### Camera System (`camera.js`)

The camera follows the leader and clamps to world boundaries:

```javascript
camera.x = target.x - camera.w / 2;
camera.y = target.y - camera.h / 2;
// Clamp to [0, world.width - camera.w]
```

The canvas auto-resizes on window resize with device pixel ratio scaling (`main.js:30`).

## Audio System (`audio.js`)

All sound is generated procedurally using the **Web Audio API**. The `SoundEngine` class manages:

### Audio Graph

```
Oscillators/Noise → SFX Gain (0.8) ─┐
                                     ├→ Master Gain (0.7) → Destination
BGM Oscillators → Music Gain (0.22) ─┘
```

### Sound Effects

| Sound | Method | Technique |
|---|---|---|
| Sword swing | `playSwing()` | Triangle wave pitch sweep + filtered noise whoosh |
| Hit impact | `playHit()` | Square wave thump + lowpass noise |
| Monster death | `playMonsterDeath()` | Sawtooth descending crunch + bandpass noise |
| Hero hurt | `playHeroHurt()` | Sawtooth double-pulse alarm |
| Hero death | `playHeroDeath()` | 3 descending triangle tones (D4→A3→E3) |
| Heal pulse | `playHeal()` | 4-note ascending sine chime (C5→E5→G5→C6) |
| Shrine discovery | `playShrine()` | D major 9th shimmer chord |
| Chest open | `playChestOpen()` | 6-note rising triangle arpeggio + sine shimmer |
| Party wipe | `playWipe()` | 4-note minor descent with lowpass filter |
| Restart | `playRestart()` | 5-note ascending triangle fanfare |
| Boss spawn | `playBossSpawn()` | Low sawtooth rumble crescendo + minor chord impact |
| Victory | `playVictory()` | 7-note ascending triad fanfare |

Each hero's swing sound is pitch-shifted by role:
- Leader (Cody): 420 Hz base
- Striker (Zack): 540 Hz (sharp)
- Reach (Justin): 380 Hz (deep)
- Warden (Billie Jean): 300 Hz (heavy)

### Background Music

A Zelda-esque 16-step melody loop with bass accompaniment:
- **Melody**: Triangle wave, 16 notes (C major scale progression)
- **Bass**: Sine wave, 4 chords (C3, F3, D3, G3) playing every 2 steps
- **Tempo**: 240ms per step
- Runs via `setTimeout` (not `AudioContext` timing)

### Mute Persistence

Mute state is saved to `localStorage` under `adventure_party_muted`.

## World Generation (`world.js`)

### Seeded PRNG

Uses a Mulberry32 PRNG (`world.js:19`) seeded with `20260825` for deterministic generation:

```javascript
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a += 0x6d2b79f5;
    // ... bit mixing ...
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### Noise Function

Value noise with smoothstep interpolation (`world.js:30`):

```javascript
function noise2(randGrid, x, y) {
  // Bilinear interpolation of random grid values
  // with smoothstep: u = x²(3 - 2x)
}
```

### Overworld Generation

1. **Base layer**: Fill with grass, apply 2-octave noise to place water (west side) and flowers
2. **Clear zones**: Carve grass disks at spawn (5 radius), shrine (5 radius), Zora's Domain (4 radius water + 2 radius grass)
3. **Paths**: Carve 1.7-radius paths from spawn→shrine and spawn→Zora's Domain
4. **Trees**: 90 random clusters (1–3 trees each), avoiding spawn and shrine areas
5. **Rocks**: 40 random single rocks on grass/flowers
6. **Shrine tile**: Place shrine tile at (50, 12)

### Cavern Generation

1. **Base layer**: Fill with cavern floor, apply noise for cavern walls (edges + noise threshold) and cavern water
2. **Clear zones**: Carve floor disks at spawn (4 radius) and boss room (6 radius)
3. **Path**: Carve 1.5-radius path from spawn→boss room
4. **Water pools**: 60 random water clusters
5. **Portal tile**: Place portal at spawn point

### Tile Types

| ID | Name | Solid | Description |
|---|---|---|---|
| 0 | GRASS | No | Base terrain |
| 1 | FLOWERS | No | Decorative grass variant |
| 2 | PATH | No | Carved walkway |
| 3 | WATER | Yes | Impassable |
| 4 | TREE | Yes | Impassable (drawn as overlay) |
| 5 | ROCK | Yes | Impassable (drawn as overlay) |
| 6 | SHRINE | No | Shrine puzzle trigger |
| 7 | CAVERN_FLOOR | No | Cavern base terrain |
| 8 | CAVERN_WALL | Yes | Cavern boundary |
| 9 | CAVERN_WATER | Yes | Cavern water |
| 10 | PORTAL | No | Map transition point |

### Collision Detection

Circle-vs-tile collision (`world.js:156`):

```javascript
function circleHitsSolid(world, x, y, radius) {
  // Check all tiles the circle overlaps
  // For each solid tile, find nearest point on tile rect
  // If distance² < radius², collision
}
```

Movement uses axis-separated collision (`world.js:176`): X and Y are checked independently, allowing sliding along walls.

## Combat System (`combat.js`)

### Melee Attack (`tryMelee`)

1. Check cooldown (`attacker.nextAttack`)
2. Calculate hit point: `attacker.position + facing * (radius + range * 0.45)`
3. For each target: if distance from hit point ≤ `range + target.radius`, apply hit
4. Set cooldown and swing animation timer

### Damage Application (`applyHit`)

1. Calculate effective damage (raw × (1 - damageReduction))
2. Reduce target HP (minimum 0)
3. Set invulnerability frames (280ms default)
4. Set flash timer (120ms)
5. Apply knockback vector (attacker→target direction × knockback force)
6. Play appropriate sound effect

### Knockback Physics (`tickKnockback`)

```javascript
entity.knock.x *= Math.exp(-10 * dt);  // Exponential decay
```

Knockback decays exponentially and is applied via the same collision system as normal movement.

### Damage Reduction

Heroes with `damageReduction` take reduced damage:
```javascript
effectiveDamage = Math.max(1, Math.round(rawDamage * (1 - target.damageReduction)));
```

The Iron Crest Shield grants 20% reduction to all party members.

## Input System (`input.js`)

- Tracks held keys in a `Set` (using `event.code`)
- `axis()` returns normalized direction vector from WASD/arrows
- `consumeAttack()` returns and clears the attack queue (Space/click)
- `wantsRestart()` checks for R key
- Pointer position is tracked but not currently used for movement
- Sound is unlocked on first interaction (browser autoplay policy)
