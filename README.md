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
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Controls

- **WASD** or **arrow keys** — move the leader
- **Space** or **click** — melee strike
- **R** — restart after a party wipe
- **M** — toggle sound / mute (or click the 🔊 / 🔇 icon in HUD)

Walk to the sealed shrine in the northeast for a Phase 2 teaser. The final boss is not in this build.
