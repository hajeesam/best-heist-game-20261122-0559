// Everything the player sees: the casino floor, vision cones, the thief,
// the HUD top bar and the right-hand intel panel, plus the title, pause,
// caught and win overlays. One file, one job: draw the current game state.

import {
  CANVAS_W, CANVAS_H, TOPBAR_H, PANEL_X, PALETTE,
  alarmStage, formatMoney, formatTime, clamp,
} from './config.js';
import { ROOMS } from './level.js';
import { GUARD_STATES } from './guard.js';

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function text(ctx, str, x, y, size, color, weight = 600, align = 'left') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, fraction, fill, bg = '#232b3a') {
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, Math.max(0, w * clamp(fraction, 0, 1)), h, 3);
  ctx.fill();
}

export function renderGame(ctx, game) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawFloor(ctx, game);
  drawLampPools(ctx, game);
  drawChandelierBeam(ctx, game);
  drawCover(ctx, game);
  drawWalls(ctx, game);
  drawLoot(ctx, game);
  drawCameraCones(ctx, game);
  drawGuardCones(ctx, game);
  drawCameras(ctx, game);
  drawGuards(ctx, game);
  drawThief(ctx, game);
  drawNoiseRings(ctx, game);
  drawTopBar(ctx, game);
  drawIntelPanel(ctx, game);
  if (game.showNotes) drawFieldNotes(ctx, game);
  if (game.state === 'title') drawTitleScreen(ctx, game);
  if (game.state === 'paused') drawPausedScreen(ctx, game);
  if (game.state === 'caught') drawCaughtScreen(ctx, game);
  if (game.state === 'win') drawWinScreen(ctx, game);
  if (game.shotCallouts) drawShotCallouts(ctx, game);
}

function drawFloor(ctx, game) {
  const { level } = game;
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, TOPBAR_H, PANEL_X, CANVAS_H - TOPBAR_H);
  // Checker carpet: dark squares so the floor reads as casino carpet.
  ctx.fillStyle = PALETTE.carpet;
  const size = 46;
  for (let y = TOPBAR_H; y < CANVAS_H; y += size) {
    for (let x = 0; x < PANEL_X; x += size) {
      if (((x / size) + (y / size)) % 2 === 0) ctx.fillRect(x, y, size, size);
    }
  }
  // Room labels, stencilled on the carpet.
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (const room of Object.values(ROOMS)) {
    text(ctx, room.label, room.x + room.w / 2, room.y + 26, 13, PALETTE.inkDim, 700, 'center');
  }
  ctx.restore();
  // Gold trim around the vault cage.
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.strokeRect(800, 500, 152, 262);
  text(ctx, 'VAULT CAGE', 876, 496, 11, PALETTE.gold, 700, 'center');
  void level;
}

