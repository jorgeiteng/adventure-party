export function createCamera() {
  return { x: 0, y: 0, w: 800, h: 600 };
}

export function updateCamera(camera, target, canvas, world) {
  camera.w = canvas.width;
  camera.h = canvas.height;
  camera.x = target.x - camera.w / 2;
  camera.y = target.y - camera.h / 2;
  const maxX = Math.max(0, world.width - camera.w);
  const maxY = Math.max(0, world.height - camera.h);
  camera.x = Math.max(0, Math.min(maxX, camera.x));
  camera.y = Math.max(0, Math.min(maxY, camera.y));
}

export function worldToScreen(camera, x, y) {
  return { x: x - camera.x, y: y - camera.y };
}
