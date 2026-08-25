// Procedural 8-bit / 16-bit Web Audio Sound System for Adventure Party

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.noiseBuffer = null;

    // Load mute preference from storage if available
    try {
      this.muted = localStorage.getItem("adventure_party_muted") === "true";
    } catch {
      this.muted = false;
    }
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.gain.value = this.muted ? 0 : 0.7;
      this.sfxGain.gain.value = 0.8;
      this.musicGain.gain.value = 0.22;

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.generateNoiseBuffer();
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1; // 1 second of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  unlock() {
    const ctx = this.ensureContext();
    if (ctx && !this.bgmPlaying && !this.muted) {
      this.startBgm();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.muted = !this.muted;
    try {
      localStorage.setItem("adventure_party_muted", String(this.muted));
    } catch {}

    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(this.muted ? 0 : 0.7, t + 0.05);
    }

    if (!this.muted && !this.bgmPlaying) {
      this.startBgm();
    }

    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // --- SOUND EFFECTS ---

  /**
   * Sword swing / melee whoosh
   */
  playSwing(heroRole = "Leader") {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // Pitch multiplier based on hero type
    let baseFreq = 420;
    if (heroRole === "Striker") baseFreq = 540; // Zack: sharp & fast
    if (heroRole === "Reach") baseFreq = 380;   // Justin: deeper arc
    if (heroRole === "Warden") baseFreq = 300;  // Billie Jean: heavy

    // Tonal swoosh (triangle wave pitch swipe down)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.25, now + 0.12);

    oscGain.gain.setValueAtTime(0.28, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);

    // Filtered noise whoosh
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(baseFreq * 2.5, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      filter.Q.value = 2.0;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.11);
    }
  }

  /**
   * Strike impact (crisp square/noise hit)
   */
  playHit() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);

    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.linearRampToValueAtTime(300, now + 0.06);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.07);
    }
  }

  /**
   * Monster defeated / disintegrated
   */
  playMonsterDeath() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // Descending crunchy pop
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);

    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      filter.Q.value = 1.2;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.21);
    }
  }

  /**
   * Hero takes damage
   */
  playHeroHurt() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // Distinct alarm / low punch
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.setValueAtTime(120, now + 0.05);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Hero falls / dies
   */
  playHeroDeath() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // 3 descending tones
    const notes = [293.66, 220.0, 164.81]; // D4 -> A3 -> E3
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      oscGain.gain.setValueAtTime(0.35, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  /**
   * Billie Jean's healing pulse chime (ascending sparkle)
   */
  playHeal() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // Ascending harmonic chime: C5, E5, G5, C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, i) => {
      const t = now + i * 0.065;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(0.25, t + 0.015);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  /**
   * Shrine proximity discovery chord (mystical resonant shimmer)
   */
  playShrine() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // Shimmering chord (D major 9th: D4, A4, F#5, E6)
    const chord = [293.66, 440.0, 739.99, 1318.51];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const t = now + idx * 0.04;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(0.18, t + 0.15);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 1.45);
    });
  }

  /**
   * Party Wipe / Defeat fanfare
   */
  playWipe() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // Melancholy minor descent: D4, Bb3, G3, D3
    const notes = [293.66, 233.08, 196.0, 146.83];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.22;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, t);

      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(0.3, t + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.55);
    });
  }

  /**
   * Revival fanfare / Rising arpeggio on R
   */
  playRestart() {
    const ctx = this.ensureContext();
    if (!ctx || this.muted) return;
    const now = ctx.currentTime;

    // Rising triumphant notes: G3, C4, E4, G4, C5
    const notes = [196.0, 261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      oscGain.gain.setValueAtTime(0, t);
      oscGain.gain.linearRampToValueAtTime(0.28, t + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  // --- BACKGROUND MUSIC ENGINE ---

  startBgm() {
    if (this.bgmPlaying) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.bgmPlaying = true;

    // Zelda-esque gentle adventure progression (16 steps)
    const melody = [
      { note: 261.63, len: 0.3 }, // C4
      { note: 329.63, len: 0.3 }, // E4
      { note: 392.0,  len: 0.5 }, // G4
      { note: 523.25, len: 0.4 }, // C5
      { note: 440.0,  len: 0.3 }, // A4
      { note: 392.0,  len: 0.3 }, // G4
      { note: 349.23, len: 0.5 }, // F4
      { note: 329.63, len: 0.4 }, // E4
      { note: 293.66, len: 0.3 }, // D4
      { note: 349.23, len: 0.3 }, // F4
      { note: 440.0,  len: 0.5 }, // A4
      { note: 392.0,  len: 0.4 }, // G4
      { note: 329.63, len: 0.3 }, // E4
      { note: 293.66, len: 0.3 }, // D4
      { note: 261.63, len: 0.7 }, // C4
      { note: null,   len: 0.3 }, // rest
    ];

    const bassLine = [
      130.81, 130.81, 130.81, 130.81, // C3
      174.61, 174.61, 174.61, 174.61, // F3
      146.83, 146.83, 146.83, 146.83, // D3
      196.0,  196.0,  196.0,  196.0,  // G3
    ];

    let step = 0;
    const tempo = 240; // ms per step

    const tick = () => {
      if (!this.bgmPlaying || this.muted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const m = melody[step % melody.length];

      // Play melody note
      if (m && m.note) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(m.note, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + m.len);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + m.len + 0.02);
      }

      // Play soft bass tone every 2 steps
      if (step % 2 === 0) {
        const bassNote = bassLine[Math.floor(step / 2) % bassLine.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = "sine";
        bassOsc.frequency.setValueAtTime(bassNote, now);

        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(now);
        bassOsc.stop(now + 0.48);
      }

      step++;
      this.bgmTimer = setTimeout(tick, tempo);
    };

    tick();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const sound = new SoundEngine();
