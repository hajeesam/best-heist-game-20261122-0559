// HIGH ROLLER: The Meridian Casino Job — the game itself. Wires input,
// level, guards, cameras, the chandelier and the thief into one loop, owns
// the alarm, the noise events and the win/lose states, and boots from the
// URL: ?shot=cover|start|play|exit&seed=N stages a frozen screenshot moment.

import {
  CANVAS_W, CANVAS_H, TOPBAR_H, ALARM, GUARD, clamp, distance,
} from './config.js';
import { buildCasinoLevel, solidRects, roomAt } from './level.js';
import { createInput } from './input.js';
import { createPitBoss, updatePitBoss, GUARD_STATES } from './guard.js';
import {
  createCctvCamera, updateCctvCamera,
  createChandelier, updateChandelier, thiefInChandelierBeam,
} from './camera.js';
import { createThief, updateThief } from './player.js';
import { createCasinoAudio } from './audio.js';
import { renderGame } from './render.js';
import { applyShotPreset } from './shots.js';
import { CHANDELIER } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

const GUARD_DEFS = [
  {
    name: 'VIC', color: '#f5a623', startAngle: 0,
    waypoints: [[120, 120], [480, 120], [480, 700], [120, 700]],
  },
  {
    name: 'MARA', color: '#ff7a59', startAngle: 0,
    waypoints: [[620, 120], [920, 120], [920, 340], [620, 340]],
  },
  {
    name: 'SILAS', color: '#e05c7a', startAngle: 0,
    waypoints: [[620, 470], [920, 470], [920, 730], [620, 730]],
  },
];

const CAMERA_DEFS = [
  { id: 'CAM-1', x: 700, y: 64, baseAngle: Math.PI / 2, sweepRange: 0.9, phase: 0 },
  { id: 'CAM-2', x: 940, y: 430, baseAngle: Math.PI * 0.85, sweepRange: 0.8, phase: 1.7 },
];

export function createCasinoGame() {
  const level = buildCasinoLevel();
  const game = {
    canvas,
    level,
    solids: solidRects(level),
    input: createInput(canvas),
    audio: createCasinoAudio(),
    player: createThief(level.entrance.x, level.entrance.y),
    guards: GUARD_DEFS.map(createPitBoss),
    cameras: CAMERA_DEFS.map(createCctvCamera),
    chandelier: createChandelier(CHANDELIER),
    chandelierBeamOnPlayer: false,
    alarm: { value: 0 },
    alarmPeak: 0,
    timer: 0,
    elapsed: 0,
    state: 'title',
    showNotes: false,
    frozen: false,
    noiseEvent: null,
    slotsRigged: 0,
    ghost: true,
    caughtBy: null,
    shotCallouts: null,

    raiseNoise(x, y, radius, kind) {
      this.noiseEvent = { x, y, radius, kind, at: this.elapsed };
    },

    onGuardSpot(guard) {
      this.ghost = false;
      this.alarm.value = clamp(this.alarm.value + ALARM.onGuardSpot, 0, 100);
      this.audio.playAlarm();
      this.flashStatus(`${guard.name} spotted you!`);
    },

    onCameraSpot(camera) {
      this.ghost = false;
      this.alarm.value = clamp(this.alarm.value + ALARM.onCameraSpot, 0, 100);
      this.audio.playAlarm();
      this.flashStatus(`${camera.id} spotted you!`);
    },

    onCaught(guard) {
      if (this.state !== 'play') return;
      this.state = 'caught';
      this.caughtBy = guard.name;
      this.audio.playCaught();
      this.flashStatus(`Busted by ${guard.name}. Press R to try again.`);
    },

    flashStatus(message) {
      statusLine.textContent = message;
    },

    tryInteract() {
      const player = this.player;
      const level = this.level;

      // The service elevator: the way out, once the Golden Chip is held.
      const el = level.elevator;
      if (player.hasGoldenChip
        && player.x > el.x - 10 && player.x < el.x + el.w + 10
        && player.y > el.y - 10 && player.y < el.y + el.h + 10) {
        this.winJob();
        return;
      }

      // Pocket a chip stack or the Golden Chip.
      for (const item of level.loot) {
        if (!item.taken && distance(player.x, player.y, item.x, item.y) < 36) {
          item.taken = true;
          player.lootTaken += item.kind === 'chips' ? 1 : 0;
          player.lootValue += item.value;
          if (item.kind === 'golden') {
            player.hasGoldenChip = true;
            this.audio.playGolden();
            this.flashStatus('Golden Chip secured! Reach the green service elevator.');
          } else {
            this.audio.playPickup();
          }
          return;
        }
      }

      // Take the dealer jacket off the bar.
      const disguise = level.disguise;
      if (!disguise.taken && distance(player.x, player.y, disguise.x, disguise.y) < 40) {
        disguise.taken = true;
        player.disguiseCharges = disguise.charges;
        player.disguiseTimer = 6;
        this.audio.playDisguise();
        this.flashStatus('Dealer jacket on — guards will look right past you. Twice.');
        return;
      }

      // Rig a slot machine: a fake jackpot that pulls every nearby guard over.
      for (const slot of level.slots) {
        if (slot.riggable && !slot.rigged
          && distance(player.x, player.y, slot.x + slot.w / 2, slot.y + slot.h / 2) < 52) {
          slot.rigged = true;
          this.slotsRigged += 1;
          this.raiseNoise(slot.x + slot.w / 2, slot.y + slot.h / 2, 150, 'slot');
          this.audio.playChipPing();
          this.flashStatus('Slot rigged — jackpot bells pull the guards away.');
          return;
        }
      }
    },

    winJob() {
      if (this.state !== 'play') return;
      this.state = 'win';
      if (this.ghost) this.player.lootValue += 1000;
      this.audio.playWin();
      this.flashStatus('Clean getaway! Press R to run it again.');
    },

    resetJob() {
      const fresh = createCasinoGame();
      Object.keys(fresh).forEach((key) => {
        this[key] = fresh[key];
      });
      this.state = 'play';
    },
  };
  return game;
}