function drawLampPools(ctx, game) {
  for (const lamp of game.level.lamps) {
    const gradient = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
    gradient.addColorStop(0, PALETTE.lampPool);
    gradient.addColorStop(1, 'rgba(245, 190, 90, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
    ctx.fill();
    // The lamp itself: a small warm dot on a stand.
    ctx.fillStyle = '#f7c95c';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawChandelierBeam(ctx, game) {
  const ch = game.chandelier;
  ctx.save();
  const room = ROOMS.casino;
  ctx.beginPath();
  ctx.rect(room.x, room.y, room.w, room.h);
  ctx.clip();
  const gradient = ctx.createRadialGradient(ch.x, ch.y, 10, ch.x, ch.y, ch.range);
  gradient.addColorStop(0, 'rgba(232, 185, 60, 0.34)');
  gradient.addColorStop(1, 'rgba(232, 185, 60, 0.05)');
  ctx.beginPath();
  ctx.moveTo(ch.x, ch.y);
  ctx.arc(ch.x, ch.y, ch.range, ch.angle - ch.halfAngle, ch.angle + ch.halfAngle);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
  // The chandelier: a gold ring with hanging crystals.
  ctx.fillStyle = '#3a2f10';
  ctx.beginPath();
  ctx.arc(ch.x, ch.y, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(ch.x, ch.y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(ch.x + Math.cos(a) * 14, ch.y + Math.sin(a) * 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'CHANDELIER', ch.x, ch.y + 38, 10, PALETTE.gold, 700, 'center');
}

function drawLoot(ctx, game) {
  for (const item of game.level.loot) {
    if (item.taken) continue;
    if (item.kind === 'golden') {
      const pulse = 1 + Math.sin(game.elapsed * 3) * 0.12;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#8a6d1f';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      text(ctx, 'GOLDEN CHIP', item.x, item.y - 22, 11, PALETTE.gold, 800, 'center');
    } else {
      ctx.fillStyle = PALETTE.chipRed;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f2f2f2';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 3, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, '$200', item.x, item.y - 15, 10, '#ffb3b3', 700, 'center');
    }
  }
  const disguise = game.level.disguise;
  if (!disguise.taken) {
    ctx.fillStyle = '#7a5fd0';
    roundRect(ctx, disguise.x - 12, disguise.y - 9, 24, 18, 4);
    ctx.fill();
    ctx.strokeStyle = '#c9b8ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, 'DEALER JACKET', disguise.x, disguise.y - 14, 10, '#c9b8ff', 700, 'center');
  }
}

function drawCover(ctx, game) {
  const { level } = game;
  for (const slot of level.slots) {
    const glowColors = ['#ff5d73', '#35c4b5', '#f5a623'];
    ctx.fillStyle = slot.rigged ? '#6b5312' : '#252e42';
    roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 5);
    ctx.fill();
    ctx.strokeStyle = slot.rigged ? PALETTE.gold : '#3a4763';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = slot.rigged ? PALETTE.gold : glowColors[slot.glow];
    ctx.fillRect(slot.x + 6, slot.y + 6, slot.w - 12, 9);
    ctx.fillStyle = '#dfe6f2';
    ctx.fillRect(slot.x + 10, slot.y + 18, slot.w - 20, 3);
    if (slot.riggable && !slot.rigged) {
      text(ctx, '!', slot.x + slot.w - 4, slot.y - 3, 12, PALETTE.gold, 800, 'center');
    }
    if (slot.rigged) {
      text(ctx, 'RIGGED', slot.x + slot.w / 2, slot.y - 4, 9, PALETTE.gold, 800, 'center');
    }
  }
  for (const table of level.tables) {
    ctx.fillStyle = '#1e4d2b';
    ctx.beginPath();
    ctx.arc(table.x, table.y, table.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldDim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f2f2f2';
    ctx.font = `700 10px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('21', table.x, table.y + 4);
  }
  const bar = level.bar;
  ctx.fillStyle = '#4a2f1d';
  roundRect(ctx, bar.x, bar.y, bar.w, bar.h, 6);
  ctx.fill();
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'BAR', bar.x + bar.w / 2, bar.y + 17, 11, '#e8c98a', 700, 'center');
  for (const counter of level.counters) {
    ctx.fillStyle = '#2a2118';
    roundRect(ctx, counter.x, counter.y, counter.w, counter.h, 4);
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldDim;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, 'COUNTING TABLE', counter.x + counter.w / 2, counter.y + 21, 10, '#e8c98a', 700, 'center');
  }
  const safe = level.safe;
  ctx.fillStyle = '#39415a';
  roundRect(ctx, safe.x, safe.y, safe.w, safe.h, 5);
  ctx.fill();
  ctx.strokeStyle = '#7d8aa5';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'SAFE', safe.x + safe.w / 2, safe.y + 31, 11, '#c7d0e0', 700, 'center');
  for (const barPiece of level.cageBars) {
    ctx.fillStyle = PALETTE.goldDim;
    ctx.fillRect(barPiece.x, barPiece.y, barPiece.w, barPiece.h);
  }
  const pedestal = level.pedestal;
  ctx.fillStyle = '#2c2415';
  roundRect(ctx, pedestal.x, pedestal.y, pedestal.w, pedestal.h, 4);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  // The service elevator: green doors, open once the Golden Chip is held.
  const el = level.elevator;
  const open = game.player.hasGoldenChip;
  ctx.fillStyle = open ? '#0e3d24' : '#123524';
  roundRect(ctx, el.x, el.y, el.w, el.h, 6);
  ctx.fill();
  ctx.strokeStyle = open ? PALETTE.green : '#2c7a4b';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = open ? PALETTE.green : '#5fae7d';
  ctx.fillRect(el.x + el.w / 2 - 2, el.y + 8, 4, el.h - 16);
  text(ctx, open ? 'EXIT OPEN' : 'SERVICE ELEVATOR', el.x + el.w / 2, el.y + el.h - 10, 9, open ? PALETTE.green : '#8fceA6', 800, 'center');
  if (!open) text(ctx, 'LOCKED', el.x + el.w / 2, el.y + 18, 11, '#8fceA6', 800, 'center');
}

function drawWalls(ctx, game) {
  ctx.fillStyle = PALETTE.wall;
  for (const wall of game.level.walls) {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  }
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 1;
  for (const wall of game.level.walls) {
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }
  // Door gaps get gold floor markers so routes read at a glance.
  ctx.fillStyle = 'rgba(201, 162, 39, 0.5)';
  ctx.fillRect(560, TOPBAR_H + 250, 12, 22);
  ctx.fillRect(560, TOPBAR_H + 580, 12, 22);
  ctx.fillRect(700, TOPBAR_H + 342, 80, 12);
}

function drawCameraCones(ctx, game) {
  for (const camera of game.cameras) {
    ctx.save();
    const room = ROOMS[roomNameFor(camera.x, camera.y)];
    ctx.beginPath();
    ctx.rect(room.x, room.y, room.w, room.h);
    ctx.clip();
    drawCone(ctx, camera.x, camera.y, camera.angle, 0.52, 265, PALETTE.tealCone);
    ctx.restore();
  }
}

function roomNameFor(x, y) {
  for (const [name, room] of Object.entries(ROOMS)) {
    if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) return name;
  }
  return 'casino';
}

function drawGuardCones(ctx, game) {
  for (const guard of game.guards) {
    ctx.save();
    const room = ROOMS[roomNameFor(guard.x, guard.y)];
    ctx.beginPath();
    ctx.rect(room.x, room.y, room.w, room.h);
    ctx.clip();
    const alpha = guard.state === GUARD_STATES.HUNT ? 0.42 : 0.30;
    drawCone(ctx, guard.x, guard.y, guard.angle, 0.58, 240,
      `rgba(245, 166, 35, ${alpha})`);
    ctx.restore();
  }
}

function drawCameras(ctx, game) {
  for (const camera of game.cameras) {
    ctx.fillStyle = '#0c1017';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = camera.alert > 0.4 ? PALETTE.red : PALETTE.teal;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = camera.alert > 0.4 ? PALETTE.red : PALETTE.teal;
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, camera.id, camera.x, camera.y - 15, 10, PALETTE.teal, 700, 'center');
    if (camera.alert > 0.4) {
      text(ctx, '!', camera.x, camera.y - 26, 14, PALETTE.red, 800, 'center');
    }
  }
}

function drawGuards(ctx, game) {
  for (const guard of game.guards) {
    const stateColor = {
      [GUARD_STATES.CALM]: '#9aa5b8',
      [GUARD_STATES.SUSPICIOUS]: PALETTE.amber,
      [GUARD_STATES.INVESTIGATE]: PALETTE.amber,
      [GUARD_STATES.HUNT]: PALETTE.red,
    }[guard.state];
    // Body: dark suit, gold name tag, facing tick.
    ctx.fillStyle = '#232a3a';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = guard.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = guard.color;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 18, guard.y + Math.sin(guard.angle) * 18);
    ctx.stroke();
    text(ctx, guard.name, guard.x, guard.y - 20, 11, '#ffffff', 800, 'center');
    text(ctx, guard.state, guard.x, guard.y + 28, 9, stateColor, 700, 'center');
    if (guard.state === GUARD_STATES.SUSPICIOUS || guard.state === GUARD_STATES.INVESTIGATE) {
      text(ctx, '?', guard.x, guard.y - 34, 18, PALETTE.amber, 800, 'center');
    }
    if (guard.state === GUARD_STATES.HUNT) {
      text(ctx, '!', guard.x, guard.y - 34, 18, PALETTE.red, 800, 'center');
    }
    if (guard.suspicion > 0.05 && guard.state !== GUARD_STATES.HUNT) {
      bar(ctx, guard.x - 16, guard.y + 33, 32, 4, guard.suspicion, PALETTE.amber);
    }
  }
}

function drawThief(ctx, game) {
  const player = game.player;
  const disguised = player.disguiseTimer > 0;
  // Soft shadow under the thief.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 9, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: black coat, red scarf, gold trim when disguised as a dealer.
  ctx.fillStyle = disguised ? '#3d2f6b' : '#101318';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = disguised ? '#b7a5ff' : PALETTE.gold;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.chipRed;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(player.x - Math.cos(player.angle) * 6, player.y - Math.sin(player.angle) * 6);
  ctx.lineTo(player.x + Math.cos(player.angle) * 15, player.y + Math.sin(player.angle) * 15);
  ctx.stroke();
  // Sneak = crouched ring; sprint = motion ticks.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(232, 236, 243, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  text(ctx, 'ROOK', player.x, player.y - 22, 11, '#ffffff', 800, 'center');
  if (disguised) {
    text(ctx, `DEALER ${Math.ceil(player.disguiseTimer)}s`, player.x, player.y + 30, 9, '#c9b8ff', 700, 'center');
  }
  if (player.hasGoldenChip) {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(player.x + 16, player.y - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // Aim line and thrown chip.
  if (game.state === 'play' && !game.frozen) {
    const mx = game.input.mouse.x;
    const my = game.input.mouse.y;
    if (mx < PANEL_X && my > TOPBAR_H) {
      ctx.strokeStyle = 'rgba(232, 236, 243, 0.35)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(mx, my);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  if (player.thrownChip) {
    const chip = player.thrownChip;
    ctx.fillStyle = PALETTE.chipRed;
    ctx.beginPath();
    ctx.arc(chip.x, chip.y - 14 * (1 - chip.t), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawNoiseRings(ctx, game) {
  const event = game.noiseEvent;
  if (event) {
    const age = (game.elapsed - event.at) / 1.2;
    if (age < 1) {
      ctx.strokeStyle = `rgba(245, 166, 35, ${0.8 * (1 - age)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(event.x, event.y, event.radius * age + 12, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, 'CLINK!', event.x, event.y - event.radius * age - 8, 12, PALETTE.amber, 800, 'center');
    }
  }
  const player = game.player;
  if (player.sprinting && player.moving) {
    ctx.strokeStyle = 'rgba(255, 77, 77, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 96 * (0.6 + 0.4 * Math.sin(game.elapsed * 8)), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTopBar(ctx, game) {
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, CANVAS_W, TOPBAR_H);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(0, TOPBAR_H - 2, CANVAS_W, 2);
  text(ctx, 'HIGH ROLLER', 14, 29, 19, PALETTE.gold, 800);
  text(ctx, 'The Meridian Casino Job', 168, 29, 13, PALETTE.inkDim, 600);
  const objective = game.player.hasGoldenChip
    ? 'CHIP SECURED — reach the SERVICE ELEVATOR'
    : 'Steal the GOLDEN CHIP from the Vault Cage';
  text(ctx, objective, 500, 29, 13, game.player.hasGoldenChip ? PALETTE.green : PALETTE.ink, 700, 'center');
  const detection = detectionWord(game);
  text(ctx, `LOOT ${formatMoney(game.player.lootValue)}`, 800, 29, 14, PALETTE.ink, 700, 'right');
  text(ctx, formatTime(game.timer), 880, 29, 14, PALETTE.ink, 700, 'right');
  ctx.fillStyle = detection.color;
  roundRect(ctx, 900, 11, 118, 24, 12);
  ctx.fill();
  text(ctx, detection.word, 959, 28, 12, '#0b0e14', 800, 'center');
  text(ctx, `CHIPS ${game.player.lootTaken}/6`, 1040, 29, 12, PALETTE.inkDim, 700);
}

export function detectionWord(game) {
  if (game.state === 'caught') return { word: 'BUSTED', color: PALETTE.red };
  if (game.state === 'win') return { word: 'CLEAN GETAWAY', color: PALETTE.green };
  const hunting = game.guards.some((g) => g.state === GUARD_STATES.HUNT)
    || game.cameras.some((c) => c.spotted);
  if (hunting) return { word: 'HUNTED', color: PALETTE.red };
  const suspicious = game.guards.some((g) => g.state !== GUARD_STATES.CALM)
    || game.cameras.some((c) => c.alert > 0.4);
  if (suspicious) return { word: 'SUSPICIOUS', color: PALETTE.amber };
  return { word: 'UNSEEN', color: PALETTE.green };
}

function panelSection(ctx, x, y, w, title) {
  text(ctx, title, x, y, 12, PALETTE.gold, 800);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(x, y + 5, w, 1);
  return y + 18;
}

function drawIntelPanel(ctx, game) {
  const x = PANEL_X + 12;
  const w = CANVAS_W - PANEL_X - 24;
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(PANEL_X, TOPBAR_H, CANVAS_W - PANEL_X, CANVAS_H - TOPBAR_H);
  ctx.fillStyle = PALETTE.panelEdge;
  ctx.fillRect(PANEL_X, TOPBAR_H, 1, CANVAS_H - TOPBAR_H);

  let y = TOPBAR_H + 22;
  const detection = detectionWord(game);
  y = panelSection(ctx, x, y, w, 'DETECTION');
  text(ctx, detection.word, x, y + 16, 20, detection.color, 800);
  y += 30;

  const stage = alarmStage(game.alarm.value);
  y = panelSection(ctx, x, y, w, `ALARM  ${Math.round(game.alarm.value)} / 100 — ${stage.name}`);
  bar(ctx, x, y + 4, w, 14, game.alarm.value / 100, stage.color);
  y += 30;

  y = panelSection(ctx, x, y, w, 'VISIBILITY');
  bar(ctx, x, y + 4, w, 10, game.player.visibility, '#f5c95c');
  text(ctx, game.player.visibility > 0.66 ? 'EXPOSED' : game.player.visibility > 0.4 ? 'SEEN IN LIGHT' : 'IN SHADOW', x + w, y + 15, 10, PALETTE.inkDim, 700, 'right');
  y += 30;

  y = panelSection(ctx, x, y, w, 'NOISE');
  bar(ctx, x, y + 4, w, 10, game.player.noise, '#ff8a5c');
  y += 26;

  y = panelSection(ctx, x, y, w, 'LOOT');
  text(ctx, `Chip stacks  ${game.player.lootTaken} / 6`, x, y + 13, 12, PALETTE.ink, 600);
  text(ctx, `Golden Chip  ${game.player.hasGoldenChip ? 'HELD' : 'IN THE VAULT'}`, x, y + 30, 12, game.player.hasGoldenChip ? PALETTE.green : PALETTE.gold, 700);
  text(ctx, `Total  ${formatMoney(game.player.lootValue)}`, x, y + 47, 12, PALETTE.ink, 600);
  y += 62;

  y = panelSection(ctx, x, y, w, 'TOOLS');
  text(ctx, `Throw chips  ${game.player.chipsToThrow} / 3  (click to throw)`, x, y + 13, 12, PALETTE.ink, 600);
  text(ctx, `Dealer disguise  ${game.player.disguiseCharges} charge${game.player.disguiseCharges === 1 ? '' : 's'}`, x, y + 30, 12, PALETTE.ink, 600);
  text(ctx, `Slots rigged  ${game.slotsRigged} / 3`, x, y + 47, 12, PALETTE.ink, 600);
  y += 62;

  y = panelSection(ctx, x, y, w, 'PIT BOSSES');
  for (const guard of game.guards) {
    const color = {
      [GUARD_STATES.CALM]: PALETTE.inkDim,
      [GUARD_STATES.SUSPICIOUS]: PALETTE.amber,
      [GUARD_STATES.INVESTIGATE]: PALETTE.amber,
      [GUARD_STATES.HUNT]: PALETTE.red,
    }[guard.state];
    text(ctx, guard.name, x, y + 13, 12, '#ffffff', 700);
    text(ctx, guard.state, x + w, y + 13, 12, color, 700, 'right');
    y += 17;
  }
  y += 8;

  y = panelSection(ctx, x, y, w, 'LEGEND');
  const legend = [
    ['#f5a623', 'Guard sight cone'],
    ['#35c4b5', 'CCTV camera cone'],
    ['#e8b93c', 'Chandelier spotlight'],
    ['#f7c95c', 'Lamp pool — you are seen'],
    ['#3ddc78', 'Service elevator exit'],
    ['#c1272d', 'Loot chip stack ($200)'],
    ['#8a8f9c', 'Cover — blocks sight'],
  ];
  for (const [color, label] of legend) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 6, y + 8, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, label, x + 18, y + 12, 11, PALETTE.ink, 600);
    y += 17;
  }
  y += 6;

  y = panelSection(ctx, x, y, w, 'CONTROLS');
  const controls = [
    'WASD / Arrows — move',
    'Shift — sneak (slow, quiet)',
    'Space — sprint (fast, loud)',
    'Mouse + click — throw a chip',
    'E — pick up / rig a slot',
    'H — field notes   M — mute',
    'Esc — pause   R — restart',
  ];
  for (const line of controls) {
    text(ctx, line, x, y + 12, 11, PALETTE.inkDim, 600);
    y += 16;
  }
}

function overlayBackdrop(ctx) {
  ctx.fillStyle = 'rgba(5, 8, 13, 0.72)';
  ctx.fillRect(0, TOPBAR_H, PANEL_X, CANVAS_H - TOPBAR_H);
}

function drawTitleScreen(ctx, game) {
  overlayBackdrop(ctx);
  const cx = PANEL_X / 2;
  text(ctx, 'HIGH ROLLER', cx, 210, 52, PALETTE.gold, 800, 'center');
  text(ctx, 'The Meridian Casino Job', cx, 250, 22, PALETTE.ink, 600, 'center');
  text(ctx, 'You are ROOK. The Golden Chip sits in the Vault Cage.', cx, 300, 16, PALETTE.inkDim, 600, 'center');
  text(ctx, 'Slip past the pit bosses, dodge the cameras, mind the chandelier —', cx, 326, 16, PALETTE.inkDim, 600, 'center');
  text(ctx, 'then reach the green service elevator with the prize.', cx, 352, 16, PALETTE.inkDim, 600, 'center');
  text(ctx, 'WASD move  ·  Shift sneak  ·  Space sprint  ·  Click throw a chip  ·  E interact', cx, 420, 14, PALETTE.ink, 700, 'center');
  const blink = Math.sin(game.elapsed * 4) > -0.2;
  if (blink) text(ctx, 'PRESS ENTER OR CLICK TO START', cx, 480, 18, PALETTE.green, 800, 'center');
  text(ctx, 'GHOST BONUS +$1,000 if nobody ever spots you.', cx, 530, 13, PALETTE.gold, 700, 'center');
  void game;
}

function drawPausedScreen(ctx, game) {
  overlayBackdrop(ctx);
  const cx = PANEL_X / 2;
  text(ctx, 'PAUSED', cx, 330, 40, PALETTE.ink, 800, 'center');
  text(ctx, 'Esc to resume  ·  R to restart the job', cx, 380, 15, PALETTE.inkDim, 600, 'center');
  void game;
}

function drawCaughtScreen(ctx, game) {
  overlayBackdrop(ctx);
  const cx = PANEL_X / 2;
  text(ctx, 'BUSTED!', cx, 300, 48, PALETTE.red, 800, 'center');
  text(ctx, `${game.caughtBy ? `${game.caughtBy} grabbed your collar.` : 'Security grabbed your collar.'}`, cx, 350, 16, PALETTE.ink, 600, 'center');
  text(ctx, `Loot kept: ${formatMoney(game.player.lootValue)} — the Golden Chip stays in the vault.`, cx, 380, 15, PALETTE.inkDim, 600, 'center');
  text(ctx, 'Press R to run the job again.', cx, 430, 16, PALETTE.green, 700, 'center');
  void game;
}

function drawWinScreen(ctx, game) {
  overlayBackdrop(ctx);
  const cx = PANEL_X / 2;
  text(ctx, 'CLEAN GETAWAY', cx, 280, 44, PALETTE.green, 800, 'center');
  text(ctx, `The elevator doors close. Rook vanishes into the night with ${formatMoney(game.player.lootValue)}.`, cx, 330, 16, PALETTE.ink, 600, 'center');
  if (game.ghost) {
    text(ctx, 'GHOST BONUS +$1,000 — nobody ever spotted you.', cx, 370, 16, PALETTE.gold, 800, 'center');
  }
  text(ctx, `Time ${formatTime(game.timer)}  ·  Alarm peaked at ${Math.round(game.alarmPeak)}`, cx, 410, 14, PALETTE.inkDim, 600, 'center');
  text(ctx, 'Press R to run it again — faster, quieter.', cx, 460, 16, PALETTE.green, 700, 'center');
  void game;
}

function drawFieldNotes(ctx, game) {
  ctx.fillStyle = 'rgba(8, 11, 18, 0.92)';
  roundRect(ctx, 28, TOPBAR_H + 28, 420, 330, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'FIELD NOTES — ROOK', 48, TOPBAR_H + 62, 16, PALETTE.gold, 800);
  const notes = [
    '• Lamp pools and the chandelier beam expose you.',
    '• Shadows are safe: sneak (Shift) through the dark.',
    '• A thrown chip (click) pulls a guard to the noise.',
    '• Rig a slot (E) to fake a jackpot and clear a room.',
    '• The dealer jacket lets you cross a cone twice.',
    '• Cameras (teal) raise the alarm fast — time them.',
    '• At LOCKDOWN an extra pit boss joins the floor.',
    '• Take the Golden Chip, then the green elevator.',
  ];
  notes.forEach((line, i) => {
    text(ctx, line, 48, TOPBAR_H + 92 + i * 26, 13, PALETTE.ink, 600);
  });
  text(ctx, 'H to close', 48, TOPBAR_H + 330, 12, PALETTE.inkDim, 700);
  void game;
}

// Annotated callouts the screenshot presets draw over the live frame so the
// judge reads the mechanics at a glance.
function drawShotCallouts(ctx, game) {
  const callouts = game.shotCallouts;
  ctx.font = `700 13px ${FONT}`;
  for (const callout of callouts) {
    const labelW = ctx.measureText(callout.label).width + 18;
    const lx = callout.labelX;
    const ly = callout.labelY;
    ctx.strokeStyle = callout.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(callout.x, callout.y);
    ctx.lineTo(lx + labelW / 2, ly + 8);
    ctx.stroke();
    ctx.fillStyle = 'rgba(8, 11, 18, 0.92)';
    roundRect(ctx, lx, ly, labelW, 24, 5);
    ctx.fill();
    ctx.strokeStyle = callout.color;
    ctx.stroke();
    ctx.fillStyle = callout.color;
    ctx.textAlign = 'center';
    ctx.fillText(callout.label, lx + labelW / 2, ly + 17);
  }
}
