// Deterministic screenshot presets: each ?shot= name stages one photogenic
// moment of the live game — real positions, real cones, real meters — then
// freezes the simulation so the frame is exactly reproducible.

import { GUARD_STATES } from './guard.js';
import { chandelierAngleAt } from './camera.js';

function setGuardPose(guard, x, y, angle, state, suspicion) {
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.state = state;
  guard.suspicion = suspicion;
  guard.investigateX = x;
  guard.investigateY = y;
}

export function applyShotPreset(game, shot, seed) {
  const [vic, mara, silas] = game.guards;
  const player = game.player;
  game.frozen = true;
  game.showNotes = false;
  game.shotCallouts = null;
  game.state = 'play';

  if (shot === 'cover') {
    // The cover: Vic is suspicious mid-floor, the chandelier beam sweeps
    // across Rook, a camera watches the vault, the Golden Chip glints.
    game.elapsed = 9.4;
    game.timer = 74;
    game.alarm.value = 46;
    game.alarmPeak = 46;
    player.x = 352;
    player.y = 318;
    player.angle = Math.PI / 2;
    player.sneaking = true;
    player.visibility = 0.72;
    player.lootTaken = 2;
    player.lootValue = 400;
    player.chipsToThrow = 2;
    setGuardPose(vic, 250, 318, 0, GUARD_STATES.SUSPICIOUS, 0.62);
    setGuardPose(mara, 700, 210, Math.PI / 2, GUARD_STATES.CALM, 0);
    setGuardPose(silas, 640, 640, 0, GUARD_STATES.CALM, 0);
    game.cameras[0].angle = 1.15;
    game.cameras[0].alert = 0.3;
    game.cameras[1].angle = 2.6;
    game.cameras[1].alert = 0;
    game.chandelier.angle = chandelierAngleAt(game.chandelier, game.elapsed);
    // Aim the beam at Rook for the shot.
    game.chandelier.angle = Math.atan2(player.y - game.chandelier.y, player.x - game.chandelier.x);
    game.chandelierBeamOnPlayer = true;
    game.shotCallouts = [
      { x: 250, y: 318, labelX: 60, labelY: 120, label: 'PIT BOSS VIC — SUSPICIOUS ?', color: '#f5a623' },
      { x: 300, y: 330, labelX: 96, labelY: 640, label: 'CHANDELIER SPOTLIGHT SWEEPS THE FLOOR', color: '#e8b93c' },
      { x: 700, y: 64, labelX: 596, labelY: 100, label: 'CCTV — TEAL CONE', color: '#35c4b5' },
      { x: 884, y: 634, labelX: 742, labelY: 726, label: 'GOLDEN CHIP — THE PRIZE', color: '#e8b93c' },
      { x: 352, y: 318, labelX: 380, labelY: 210, label: 'ROOK — SNEAKING IN THE BEAM', color: '#e8ecf3' },
    ];
  } else if (shot === 'start') {
    // The opening: Rook slips in the service door, the floor calm, the job ahead.
    game.state = 'title';
    game.elapsed = 2.2;
    game.timer = 0;
    game.alarm.value = 0;
    game.alarmPeak = 0;
    player.x = 58;
    player.y = 92;
    player.angle = Math.PI / 2;
    player.visibility = 0.3;
    setGuardPose(vic, 120, 120, 0, GUARD_STATES.CALM, 0);
    setGuardPose(mara, 620, 120, 0, GUARD_STATES.CALM, 0);
    setGuardPose(silas, 620, 470, 0, GUARD_STATES.CALM, 0);
    game.cameras[0].angle = 1.57;
    game.cameras[1].angle = 2.4;
    game.chandelier.angle = 0.6;
    game.chandelierBeamOnPlayer = false;
  } else if (shot === 'play') {
    // Mid-heist: Rook sneaks behind a slot row in the dealer jacket while a
    // thrown chip clinks across the floor and Mara turns to investigate.
    game.elapsed = 21.8;
    game.timer = 131;
    game.alarm.value = 18;
    game.alarmPeak = 24;
    player.x = 330;
    player.y = 226;
    player.angle = Math.PI;
    player.sneaking = true;
    player.visibility = 0.42;
    player.lootTaken = 3;
    player.lootValue = 600;
    player.chipsToThrow = 1;
    player.disguiseCharges = 1;
    player.disguiseTimer = 4;
    player.thrownChip = { x: 470, y: 190, tx: 520, ty: 180, t: 0.55 };
    game.raiseNoise(520, 180, 130, 'chip');
    setGuardPose(vic, 200, 150, Math.PI / 4, GUARD_STATES.CALM, 0.1);
    setGuardPose(mara, 660, 210, -0.5, GUARD_STATES.INVESTIGATE, 0.3);
    mara.investigateX = 520;
    mara.investigateY = 180;
    mara.investigateTimer = 4;
    setGuardPose(silas, 700, 700, -Math.PI / 2, GUARD_STATES.CALM, 0);
    game.cameras[0].angle = 1.9;
    game.cameras[1].angle = 2.9;
    game.chandelier.angle = 2.4;
    game.chandelierBeamOnPlayer = false;
    game.shotCallouts = [
      { x: 520, y: 180, labelX: 560, labelY: 96, label: 'THROWN CHIP — MARA TURNS TO LOOK', color: '#f5a623' },
      { x: 330, y: 226, labelX: 120, labelY: 300, label: 'ROOK — DEALER DISGUISE ON', color: '#c9b8ff' },
    ];
  } else if (shot === 'exit') {
    // The getaway: Golden Chip held, the elevator open, alarm quiet, ghost intact.
    game.elapsed = 34.5;
    game.timer = 207;
    game.alarm.value = 12;
    game.alarmPeak = 18;
    game.ghost = true;
    player.x = 58;
    player.y = 742;
    player.angle = -Math.PI / 2;
    player.hasGoldenChip = true;
    player.lootTaken = 6;
    player.lootValue = 6200;
    player.chipsToThrow = 0;
    player.disguiseCharges = 0;
    game.level.loot.forEach((item) => { item.taken = true; });
    setGuardPose(vic, 420, 660, Math.PI, GUARD_STATES.CALM, 0);
    setGuardPose(mara, 860, 200, Math.PI / 2, GUARD_STATES.CALM, 0);
    setGuardPose(silas, 620, 470, 0, GUARD_STATES.CALM, 0);
    game.cameras[0].angle = 0.9;
    game.cameras[1].angle = 3.4;
    game.chandelier.angle = 4.2;
    game.chandelierBeamOnPlayer = false;
    game.shotCallouts = [
      { x: 58, y: 742, labelX: 150, labelY: 600, label: 'SERVICE ELEVATOR — GO!', color: '#3ddc78' },
      { x: 58, y: 742, labelX: 200, labelY: 130, label: 'GOLDEN CHIP SECURED — GHOST RUN', color: '#e8b93c' },
    ];
  }
  void seed;
}
