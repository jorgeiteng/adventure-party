import { sound } from "./audio.js";
import { updateSoundButton } from "./render.js";

export function createInput(canvas) {
  const keys = new Set();
  let attackQueued = false;
  const pointer = { x: 0, y: 0 };

  const soundBtn = document.getElementById("sound-btn");
  if (soundBtn) {
    updateSoundButton(sound.isMuted());
    soundBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sound.unlock();
      sound.toggleMute();
      updateSoundButton(sound.isMuted());
    });
  }

  function onKeyDown(event) {
    sound.unlock();
    keys.add(event.code);
    if (event.code === "Space" || event.code.startsWith("Arrow")) {
      event.preventDefault();
    }
    if (event.code === "Space") attackQueued = true;
    if (event.code === "KeyM") {
      sound.toggleMute();
      updateSoundButton(sound.isMuted());
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onPointer(event) {
    sound.unlock();
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    pointer.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  }

  function onClick(event) {
    sound.unlock();
    onPointer(event);
    attackQueued = true;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("pointermove", onPointer);
  canvas.addEventListener("click", onClick);

  return {
    keys,
    pointer,
    axis() {
      let x = 0;
      let y = 0;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
      if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
      const len = Math.hypot(x, y);
      if (len > 0) {
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    consumeAttack() {
      const queued = attackQueued;
      attackQueued = false;
      return queued;
    },
    wantsRestart() {
      return keys.has("KeyR");
    },
  };
}

