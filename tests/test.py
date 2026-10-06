#!/usr/bin/env python3
"""
Smoke tests for Adventure Party.
Run after every change:  python3 tests/test.py
Checks JS syntax, import/export consistency, file structure, and key invariants.
"""

import re, sys, os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_DIR = os.path.join(ROOT, "js")

passed = 0
failed = 0
errors = []

def ok(msg):
    global passed
    passed += 1
    print(f"  ✓ {msg}")

def fail(msg):
    global failed
    failed += 1
    errors.append(msg)
    print(f"  ✗ {msg}")

def read(path):
    with open(os.path.join(ROOT, path)) as f:
        return f.read()

def read_js(name):
    return read(f"js/{name}")

# ── File existence ──

print("\n=== File Structure ===")

required_js = [
    "main.js", "game.js", "world.js", "render.js", "monster.js",
    "hero.js", "combat.js", "chest.js", "camera.js", "input.js",
    "audio.js", "npc.js",
]
for name in required_js:
    path = os.path.join(JS_DIR, name)
    if os.path.isfile(path):
        ok(f"{name} exists")
    else:
        fail(f"{name} missing")

assert os.path.isfile(os.path.join(ROOT, "index.html")), "index.html exists"
ok("index.html exists")
assert os.path.isfile(os.path.join(ROOT, "css", "style.css")), "style.css exists"
ok("style.css exists")

# ── HTML structure ──

print("\n=== HTML Structure ===")

html = read("index.html")
for tag in ["game-root", "game", "hud", "party-hud", "banner", "wipe", "welcome", "version", "sound-btn",
            "difficulty-select", "diff-easy", "diff-medium", "diff-hard"]:
    if f'id="{tag}"' in html:
        ok(f"#{tag} element found")
    else:
        fail(f"#{tag} element missing")

if "main.js" in html:
    ok("main.js loaded")
else:
    fail("main.js not loaded")

# ── JS syntax — balanced braces ──

print("\n=== JS Syntax (brace balance) ===")

for name in required_js:
    src = read_js(name)
    opens = src.count("{") + src.count("(") + src.count("[")
    closes = src.count("}") + src.count(")") + src.count("]")
    if opens == closes:
        ok(f"{name}: braces balanced ({opens} pairs)")
    else:
        fail(f"{name}: braces mismatch — {{ {src.count('{')} }} {src.count('}')} ( {src.count('(')} ) {src.count(')')} [ {src.count('[')} ] {src.count(']')}")

# ── No stale ?v= in source imports ──
# ?v=5 cache busters in JS→JS imports are intentional for browser caching.
# Only flag ?v= in the INDEX html script tag or if version != 5.

print("\n=== Import Hygiene ===")

for name in required_js:
    src = read_js(name)
    stale = re.findall(r'from\s+["\'][^"\']*\?v=(?!5)[^"\']*["\']', src)
    if not stale:
        ok(f"{name}: no stale query strings in imports")
    else:
        fail(f"{name}: found stale imports: {stale}")

# ── Import/export consistency ──

print("\n=== Export/Import Consistency ===")

def get_exports(src):
    return set(re.findall(r'export\s+(?:function|const|let|var|class)\s+(\w+)', src))

def get_imports(src):
    imports = {}
    for m in re.finditer(r'import\s*\{([^}]+)\}\s*from\s*["\']([^"\']+)["\']', src):
        names = [n.strip() for n in m.group(1).split(",") if n.strip()]
        imports[m.group(2)] = names
    return imports

all_exports = {}
for name in required_js:
    src = read_js(name)
    exports = get_exports(src)
    all_exports[name] = exports

for name in required_js:
    src = read_js(name)
    imports = get_imports(src)
    for module, names in imports.items():
        mod_name = module.split("/")[-1].split("?")[0]
        if mod_name in all_exports:
            for imp_name in names:
                if imp_name in all_exports[mod_name]:
                    ok(f"{name} imports '{imp_name}' from {mod_name} — found")
                else:
                    fail(f"{name} imports '{imp_name}' from {mod_name} — NOT EXPORTED")
        else:
            ok(f"{name} imports from {mod_name} (external/skipped)")

