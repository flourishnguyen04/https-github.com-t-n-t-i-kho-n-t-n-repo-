let ambientContext = null;
let ambientTimer = null;
let ambientStep = 0;

// Background music tuning:
// - Change BACKGROUND_MELODY to adjust the cheerful note pattern.
// - Change BACKGROUND_TEMPO_MS to make the loop faster or slower.
// - Change BACKGROUND_VOLUME to raise or lower the overall music level.
const BACKGROUND_MELODY = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 659.25, 880];
const BACKGROUND_BASS = [261.63, 329.63, 392, 329.63];
const BACKGROUND_TEMPO_MS = 290;
const BACKGROUND_VOLUME = 0.018;

const getAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
};

export const isSoundEnabled = () => localStorage.getItem("writewise_sound") === "on";

export const isBackgroundMusicEnabled = () => localStorage.getItem("writewise_background_music") === "on";

export const playTone = ({ frequency = 520, duration = 0.08, volume = 0.025, type = "sine" } = {}) => {
  if (!isSoundEnabled()) return;

  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.onended = () => context.close();
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
};

export const playClickSound = () => playTone({ frequency: 520, duration: 0.08, volume: 0.025 });

export const playCorrectSound = () => playTone({ frequency: 720, duration: 0.11, volume: 0.03 });

export const playWrongSound = () => playTone({ frequency: 220, duration: 0.14, volume: 0.026, type: "triangle" });

export const playCompletionSound = () => {
  if (!isSoundEnabled()) return;
  playTone({ frequency: 660, duration: 0.09, volume: 0.026 });
  window.setTimeout(() => playTone({ frequency: 880, duration: 0.12, volume: 0.024 }), 90);
};

const playPluck = (context, frequency, startTime, volume = BACKGROUND_VOLUME) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, startTime);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1800, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.24);
};

const scheduleBackgroundStep = () => {
  if (!ambientContext || !isBackgroundMusicEnabled()) return;

  const context = ambientContext;
  const now = context.currentTime;
  const melodyFrequency = BACKGROUND_MELODY[ambientStep % BACKGROUND_MELODY.length];

  playPluck(context, melodyFrequency, now, BACKGROUND_VOLUME);

  if (ambientStep % 2 === 0) {
    const bassFrequency = BACKGROUND_BASS[Math.floor(ambientStep / 2) % BACKGROUND_BASS.length];
    playPluck(context, bassFrequency, now + 0.02, BACKGROUND_VOLUME * 0.45);
  }

  ambientStep += 1;
};

export const stopBackgroundMusic = () => {
  if (ambientTimer) {
    window.clearInterval(ambientTimer);
    ambientTimer = null;
  }
  ambientStep = 0;
  if (ambientContext) {
    ambientContext.close();
    ambientContext = null;
  }
};

export const startBackgroundMusic = () => {
  if (!isBackgroundMusicEnabled() || ambientContext) return;

  const context = getAudioContext();
  if (!context) return;

  ambientContext = context;
  ambientStep = 0;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  scheduleBackgroundStep();
  ambientTimer = window.setInterval(scheduleBackgroundStep, BACKGROUND_TEMPO_MS);
};

export const syncBackgroundMusic = () => {
  if (isBackgroundMusicEnabled()) {
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
};
