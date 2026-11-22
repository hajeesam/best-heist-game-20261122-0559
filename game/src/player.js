// Rook, the thief: movement with sneak and sprint, the dealer's disguise,
// throwing a chip to pull a guard away, and picking things up. One class,
// one job: what the thief does when the player acts.

import {
  PLAYER, clamp, distance,
} from './config.js';
import { moveCircleWithCollision } from './level.js';

export function createThief(startX, startY) {
  return {
    x: startX,
    y: startY,
    angle: -Math.PI / 2,
    radius: PLAYER.radius,
    sneaking: false,
    sprinting: false,
    moving: false,
    visibility: 0.35,
    noise: 0,
    chipsToThrow: PLAYER.throwChips,
    disguiseCharges: 0,
    disguiseTimer: 0,
    lootTaken: 0,
    lootValue: 0,
    hasGoldenChip: false,
    // A chip in flight: {x, y, tx, ty, t} until it lands and pings.
    thrownChip: null,
  };
}

export function updateThief(player, dt, game) {
  const input = game.input;
  const level = game.level;

  const moveX = (input.isHeld('right') ? 1 : 0) - (input.isHeld('left') ? 1 : 0);
  const moveY = (input.isHeld('down') ? 1 : 0) - (input.isHeld('up') ? 1 : 0);
  player.sneaking = input.isHeld('sneak');
  player.sprinting = input.isHeld('sprint') && !player.sneaking && (moveX !== 0 || moveY !== 0);
  player.moving = moveX !== 0 || moveY !== 0;

  const speed = player.sneaking
    ? PLAYER.sneakSpeed
    : player.sprinting
      ? PLAYER.sprintSpeed
      : PLAYER.walkSpeed;
  if (player.moving) {
    const len = Math.hypot(moveX, moveY);
    const dx = (moveX / len) * speed * dt;
    const dy = (moveY / len) * speed * dt;
    const moved = moveCircleWithCollision(
      player.x, player.y, dx, dy, player.radius, game.solids,
    );
    player.x = moved.x;
    player.y = moved.y;
    player.angle = Math.atan2(dy, dx);
  }

  // Visibility: light, motion and posture all count.
  player.visibility = computeVisibility(player, game);
  player.noise = computeNoise(player, game);
  if (player.disguiseTimer > 0) player.disguiseTimer -= dt;

  // A thrown chip arcs to its target, then pings and pulls a guard over.
  if (player.thrownChip) {
    const chip = player.thrownChip;
    chip.t += dt / 0.4;
    if (chip.t >= 1) {
      chip.x = chip.tx;
      chip.y = chip.ty;
      game.raiseNoise(chip.x, chip.y, 130, 'chip');
      game.audio.playChipPing();
      player.thrownChip = null;
    } else {
      chip.x = chip.x + (chip.tx - chip.x) * Math.min(1, dt * 6);
      chip.y = chip.y + (chip.ty - chip.y) * Math.min(1, dt * 6);
    }
  }

  // Throw a chip toward the mouse (left click), if any are left.
  if (input.mouse.clicked && player.chipsToThrow > 0 && game.state === 'play') {
    const tx = clamp(input.mouse.clickX, 12, 964);
    const ty = clamp(input.mouse.clickY, 46, 788);
    if (distance(player.x, player.y, tx, ty) > 30) {
      player.chipsToThrow -= 1;
      player.thrownChip = { x: player.x, y: player.y, tx, ty, t: 0 };
      game.audio.playThrow();
    }
  }

  // Interact: loot, disguise, slot rig, and the elevator.
  if (input.wasPressed('interact')) game.tryInteract();
}

export function computeVisibility(player, game) {
  let visibility = 0.34;
  for (const lamp of game.level.lamps) {
    if (distance(player.x, player.y, lamp.x, lamp.y) < lamp.r) visibility += 0.34;
  }
  if (game.chandelierBeamOnPlayer) visibility += 0.42;
  if (player.sprinting) visibility += 0.22;
  if (player.sneaking) visibility -= 0.28;
  if (!player.moving) visibility -= 0.06;
  return clamp(visibility, 0.05, 1);
}

export function computeNoise(player, game) {
  if (player.sprinting && player.moving) return 0.85;
  if (player.moving && !player.sneaking) return 0.35;
  if (game.noiseEvent) return 0.6;
  return 0.05;
}