# ── World constants ──

print("\n=== World Constants ===")

world_src = read_js("world.js")
for const in ["TILE = 32", "MAP_W = 64", "MAP_H = 64"]:
    if const in world_src:
        ok(f"World has {const}")
    else:
        fail(f"World missing {const}")

tile_names = ["GRASS", "FLOWERS", "PATH", "WATER", "TREE", "ROCK", "SHRINE",
              "CAVERN_FLOOR", "CAVERN_WALL", "CAVERN_WATER", "PORTAL"]
for t in tile_names:
    if f"{t}:" in world_src or f"{t} :" in world_src:
        ok(f"Tile '{t}' defined")
    else:
        fail(f"Tile '{t}' missing")

for fn in ["createWorld", "createCavernWorld", "shrineCenter", "zorasDomainCenter",
           "randomWalkable", "randomWalkableNear", "isSolid", "tileAt",
           "circleHitsSolid", "moveWithCollision"]:
    if f"export function {fn}" in world_src:
        ok(f"world.js exports {fn}")
    else:
        fail(f"world.js missing export {fn}")

# ── Monster specs ──

print("\n=== Monster Specs ===")

monster_src = read_js("monster.js")
for id in ["mossCrawler", "fanglet", "skyGnat", "biri", "tektite", "darkutch"]:
    if f'id: "{id}"' in monster_src:
        ok(f"Monster '{id}' defined")
    else:
        fail(f"Monster '{id}' missing")

for spec in ["lynelSpec", "aquamentusSpec"]:
    if f"export function {spec}" in monster_src:
        ok(f"Exported {spec}")
    else:
        fail(f"Missing export {spec}")

if "isCavern" in monster_src:
    ok("Monster spawning checks isCavern flag")
else:
    fail("Monster spawning does not check isCavern flag")

# ── Game state invariants ──

print("\n=== Game State ===")

game_src = read_js("game.js")

required_state = [
    "world", "heroes", "monsters", "chests", "npcs", "wiped",
    "shrineState", "hasMedal", "currentMap", "cavernBoss",
    "cavernBossState", "shrineRelics", "gameComplete", "puzzle",
    "nearPortal", "portalCooldown", "currentNpc", "difficulty",
]
for key in required_state:
    # Match both "key: value" and shorthand "key," (JS shorthand property syntax)
    if re.search(rf'^\s+{key}\s*[,:]', game_src, re.MULTILINE):
        ok(f"Game state has '{key}'")
    else:
        fail(f"Game state missing '{key}'")

for fn in ["createGame", "resetGame", "updateGame"]:
    if f"export function {fn}" in game_src:
        ok(f"game.js exports {fn}")
    else:
        fail(f"game.js missing export {fn}")

for fn in ["initPuzzle", "healParty", "spawnWaveMonsters", "spawnBoss",
           "switchToCavern", "switchToOverworld"]:
    if f"function {fn}" in game_src:
        ok(f"game.js has {fn}")
    else:
        fail(f"game.js missing {fn}")

# ── Puzzle system ──

print("\n=== Puzzle System ===")

for term in ["RUNE_COUNT", "RUNE_SYMBOLS", "RUNE_COLORS", "initPuzzle",
             '"showing"', '"input"', '"done"', 'p.state === "showing"',
             'p.state === "input"']:
    if term in game_src:
        ok(f"Puzzle has {term}")
    else:
        fail(f"Puzzle missing {term}")

# ── Render functions ──

print("\n=== Render Functions ===")

render_src = read_js("render.js")
for fn in ["drawWorld", "drawEntities", "drawPuzzleRunes", "drawShrineRelics",
           "setBanner", "setWipe", "setComplete", "updateHud", "drawBossHud",
           "drawNpc"]:
    if f"export function {fn}" in render_src:
        ok(f"render.js exports {fn}")
    else:
        fail(f"render.js missing export {fn}")

