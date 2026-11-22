// The Meridian Casino floor plan: three rooms, their walls, cover, lamps and
// loot. Also the geometry helpers the guards and the player share: circle
// collision against walls and cover, and line of sight between two points.

import { PLAY_W, PLAY_H, TOPBAR_H, LOOT } from './config.js';

export const ROOMS = {
  casino: { x: 12, y: TOPBAR_H + 12, w: 548, h: PLAY_H - 24, label: 'THE CASINO FLOOR' },
  count: { x: 572, y: TOPBAR_H + 12, w: 392, h: 330, label: 'THE COUNT ROOM' },
  vault: { x: 572, y: TOPBAR_H + 354, w: 392, h: 392, label: 'THE VAULT CAGE' },
};

// Rectangles are {x, y, w, h} in play-area coordinates (y already includes TOPBAR_H).
export function buildCasinoLevel() {
  const walls = [
    // Outer shell.
    { x: 0, y: TOPBAR_H, w: PLAY_W, h: 12 },
    { x: 0, y: TOPBAR_H + PLAY_H - 12, w: PLAY_W, h: 12 },
    { x: 0, y: TOPBAR_H, w: 12, h: PLAY_H },
    { x: PLAY_W - 12, y: TOPBAR_H, w: 12, h: PLAY_H },
    // Partition between the casino floor and the two back rooms, with two doors.
    { x: 560, y: TOPBAR_H + 12, w: 12, h: 192 }, // above the count-room door
    { x: 560, y: TOPBAR_H + 272, w: 12, h: 228 }, // between the two doors
    { x: 560, y: TOPBAR_H + 580, w: 12, h: 162 }, // below the vault door
    // Wall between the count room and the vault cage, with one door.
    { x: 572, y: TOPBAR_H + 342, w: 128, h: 12 },
    { x: 780, y: TOPBAR_H + 342, w: 184, h: 12 },
  ];

  // Slot machines: solid cover the thief ducks behind. kind 'slot' marks the
  // three riggable ones; the rest are plain machines.
  const slots = [];
  const slotRows = [
    { y: 150, count: 6, riggable: [1] },
    { y: 262, count: 6, riggable: [4] },
    { y: 480, count: 5, riggable: [2] },
  ];
  for (const row of slotRows) {
    for (let i = 0; i < row.count; i++) {
      const x = 92 + i * 68;
      slots.push({
        x, y: row.y, w: 46, h: 28,
        kind: 'slot',
        riggable: row.riggable.includes(i),
        rigged: false,
        glow: (i * 37 + row.y) % 3,
      });
    }
  }

  // Round tables and the bar counter: more solid cover.
  const tables = [
    { x: 180, y: 392, r: 25, kind: 'table' },
    { x: 424, y: 392, r: 25, kind: 'table' },
    { x: 300, y: 622, r: 25, kind: 'table' },
    { x: 150, y: 664, r: 22, kind: 'table' },
    { x: 472, y: 664, r: 22, kind: 'table' },
  ];
  const bar = { x: 56, y: 700, w: 210, h: 26, kind: 'bar' };

  // Counting tables and the safe in the count room.
  const counters = [
    { x: 640, y: 128, w: 130, h: 34, kind: 'counter' },
    { x: 640, y: 252, w: 130, h: 34, kind: 'counter' },
  ];
  const safe = { x: 872, y: 96, w: 62, h: 54, kind: 'safe' };

  // The vault cage: brass bars around the Golden Chip pedestal, open on its
  // left side so the thief can slip in from the vault door.
  const cageBars = [];
  for (let i = 0; i < 7; i++) {
    cageBars.push({ x: 812 + i * 18, y: 512, w: 5, h: 26, kind: 'cagebar' });
    cageBars.push({ x: 812 + i * 18, y: 724, w: 5, h: 26, kind: 'cagebar' });
  }
  for (let i = 0; i < 6; i++) {
    cageBars.push({ x: 932, y: 540 + i * 30, w: 26, h: 5, kind: 'cagebar' });
  }
  const pedestal = { x: 862, y: 612, w: 44, h: 44, kind: 'pedestal' };

  // Warm lamp pools: standing in one makes the thief easier to spot.
  const lamps = [
    { x: 200, y: 200, r: 92 }, { x: 420, y: 200, r: 92 },
    { x: 200, y: 560, r: 92 }, { x: 420, y: 560, r: 92 },
    { x: 700, y: 200, r: 88 }, { x: 880, y: 300, r: 88 },
    { x: 700, y: 640, r: 88 }, { x: 880, y: 470, r: 80 },
  ];

  // Chip stacks the thief can pocket, and the Golden Chip on its pedestal.
  const loot = [
    { id: 'chips-a', kind: 'chips', x: 108, y: 208, value: LOOT.chipStack, taken: false },
    { id: 'chips-b', kind: 'chips', x: 486, y: 208, value: LOOT.chipStack, taken: false },
    { id: 'chips-c', kind: 'chips', x: 238, y: 566, value: LOOT.chipStack, taken: false },
    { id: 'chips-d', kind: 'chips', x: 706, y: 190, value: LOOT.chipStack, taken: false },
    { id: 'chips-e', kind: 'chips', x: 896, y: 306, value: LOOT.chipStack, taken: false },
    { id: 'chips-f', kind: 'chips', x: 640, y: 700, value: LOOT.chipStack, taken: false },
    { id: 'golden', kind: 'golden', x: 884, y: 634, value: LOOT.goldenChip, taken: false },
  ];

  // The dealer disguise hangs on the bar: two charges of walking through a
  // cone unnoticed.
  const disguise = { x: 288, y: 690, taken: false, charges: 2 };

  // The service elevator, bottom-left: the way out once the Golden Chip is held.
  const elevator = { x: 16, y: 700, w: 84, h: 86 };

  // The way in: the service door at the top-left of the casino floor.
  const entrance = { x: 58, y: 92 };

  return {
    walls, slots, tables, bar, counters, safe, cageBars, pedestal,
    lamps, loot, disguise, elevator, entrance,
  };
}

