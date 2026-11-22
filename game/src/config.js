// HIGH ROLLER: The Meridian Casino Job — tuning constants and palette.
// One job: every number the rest of the game reads, so balance lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// Layout: a top bar, a right-hand intel panel, and the casino floor between them.
export const TOPBAR_H = 46;
export const PANEL_X = 976;
export const PLAY_W = PANEL_X;
export const PLAY_H = CANVAS_H - TOPBAR_H;

// Palette: dark blue-charcoal floor, warm amber lamp light, teal CCTV.
export const PALETTE = {
  floor: '#171d29',
  floorAlt: '#1b2231',
  carpet: '#232c40',
  carpetLine: '#2b364e',
  wall: '#0c1017',
  wallTrim: '#c9a227',
  gold: '#e8b93c',
  goldDim: '#8a6d1f',
  amber: '#f5a623',
  amberCone: 'rgba(245, 166, 35, 0.30)',
  teal: '#35c4b5',
  tealCone: 'rgba(53, 196, 181, 0.28)',
  chandelier: 'rgba(232, 185, 60, 0.20)',
  lampPool: 'rgba(245, 190, 90, 0.13)',
  green: '#3ddc78',
  red: '#ff4d4d',
  ink: '#e8ecf3',
  inkDim: '#9aa5b8',
  panel: '#10151f',
  panelEdge: '#2a3347',
  chipRed: '#c1272d',
  chipBlue: '#2f6fb2',
};

export const ALARM_STAGES = [
  { max: 30, name: 'QUIET', color: PALETTE.green },
  { max: 70, name: 'SUSPICIOUS', color: PALETTE.amber },
  { max: 100, name: 'LOCKDOWN', color: PALETTE.red },
];

export function alarmStage(alarm) {
  for (const stage of ALARM_STAGES) {
    if (alarm < stage.max) return stage;
  }
  return ALARM_STAGES[ALARM_STAGES.length - 1];
}

// Player movement (pixels per second).
export const PLAYER = {
  radius: 13,
  walkSpeed: 132,
  sneakSpeed: 72,
  sprintSpeed: 212,
  sprintNoiseRadius: 96,
  throwChips: 3,
  throwRange: 320,
  interactRange: 46,
};

// Guard senses.
export const GUARD = {
  radius: 13,
  patrolSpeed: 56,
  huntSpeed: 152,
  investigateSpeed: 88,
  sightRange: 240,
  sightHalfAngle: 0.58, // ~33 degrees each side
  catchRange: 25,
  detectRate: 0.62, // suspicion per second at full visibility, close range
  suspicionDecay: 0.28,
  investigateTime: 5,
};

// CCTV cameras.
export const CAMERA = {
  sightRange: 265,
  sightHalfAngle: 0.52,
  detectRate: 0.85,
  sweepSpeed: 0.45,
};

// The grand chandelier: a huge cone that sweeps the whole casino floor.
export const CHANDELIER = {
  x: 300,
  y: 330,
  range: 350,
  halfAngle: 0.24,
  sweepSeconds: 26,
};

// Alarm economy.
export const ALARM = {
  onGuardSpot: 34,
  onCameraSpot: 30,
  seenRisePerSecond: 13,
  decayPerSecond: 2.6,
  lockdownAt: 70,
};

// Loot values in dollars.
export const LOOT = {
  chipStack: 200,
  goldenChip: 5000,
  ghostBonus: 1000,
};

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Smallest signed difference between two angles, in (-PI, PI].
export function angleDifference(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

export function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function formatMoney(dollars) {
  return '$' + dollars.toLocaleString('en-US');
}
