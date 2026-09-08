# Gameplay

## Controls

| Input | Action |
|---|---|
| **WASD** / **Arrow Keys** | Move the party leader |
| **Space** / **Left Click** | Melee attack |
| **R** | Restart (after game over) |
| **M** / **Sound Button** | Toggle mute |

Movement is normalized diagonally (holding W+D moves at the same speed as W alone).

## Party Members

You control a party of four heroes. The leader (Cody) is player-controlled; the other three follow and fight automatically.

| Name | Role | Color | Weapon | Stats | Special |
|---|---|---|---|---|---|
| **Cody** | Leader | Green | Broadsword & Shield | 80 HP, 9 DMG, 22 range | Player-controlled |
| **Zack** | Striker | Red | Dual Daggers | 70 HP, 12 DMG, 20 range | Fastest attack (340ms cooldown) |
| **Justin** | Reach | Blue | Long Spear | 65 HP, 8 DMG, 30 range | Longest attack range |
| **Billie Jean** | Warden | Gold | Warhammer | 95 HP, 6 DMG, 18 range | Heals nearby allies (6 HP every 4.2s) |

### Companion AI

- Companions follow the leader in a diamond formation (offsets rotate with facing direction)
- If a monster is within 88px, the companion breaks formation to chase and attack it
- Companions have a 150px leash range — they won't wander too far from the leader
- Billie Jean's heal pulse affects all allies within 70px

## Monsters

### Overworld Monsters

| Monster | Color | HP | DMG | Speed | Behavior |
|---|---|---|---|---|---|
| **Moss Crawler** | Green | 28 | 7 | 52 | Slow, tanky, 130px aggro |
| **Fanglet** | Brown | 18 | 8 | 88 | Fast, fragile, 160px aggro |
| **Sky Gnat** | Purple | 12 | 5 | 110 | Fastest, flies (hovers), 150px aggro |

22 monsters spawn across the overworld. They respawn 7–11 seconds after death at a random walkable location away from the leader.

### Cavern Monsters

| Monster | Color | HP | DMG | Speed | Behavior |
|---|---|---|---|---|---|
| **Biri** | Cyan | 22 | 6 | 70 | Electric, hovers, 140px aggro |
| **Tektite** | Indigo | 32 | 10 | 95 | Spider-like, 170px aggro |
| **Darknut** | Black/Red | 55 | 14 | 40 | Heavy armor, slow, 120px aggro |

18 monsters spawn in the cavern.

### Boss: Lynel

| Stat | Value |
|---|---|
| HP | 120 |
| Damage | 18 |
| Speed | 65 |
| Attack Range | 22 |
| Aggro Range | 300 |

The Lynel spawns during the shrine defense boss phase. It does not respawn.

### Boss: Aquamentus (Cavern)

| Stat | Value |
|---|---|
| HP | 180 |
| Damage | 22 |
| Speed | 45 |
| Attack Range | 28 |
| Aggro Range | 350 |

The Aquamentus is the cavern's final boss. It spawns when the leader enters the boss room (tile (32, 12), within 120px), does not respawn, and is the last encounter in the game.

### Monster AI

1. **Idle** — wander in a random direction for 0.8–2.4 seconds
2. **Aggro** — if a hero is within aggro range, chase and attack
3. **Attack** — melee hit when within attack range, subject to cooldown
4. **Death** — if `noRespawn` is false, respawn after 7–11 seconds

## Treasure Chests

Six chests are scattered across the overworld. Walk near one to open it and receive a permanent upgrade.

| Chest | Location (tile) | Loot | Effect |
|---|---|---|---|
| Heart Container | (18, 44) | +15 Max HP | All heroes gain 15 max HP and fully heal |
| Swift Boots | (10, 33) | +18% Speed | All heroes move 18% faster |
| Whetstone & Blade Oils | (34, 38) | +3 DMG, +20 Knockback | Cody & Zack deal more damage and knock farther |
| Iron Crest Shield | (28, 21) | 20% Damage Reduction | All heroes take 20% less damage |
| Gilded Lance Tip | (41, 27) | +10 Range, +4 DMG | Justin's spear reaches farther and hits harder |
| Radiant Rosary | (46, 15) | +4 Heal, 25% Faster Pulse | Billie Jean heals more and more often |

## NPCs

After completing the shrine puzzle, five NPCs appear at Zora's Domain. Walk near them to hear their dialogue:

- **King Dorephan** — King of the Zora
- **Princess Sidon** — Princess
- **Zora Elder** — Village elder
- **Zora Guard** — Royal guard
- **Zora Child** — Aspiring young hero

Dialogue cycles every 4 seconds when standing near an NPC.

## Shrine Puzzle

The shrine is located at tile (50, 12) in the northeast of the overworld.

### Phase 1: Defense

When the leader approaches the shrine:
1. A banner reads "Defend the shrine!"
2. 6 monsters spawn around the shrine (no respawn)
3. Kill all 6 to proceed

### Phase 2: Boss Fight

1. A banner reads "A Lynel emerges!"
2. The Lynel spawns near the shrine
3. Defeat the Lynel to complete the puzzle

### Victory

1. The party is fully healed
2. A "Shrine Medal" is earned (displayed in HUD)
3. The party is teleported to Zora's Domain
4. NPCs appear with dialogue
5. A portal becomes available to enter Zora's Cavern

## World Maps

### Overworld (64×64 tiles)

- **Spawn point**: tile (14, 48) — southwest area
- **Shrine**: tile (50, 12) — northeast
- **Zora's Domain**: tile (8, 10) — northwest, surrounded by water
- **Tile types**: Grass, Flowers, Path, Water, Trees, Rocks, Shrine
- **Paths**: Carved from spawn to shrine, and spawn to Zora's Domain

### Cavern (64×64 tiles)

- **Portal/Spawn**: tile (32, 56) — south
- **Boss Room**: tile (32, 12) — north
- **Tile types**: Cavern Floor, Cavern Wall, Cavern Water, Portal
- Accessible after defeating the Lynel via a portal at Zora's Domain

## Game Complete

After defeating the Aquamentus in the cavern:

1. A shrine relic appears where the boss fell
2. Walk into the relic to collect it — the party is fully healed
3. The "Adventure Complete!" screen appears
4. Press **R** to play again (full reset)

## Game Over

If the leader (Cody) dies:
1. The screen shows "Game Over"
2. Press **R** to restart
3. The entire game resets (world, monsters, chests, stats)
