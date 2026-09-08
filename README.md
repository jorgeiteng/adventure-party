# Adventure Party

A Zelda-inspired overworld in the browser: you lead one hero while three companions follow and auto-fight wandering monsters. Original names and art only — no Nintendo assets.

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