for id in ["mossCrawler", "fanglet", "skyGnat", "lynel", "biri", "tektite",
           "darkutch", "aquamentus", "cody", "zack", "justin", "billieJean"]:
    if f'"{id}"' in render_src or f"'{id}'" in render_src:
        ok(f"render.js handles '{id}'")
    else:
        fail(f"render.js missing handler for '{id}'")

for tile in ["CAVERN_FLOOR", "CAVERN_WATER", "CAVERN_WALL", "PORTAL"]:
    if tile in render_src:
        ok(f"render.js renders {tile}")
    else:
        fail(f"render.js missing render for {tile}")

# ── NPC system ──

print("\n=== NPC System ===")

npc_src = read_js("npc.js")
for fn in ["spawnNpcs", "updateNpcs", "getNearbyNpc"]:
    if f"export function {fn}" in npc_src:
        ok(f"npc.js exports {fn}")
    else:
        fail(f"npc.js missing export {fn}")

npc_names = ["King Dorephan", "Princess Sidon", "Zora Elder", "Zora Guard", "Zora Child"]
for name in npc_names:
    if name in npc_src:
        ok(f"NPC '{name}' defined")
    else:
        fail(f"NPC '{name}' missing")

# ── Version consistency ──

print("\n=== Version ===")

main_src = read_js("main.js")
ver_match = re.search(r'VERSION\s*=\s*"([^"]+)"', main_src)
if ver_match:
    ver = ver_match.group(1)
    ok(f"Version defined: {ver}")
else:
    fail("Version not found in main.js")

# ── Welcome screen ──

print("\n=== Welcome Screen ===")

if 'id="welcome"' in html:
    ok("Welcome screen element in HTML")
else:
    fail("Welcome screen element missing from HTML")

if "dismissWelcome" in main_src:
    ok("Welcome screen dismiss logic in main.js")
else:
    fail("Welcome screen dismiss logic missing from main.js")

if "started" in main_src:
    ok("Game start gate (started flag) exists")
else:
    fail("Game start gate (started flag) missing")

# ── Cavern boss ──

print("\n=== Cavern Boss ===")

for term in ["Aquamentus", "aquamentusSpec", "bossRoom", "cavernBossState"]:
    if term in game_src:
        ok(f"Cavern boss: {term}")
    else:
        fail(f"Cavern boss missing: {term}")

# ── Portal system ──

print("\n=== Portal System ===")

for term in ["switchToCavern", "switchToOverworld", "portalCooldown", "nearPortal"]:
    if term in game_src:
        ok(f"Portal system: {term}")
    else:
        fail(f"Portal system missing: {term}")

# ── Game complete ──

print("\n=== Game Complete ===")

if "gameComplete" in game_src:
    ok("Game complete flag exists")
else:
    fail("Game complete flag missing")

if 'id="complete"' in html:
    ok("Complete screen in HTML")
else:
    fail("Complete screen missing from HTML")

if "#complete" in read("css/style.css"):
    ok("Complete screen styled in CSS")
else:
    fail("Complete screen missing from CSS")

# ── CSS completeness ──

print("\n=== CSS ===")

css = read("css/style.css")
for sel in ["#game", "#hud", "#banner", "#wipe", "#welcome", "#version",
            "#sound-btn", "#complete", ".hp-bar", ".hp-fill", ".medal-hud",
            "#difficulty-select"]:
    if sel in css:
        ok(f"CSS has {sel}")
    else:
        fail(f"CSS missing {sel}")

# ── Summary ──

print(f"\n{'=' * 44}")
print(f"  Passed: {passed}")
print(f"  Failed: {failed}")
if errors:
    print(f"\n  Failures:")
    for e in errors:
        print(f"    - {e}")
print(f"{'=' * 44}\n")

sys.exit(1 if failed > 0 else 0)
