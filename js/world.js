export const TILE = 32;
export const MAP_W = 64;
export const MAP_H = 64;

export const Tiles = {
  GRASS: 0,
  FLOWERS: 1,
  PATH: 2,
  WATER: 3,
  TREE: 4,
  ROCK: 5,
  SHRINE: 6,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise2(randGrid, x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const n00 = randGrid(xi, yi);
  const n10 = randGrid(xi + 1, yi);
  const n01 = randGrid(xi, yi + 1);
  const n11 = randGrid(xi + 1, yi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x1 = n00 + (n10 - n00) * u;
  const x2 = n01 + (n11 - n01) * u;
  return x1 + (x2 - x1) * v;
}

export function isSolid(tile) {
  return tile === Tiles.WATER || tile === Tiles.TREE || tile === Tiles.ROCK;
}

export function createWorld(seed = 20260825) {
  const rand = mulberry32(seed);
  const hash = new Map();
  const randGrid = (x, y) => {
    const key = `${x},${y}`;
    if (!hash.has(key)) hash.set(key, rand());
    return hash.get(key);
  };

  const tiles = new Uint8Array(MAP_W * MAP_H);
  const spawn = { tx: 14, ty: 48 };
  const shrine = { tx: 50, ty: 12 };

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const n = noise2(randGrid, x / 9, y / 9);
      const n2 = noise2(randGrid, x / 5 + 20, y / 5 + 8);
      const eastTravel = x >= 22;
      let tile = Tiles.GRASS;
      if (!eastTravel && n > 0.66 && n2 > 0.5) tile = Tiles.WATER;
      else if (n2 > 0.78) tile = Tiles.FLOWERS;
      tiles[y * MAP_W + x] = tile;
    }
  }

  function carveDisk(cx, cy, radius, tile) {
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) {
          tiles[y * MAP_W + x] = tile;
        }
      }
    }
  }

  function carvePath(x0, y0, x1, y1) {
    let x = x0;
    let y = y0;
      while (x !== x1 || y !== y1) {
      carveDisk(x, y, 1.7, Tiles.PATH);
      if (x !== x1 && (y === y1 || rand() > 0.45)) x += Math.sign(x1 - x);
      else y += Math.sign(y1 - y);
    }
    carveDisk(x1, y1, 2.2, Tiles.PATH);
  }

  carveDisk(spawn.tx, spawn.ty, 5, Tiles.GRASS);
  carvePath(spawn.tx, spawn.ty, shrine.tx, shrine.ty);
  carveDisk(shrine.tx, shrine.ty, 5, Tiles.GRASS);

  for (let i = 0; i < 90; i++) {
    const cx = 3 + Math.floor(rand() * (MAP_W - 6));
    const cy = 3 + Math.floor(rand() * (MAP_H - 6));
    if (Math.hypot(cx - spawn.tx, cy - spawn.ty) < 7) continue;
    if (Math.hypot(cx - shrine.tx, cy - shrine.ty) < 6) continue;
    const size = 1 + Math.floor(rand() * 3);
    for (let n = 0; n < size; n++) {
      const x = cx + Math.floor(rand() * 3) - 1;
      const y = cy + Math.floor(rand() * 3) - 1;
      if (x < 1 || y < 1 || x >= MAP_W - 1 || y >= MAP_H - 1) continue;
      const idx = y * MAP_W + x;
      if (tiles[idx] === Tiles.PATH || tiles[idx] === Tiles.WATER) continue;
      tiles[idx] = Tiles.TREE;
    }
  }

  for (let i = 0; i < 40; i++) {
    const x = 2 + Math.floor(rand() * (MAP_W - 4));
    const y = 2 + Math.floor(rand() * (MAP_H - 4));
    const idx = y * MAP_W + x;
    if (tiles[idx] === Tiles.GRASS || tiles[idx] === Tiles.FLOWERS) {
      if (Math.hypot(x - spawn.tx, y - spawn.ty) > 5) tiles[idx] = Tiles.ROCK;
    }
  }

  tiles[shrine.ty * MAP_W + shrine.tx] = Tiles.SHRINE;
  carvePath(spawn.tx, spawn.ty, shrine.tx, shrine.ty);
  tiles[shrine.ty * MAP_W + shrine.tx] = Tiles.SHRINE;

  const world = {
    tiles,
    spawn,
    shrine,
    width: MAP_W * TILE,
    height: MAP_H * TILE,
    rand,
  };

  return world;
}

export function tileAt(world, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return Tiles.ROCK;
  return world.tiles[ty * MAP_W + tx];
}

export function tileAtWorld(world, x, y) {
  return tileAt(world, Math.floor(x / TILE), Math.floor(y / TILE));
}

export function circleHitsSolid(world, x, y, radius) {
  const minTx = Math.floor((x - radius) / TILE);
  const maxTx = Math.floor((x + radius) / TILE);
  const minTy = Math.floor((y - radius) / TILE);
  const maxTy = Math.floor((y + radius) / TILE);
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (!isSolid(tileAt(world, tx, ty))) continue;
      const left = tx * TILE;
      const top = ty * TILE;
      const nearestX = Math.max(left, Math.min(x, left + TILE));
      const nearestY = Math.max(top, Math.min(y, top + TILE));
      const dx = x - nearestX;
      const dy = y - nearestY;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
  }
  return false;
}

export function moveWithCollision(world, entity, dx, dy) {
  const nx = entity.x + dx;
  if (!circleHitsSolid(world, nx, entity.y, entity.r)) entity.x = nx;
  const ny = entity.y + dy;
  if (!circleHitsSolid(world, entity.x, ny, entity.r)) entity.y = ny;
  entity.x = Math.max(entity.r, Math.min(world.width - entity.r, entity.x));
  entity.y = Math.max(entity.r, Math.min(world.height - entity.r, entity.y));
}

export function randomWalkable(world, minDistFrom, minDist = 80) {
  for (let i = 0; i < 80; i++) {
    const x = TILE * 2 + world.rand() * (world.width - TILE * 4);
    const y = TILE * 2 + world.rand() * (world.height - TILE * 4);
    if (circleHitsSolid(world, x, y, 10)) continue;
    if (minDistFrom && Math.hypot(x - minDistFrom.x, y - minDistFrom.y) < minDist) continue;
    return { x, y };
  }
  return {
    x: world.spawn.tx * TILE + TILE / 2,
    y: world.spawn.ty * TILE + TILE / 2,
  };
}

export function randomWalkableNear(world, center, maxDist) {
  for (let i = 0; i < 80; i++) {
    const angle = world.rand() * Math.PI * 2;
    const dist = world.rand() * maxDist;
    const x = center.x + Math.cos(angle) * dist;
    const y = center.y + Math.sin(angle) * dist;
    if (circleHitsSolid(world, x, y, 10)) continue;
    return { x, y };
  }
  return { x: center.x, y: center.y };
}

export function shrineCenter(world) {
  return {
    x: world.shrine.tx * TILE + TILE / 2,
    y: world.shrine.ty * TILE + TILE / 2,
  };
}
