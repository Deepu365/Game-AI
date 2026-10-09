/**
 * Web Audio API synthesizer for Glamour Metaverse Fashion Studio.
 * Complete, self-contained audio with zero external asset dependencies.
 */
class FashionSoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    const saved = localStorage.getItem('glamour_sound_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('glamour_sound_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopMusic();
    }
    return this.isMuted;
  }

  // --- Sound Effects ---

  public playSparkle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.28);
    });
  }

  public playRustle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playShutter() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Fast mechanical shutter click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);

    // Follow-up flash capacitor sound
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const t = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, t);
      osc2.frequency.exponentialRampToValueAtTime(1800, t + 0.15);

      gain2.gain.setValueAtTime(0.08, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc2.start(t);
      osc2.stop(t + 0.2);
    }, 60);
  }

  public playApplause() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 1.25);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  // --- Chic Lounge Runway Music Groove ---
  public startMusic() {
    if (this.isMuted || this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    let step = 0;
    // House / Catwalk chord progression: Am7 -> Dm7 -> Fmaj7 -> Em7
    const chords = [
      [220, 261.63, 329.63, 392], // Am7
      [220, 261.63, 329.63, 392],
      [146.83, 220, 261.63, 349.23], // Dm7
      [146.83, 220, 261.63, 349.23],
      [174.61, 261.63, 329.63, 392], // Fmaj7
      [174.61, 261.63, 329.63, 392],
      [164.81, 246.94, 293.66, 392], // Em7
      [164.81, 246.94, 293.66, 392],
    ];

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[step % chords.length];
      step++;

      // Synth pad shimmer
      currentChord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        gain.gain.setValueAtTime(0.015, now);
        gain.gain.linearRampToValueAtTime(0.035, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.52);
      });
    }, 450);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const fashionSound = new FashionSoundManager();
