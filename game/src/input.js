// Keyboard and mouse input for the casino job: held keys, edge-triggered
// presses, and the mouse position in canvas coordinates for aiming a throw.

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

  const KEY_ALIASES = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    Space: 'sprint',
    KeyE: 'interact',
    KeyH: 'notes',
    KeyM: 'mute',
    KeyR: 'restart',
    Escape: 'pause',
    Enter: 'confirm',
  };

  function onKeyDown(event) {
    const action = KEY_ALIASES[event.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'sprint'].includes(action)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(action);
    held.add(action);
  }

  function onKeyUp(event) {
    const action = KEY_ALIASES[event.code];
    if (action) held.delete(action);
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  }

  function onMouseDown(event) {
    onMouseMove(event);
    mouse.clicked = true;
    mouse.clickX = mouse.x;
    mouse.clickY = mouse.y;
  }

  function onBlur() {
    held.clear();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    isHeld(action) {
      return held.has(action);
    },
    // True once per physical press; consumed at the end of each frame.
    wasPressed(action) {
      return pressed.has(action);
    },
    mouse,
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
  };
}