// Every solid rectangle: walls plus all cover. Guards and the player collide
// with the same list, so a cone never claims a line through a slot machine.
export function solidRects(level) {
  return [
    ...level.walls,
    ...level.slots,
    ...level.tables.map((t) => ({ x: t.x - t.r, y: t.y - t.r, w: t.r * 2, h: t.r * 2 })),
    level.bar,
    ...level.counters,
    level.safe,
    level.pedestal,
    ...level.cageBars,
  ];
}

function circleHitsRect(cx, cy, r, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < r * r;
}

export function circleHitsSolid(cx, cy, r, solids) {
  for (const rect of solids) {
    if (circleHitsRect(cx, cy, r, rect)) return rect;
  }
  return null;
}

// Slide a circle along one axis at a time so the thief glides along walls.
export function moveCircleWithCollision(x, y, dx, dy, r, solids) {
  let nx = x + dx;
  if (!circleHitsSolid(nx, y, r, solids)) {
    x = nx;
  } else if (!circleHitsSolid(x + dx * 0.4, y, r, solids)) {
    x += dx * 0.4;
  }
  let ny = y + dy;
  if (!circleHitsSolid(x, ny, r, solids)) {
    y = ny;
  } else if (!circleHitsSolid(x, y + dy * 0.4, r, solids)) {
    y += dy * 0.4;
  }
  return { x, y };
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentHitsRect(ax, ay, bx, by, rect) {
  if (ax >= rect.x && ax <= rect.x + rect.w && ay >= rect.y && ay <= rect.y + rect.h) return true;
  if (bx >= rect.x && bx <= rect.x + rect.w && by >= rect.y && by <= rect.y + rect.h) return true;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  return edges.some(([cx, cy, dx, dy]) => segmentsCross(ax, ay, bx, by, cx, cy, dx, dy));
}

// True when nothing solid stands between the two points.
export function hasLineOfSight(ax, ay, bx, by, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(ax, ay, bx, by, rect)) return false;
  }
  return true;
}

// Which room contains a point, for clipping vision cones to their own room.
export function roomAt(x, y) {
  for (const [name, room] of Object.entries(ROOMS)) {
    if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) return name;
  }
  return 'casino';
}
