// The pit bosses: named guards who patrol, grow suspicious, investigate a
// noise or a glimpse, and hunt the thief once they are sure. One class, one
// job: read the thief's visibility and decide what the guard does next.

import {
  GUARD, ALARM, clamp, distance, angleDifference,
} from './config.js';
import { hasLineOfSight } from './level.js';

export const GUARD_STATES = {
  CALM: 'CALM',
  SUSPICIOUS: 'SUSPICIOUS',
  INVESTIGATE: 'INVESTIGATE',
  HUNT: 'HUNT',
};

export function createPitBoss(def) {
  return {
    name: def.name,
    color: def.color,
    x: def.waypoints[0][0],
    y: def.waypoints[0][1],
    angle: def.startAngle ?? 0,
    waypoints: def.waypoints,
    waypointIndex: 1,
    state: GUARD_STATES.CALM,
    suspicion: 0,
    speed: GUARD.patrolSpeed,
    investigateX: 0,
    investigateY: 0,
    investigateTimer: 0,
    waitTimer: 0,
    seenFlash: 0,
  };
}

// Can this guard see the thief right now? Cone, range, walls and light all
// matter: a sneaking thief in shadow is nearly invisible at distance.
export function guardCanSee(guard, player, visibility, solids) {
  const dist = distance(guard.x, guard.y, player.x, player.y);
  if (dist > GUARD.sightRange) return 0;
  const toPlayer = Math.atan2(player.y - guard.y, player.x - guard.x);
  const offAngle = Math.abs(angleDifference(guard.angle, toPlayer));
  if (offAngle > GUARD.sightHalfAngle) return 0;
  if (!hasLineOfSight(guard.x, guard.y, player.x, player.y, solids)) return 0;
  const disguised = player.disguiseTimer > 0 && dist > 70;
  const disguiseFactor = disguised ? 0.15 : 1;
  const rangeFactor = dist < 80 ? 1 : 1 - ((dist - 80) / (GUARD.sightRange - 80)) * 0.55;
  return clamp(visibility, 0.08, 1) * rangeFactor * disguiseFactor;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

export function updatePitBoss(guard, dt, game) {
  const { player, solids, alarm } = game;
  const lockdown = alarm.value >= ALARM.lockdownAt;
  const speedBoost = lockdown ? 1.4 : 1;
  guard.seenFlash = Math.max(0, guard.seenFlash - dt);

  const seen = guardCanSee(guard, player, player.visibility, solids);
  if (seen > 0 && game.state === 'play') {
    const rate = GUARD.detectRate * seen * (player.sneaking ? 0.55 : 1);
    guard.suspicion = clamp(guard.suspicion + rate * dt, 0, 1);
    guard.investigateX = player.x;
    guard.investigateY = player.y;
    if (guard.suspicion >= 1 && guard.state !== GUARD_STATES.HUNT) {
      guard.state = GUARD_STATES.HUNT;
      game.onGuardSpot(guard);
    } else if (guard.suspicion > 0.35 && guard.state === GUARD_STATES.CALM) {
      guard.state = GUARD_STATES.SUSPICIOUS;
    }
    if (guard.state === GUARD_STATES.HUNT) {
      guard.investigateX = player.x;
      guard.investigateY = player.y;
    }
  } else {
    guard.suspicion = clamp(guard.suspicion - GUARD.suspicionDecay * dt, 0, 1);
    if (guard.state === GUARD_STATES.SUSPICIOUS && guard.suspicion <= 0.12) {
      guard.state = GUARD_STATES.CALM;
    }
  }

  // A noise event pulls the nearest calm guard to investigate it.
  if (game.noiseEvent && guard.state === GUARD_STATES.CALM) {
    const d = distance(guard.x, guard.y, game.noiseEvent.x, game.noiseEvent.y);
    if (d < game.noiseEvent.radius + 60) {
      guard.state = GUARD_STATES.INVESTIGATE;
      guard.investigateX = game.noiseEvent.x;
      guard.investigateY = game.noiseEvent.y;
      guard.investigateTimer = GUARD.investigateTime;
    }
  }

  switch (guard.state) {
    case GUARD_STATES.CALM: {
      const [wx, wy] = guard.waypoints[guard.waypointIndex];
      if (moveToward(guard, wx, wy, GUARD.patrolSpeed * speedBoost, dt)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.waitTimer = 0.6;
      }
      if (guard.waitTimer > 0) {
        guard.waitTimer -= dt;
        guard.angle += Math.sin(game.elapsed * 1.4 + guard.x) * 0.35 * dt;
      }
      break;
    }
    case GUARD_STATES.SUSPICIOUS: {
      // Freeze, stare at the last glimpse, then go and look.
      guard.angle += angleDifference(
        guard.angle,
        Math.atan2(guard.investigateY - guard.y, guard.investigateX - guard.x),
      ) * Math.min(1, dt * 6);
      guard.investigateTimer += dt;
      if (guard.investigateTimer > 1.4) {
        guard.investigateTimer = GUARD.investigateTime;
        guard.state = GUARD_STATES.INVESTIGATE;
      }
      break;
    }
    case GUARD_STATES.INVESTIGATE: {
      const arrived = moveToward(
        guard, guard.investigateX, guard.investigateY,
        GUARD.investigateSpeed * speedBoost, dt,
      );
      if (arrived) {
        guard.investigateTimer -= dt;
        guard.angle += dt * 2.2; // look around the spot
        if (guard.investigateTimer <= 0) {
          guard.state = GUARD_STATES.CALM;
          guard.suspicion = 0.2;
        }
      }
      break;
    }
    case GUARD_STATES.HUNT: {
      moveToward(guard, player.x, player.y, GUARD.huntSpeed * speedBoost, dt);
      if (guard.suspicion < 0.45) {
        guard.state = GUARD_STATES.INVESTIGATE;
        guard.investigateTimer = GUARD.investigateTime;
      }
      break;
    }
    default:
      break;
  }

  // Caught: a hunting guard lays a hand on the thief.
  if (
    game.state === 'play'
    && (guard.state === GUARD_STATES.HUNT || alarm.value >= ALARM.lockdownAt)
    && distance(guard.x, guard.y, player.x, player.y) < GUARD.catchRange
  ) {
    game.onCaught(guard);
  }
}
