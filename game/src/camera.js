// The eyes that never blink: CCTV cameras with sweeping teal cones, and the
// grand chandelier whose huge warm spotlight slowly sweeps the casino floor.
// Both expose the thief; only the cameras raise the alarm by themselves.

import {
  CAMERA, CHANDELIER, clamp, distance, angleDifference,
} from './config.js';
import { hasLineOfSight } from './level.js';

export function createCctvCamera(def) {
  return {
    id: def.id,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweepRange: def.sweepRange,
    phase: def.phase ?? 0,
    angle: def.baseAngle,
    alert: 0, // 0..1: how sure the camera is that it sees the thief
    spotted: false,
  };
}

export function updateCctvCamera(camera, dt, game) {
  const lockdown = game.alarm.value >= 70;
  const speed = CAMERA.sweepSpeed * (lockdown ? 1.5 : 1);
  camera.angle = camera.baseAngle
    + Math.sin(game.elapsed * speed + camera.phase) * camera.sweepRange;
  if (game.state !== 'play') return;

  const { player, solids } = game;
  const dist = distance(camera.x, camera.y, player.x, player.y);
  let seen = 0;
  if (dist < CAMERA.sightRange) {
    const toPlayer = Math.atan2(player.y - camera.y, player.x - camera.x);
    if (Math.abs(angleDifference(camera.angle, toPlayer)) < CAMERA.sightHalfAngle
      && hasLineOfSight(camera.x, camera.y, player.x, player.y, solids)) {
      const disguised = player.disguiseTimer > 0 && dist > 70;
      const rangeFactor = dist < 90 ? 1 : 1 - ((dist - 90) / (CAMERA.sightRange - 90)) * 0.5;
      seen = clamp(player.visibility, 0.08, 1) * rangeFactor * (disguised ? 0.15 : 1);
    }
  }
  camera.alert = clamp(camera.alert + (seen > 0 ? CAMERA.detectRate * seen * dt : -0.4 * dt), 0, 1);
  if (camera.alert >= 1 && !camera.spotted) {
    camera.spotted = true;
    game.onCameraSpot(camera);
  } else if (camera.alert < 0.4) {
    camera.spotted = false;
  }
}

export function createChandelier(def) {
  return {
    x: def.x,
    y: def.y,
    range: def.range,
    halfAngle: def.halfAngle,
    sweepSeconds: def.sweepSeconds,
    angle: def.angle ?? 0,
  };
}

// The chandelier angle at a given moment: one slow full turn.
export function chandelierAngleAt(chandelier, elapsed) {
  return ((elapsed / chandelier.sweepSeconds) * Math.PI * 2) % (Math.PI * 2);
}

export function updateChandelier(chandelier, elapsed) {
  chandelier.angle = chandelierAngleAt(chandelier, elapsed);
}

// Is the thief standing in the chandelier's beam right now?
export function thiefInChandelierBeam(chandelier, player) {
  const dist = distance(chandelier.x, chandelier.y, player.x, player.y);
  if (dist > chandelier.range) return false;
  const toPlayer = Math.atan2(player.y - chandelier.y, player.x - chandelier.x);
  return Math.abs(angleDifference(chandelier.angle, toPlayer)) < chandelier.halfAngle;
}
