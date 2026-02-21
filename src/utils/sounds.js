// Arabic-inspired sound effects using Web Audio API
// Uses Maqam Hijaz scale intervals for that distinctive Middle Eastern feel

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Maqam Hijaz frequencies rooted at D4 (293.66 Hz)
// Intervals: half, aug2nd, half, whole, half, aug2nd, half
const HIJAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 554.37, 587.33];

function playTone(freq, duration, type = 'triangle', gainVal = 0.15, detune = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Oud-like pluck: short attack with harmonics
function pluck(freq, duration = 0.4, vol = 0.12) {
  const ctx = getCtx();
  const t = ctx.currentTime;

  // Fundamental
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'triangle';
  osc1.frequency.value = freq;
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2; // octave harmonic

  gain.gain.setValueAtTime(vol, t);
  gain.gain.setValueAtTime(vol * 0.8, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + duration);
  osc2.stop(t + duration);
}

// ── Sound Effects ──

// Correct answer: ascending Hijaz arpeggio (oud-like)
export function playCorrect() {
  pluck(HIJAZ[0], 0.3, 0.1);
  setTimeout(() => pluck(HIJAZ[2], 0.3, 0.1), 80);
  setTimeout(() => pluck(HIJAZ[4], 0.5, 0.12), 160);
}

// Wrong answer: low dissonant buzz
export function playWrong() {
  playTone(130, 0.35, 'sawtooth', 0.08);
  playTone(138, 0.35, 'sawtooth', 0.06, 15);
}

// Letter tap: soft darbuka-like percussion
export function playTap() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

// Word complete: celebratory descending-then-ascending Hijaz run
export function playWordComplete() {
  const notes = [HIJAZ[4], HIJAZ[5], HIJAZ[6], HIJAZ[7]];
  notes.forEach((freq, i) => {
    setTimeout(() => pluck(freq, 0.4, 0.1), i * 100);
  });
  // Final shimmer
  setTimeout(() => {
    playTone(HIJAZ[7], 0.8, 'sine', 0.08);
    playTone(HIJAZ[7] * 1.5, 0.8, 'sine', 0.05);
  }, 400);
}

// Level up: triumphant ascending scale with richer harmonics
export function playLevelUp() {
  const scale = [HIJAZ[0], HIJAZ[2], HIJAZ[4], HIJAZ[7]];
  scale.forEach((freq, i) => {
    setTimeout(() => {
      pluck(freq, 0.5, 0.12);
      playTone(freq * 1.5, 0.5, 'sine', 0.05); // fifth harmony
    }, i * 150);
  });
  // Final chord
  setTimeout(() => {
    playTone(HIJAZ[7], 1.0, 'triangle', 0.08);
    playTone(HIJAZ[7] * 1.25, 1.0, 'sine', 0.05); // major third
    playTone(HIJAZ[7] * 1.5, 1.0, 'sine', 0.04);  // fifth
  }, 600);
}

// Streak combo: rapid ascending burst
export function playCombo() {
  const fast = [HIJAZ[0], HIJAZ[1], HIJAZ[2], HIJAZ[3], HIJAZ[4], HIJAZ[5], HIJAZ[6], HIJAZ[7]];
  fast.forEach((freq, i) => {
    setTimeout(() => pluck(freq, 0.2, 0.08), i * 50);
  });
  // Shimmer at the top
  setTimeout(() => {
    playTone(HIJAZ[7] * 2, 0.6, 'sine', 0.06);
  }, 400);
}

// Nav click: subtle pitched tap
export function playNav() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = HIJAZ[4]; // A4
  gain.gain.setValueAtTime(0.06, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.08);
}

// Correct letter placed in word builder: single satisfying pluck
export function playLetterPlace() {
  pluck(HIJAZ[4], 0.25, 0.1);
}
