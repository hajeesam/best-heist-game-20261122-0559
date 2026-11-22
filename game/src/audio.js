// Tiny synthesised sound effects: no audio files, no network, just the
// Web Audio oscillator. Silent until the player first interacts, and the M
// key mutes everything. Headless browsers without audio simply do nothing.

export function createCasinoAudio() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (ctx) return ctx;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, seconds, type, gainValue, when = 0) {
    if (muted) return;
    const audio = ensureContext();
    if (!audio) return;
    try {
      if (audio.state === 'suspended') void audio.resume();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainValue, audio.currentTime + when);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + when + seconds);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(audio.currentTime + when);
      osc.stop(audio.currentTime + when + seconds);
    } catch {
      // Audio is decoration; a failure here must never break the game.
    }
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    playPickup() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1318, 0.16, 'sine', 0.1, 0.07);
    },
    playGolden() {
      tone(523, 0.14, 'triangle', 0.14);
      tone(659, 0.14, 'triangle', 0.14, 0.09);
      tone(784, 0.22, 'triangle', 0.14, 0.18);
      tone(1046, 0.3, 'triangle', 0.12, 0.27);
    },
    playThrow() {
      tone(420, 0.1, 'sine', 0.08);
    },
    playChipPing() {
      tone(1568, 0.2, 'sine', 0.12);
      tone(1175, 0.24, 'sine', 0.09, 0.08);
    },
    playAlarm() {
      tone(220, 0.22, 'square', 0.07);
      tone(175, 0.22, 'square', 0.07, 0.22);
    },
    playCaught() {
      tone(196, 0.3, 'sawtooth', 0.1);
      tone(131, 0.5, 'sawtooth', 0.1, 0.25);
    },
    playWin() {
      tone(523, 0.16, 'triangle', 0.13);
      tone(659, 0.16, 'triangle', 0.13, 0.12);
      tone(784, 0.16, 'triangle', 0.13, 0.24);
      tone(1046, 0.4, 'triangle', 0.13, 0.36);
    },
    playDisguise() {
      tone(660, 0.12, 'sine', 0.09);
      tone(990, 0.18, 'sine', 0.09, 0.08);
    },
    unlockAudio() {
      ensureContext();
    },
  };
}