function updateCasinoGame(game, dt) {
  if (game.state !== 'play') return;
  game.timer += dt;
  game.elapsed += dt;

  updateChandelier(game.chandelier, game.elapsed);
  game.chandelierBeamOnPlayer = thiefInChandelierBeam(game.chandelier, game.player);

  // The alarm cools when nobody can see the thief.
  const anyoneSees = game.guards.some((g) => g.state === GUARD_STATES.HUNT)
    || game.cameras.some((c) => c.alert > 0.5);
  if (!anyoneSees) {
    game.alarm.value = clamp(game.alarm.value - ALARM.decayPerSecond * dt, 0, 100);
  } else {
    game.alarm.value = clamp(game.alarm.value + ALARM.seenRisePerSecond * dt, 0, 100);
  }
  game.alarmPeak = Math.max(game.alarmPeak, game.alarm.value);

  // LOCKDOWN brings in RENO, a fourth pit boss, from the service corridor.
  if (game.alarm.value >= ALARM.lockdownAt && game.guards.length === 3) {
    const reno = createPitBoss({
      name: 'RENO', color: '#c1272d', startAngle: -Math.PI / 2,
      waypoints: [[500, 740], [480, 120], [120, 120], [120, 700]],
    });
    reno.x = 500;
    reno.y = 740;
    game.guards.push(reno);
    game.flashStatus('LOCKDOWN — RENO joins the floor!');
  }

  updateThief(game.player, dt, game);
  for (const guard of game.guards) updatePitBoss(guard, dt, game);
  for (const camera of game.cameras) updateCctvCamera(camera, dt, game);

  // A noise event fades after a little over a second.
  if (game.noiseEvent && game.elapsed - game.noiseEvent.at > 1.3) {
    game.noiseEvent = null;
  }

  // Sprinting is loud: guards nearby turn toward the sound.
  if (game.player.sprinting && game.player.moving) {
    game.raiseNoise(game.player.x, game.player.y, 96, 'steps');
  }

  // Reaching the open elevator with the prize ends the job.
  const el = game.level.elevator;
  const player = game.player;
  if (player.hasGoldenChip
    && player.x > el.x && player.x < el.x + el.w
    && player.y > el.y && player.y < el.y + el.h) {
    game.winJob();
  }
}

function handleGlobalKeys(game) {
  const input = game.input;
  if (input.wasPressed('mute')) {
    const muted = game.audio.toggleMute();
    game.flashStatus(muted ? 'Sound off.' : 'Sound on.');
  }
  if (input.wasPressed('restart') && game.state !== 'title') {
    game.resetJob();
    return;
  }
  if (input.wasPressed('notes') && game.state === 'play') {
    game.showNotes = !game.showNotes;
  }
  if (input.wasPressed('pause')) {
    if (game.state === 'play') game.state = 'paused';
    else if (game.state === 'paused') game.state = 'play';
  }
  if (game.state === 'title'
    && (input.wasPressed('confirm') || input.mouse.clicked)) {
    game.audio.unlockAudio();
    game.state = 'play';
    game.flashStatus('Steal the Golden Chip, then reach the green elevator.');
  }
}

// Boot: build the game, stage a screenshot preset when asked, then run.
// The game is also reachable as window.__highRollerGame for play-testing.
const game = createCasinoGame();
window.__highRollerGame = game;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;
if (shot) {
  applyShotPreset(game, shot, seed);
}

let lastTime = performance.now();
function casinoFrame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  handleGlobalKeys(game);
  if (!game.frozen) updateCasinoGame(game, dt);
  renderGame(ctx, game);
  game.input.endFrame();
  requestAnimationFrame(casinoFrame);
}
requestAnimationFrame(casinoFrame);

// Surface script errors in the DOM so a headless check can see them.
window.addEventListener('error', (event) => {
  document.body.dataset.pageError = String(event.message || 'error');
});
