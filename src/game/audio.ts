/**
 * Web Audio API synthesizer for Neon Cyber Racing.
 * 100% self-contained without external audio files for zero broken dependencies.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private musicOsc1: OscillatorNode | null = null;
  private musicOsc2: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    const saved = localStorage.getItem('ncr_muted');
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
    localStorage.setItem('ncr_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopEngine();
      this.stopMusic();
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('ncr_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopEngine();
      this.stopMusic();
    }
  }

  // --- Engine Hum Sound ---
  public startEngine() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    if (this.engineOsc) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
    } catch {
      // Audio init safeguard
    }
  }

  public updateEngine(speedRatio: number, isBoosting: boolean) {
    if (this.isMuted || !this.ctx || !this.engineOsc || !this.engineGain || !this.engineFilter) return;

    const baseFreq = 50 + speedRatio * 90 + (isBoosting ? 45 : 0);
    const filterFreq = 260 + speedRatio * 600 + (isBoosting ? 400 : 0);
    const targetGain = 0.05 + speedRatio * 0.07 + (isBoosting ? 0.04 : 0);

    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.05);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.05);
  }

  public stopEngine() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {}
      this.engineOsc = null;
    }
    if (this.engineGain) {
      this.engineGain.disconnect();
      this.engineGain = null;
    }
    if (this.engineFilter) {
      this.engineFilter.disconnect();
      this.engineFilter = null;
    }
  }

  // --- Sound Effects ---

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Arpeggio chime
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.12); // A6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playBoost() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.35);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.35);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.46);
  }

  public playCrash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Noise buffer for explosion crunch
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.4);

    // Sub-bass impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(130, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.3);

    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.005, now + 0.32);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.35);
  }

  public playGem() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Sparkling multi-note chime
    osc.frequency.setValueAtTime(1046.5, now); // C6
    osc.frequency.setValueAtTime(1318.5, now + 0.06); // E6
    osc.frequency.setValueAtTime(1567.98, now + 0.12); // G6
    osc.frequency.setValueAtTime(2093.0, now + 0.18); // C7

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playHeart() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Warm restorative pulse
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.28); // C6

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playCommsBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(1600, now + 0.04);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playRepair() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(880, now + 0.16); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playNearMiss() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playLaneSwitch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.4);
    osc.frequency.linearRampToValueAtTime(45, now + 0.9);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 1.0);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.05);
  }

  // --- Cyber Synthwave Bass Pulse ---
  public startMusic() {
    if (this.isMuted || this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    let step = 0;
    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 55, 82.41]; // A1, C2, D2, E2 notes

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.isMusicPlaying) return;

      const now = this.ctx.currentTime;
      const freq = bassNotes[step % bassNotes.length];
      step++;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(260 + (step % 2 === 0 ? 140 : 0), now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.18);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    }, 220); // ~136 BPM 8th notes
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.musicOsc1) {
      try { this.musicOsc1.stop(); } catch {}
      this.musicOsc1 = null;
    }
  }

  public cleanup() {
    this.stopEngine();
    this.stopMusic();
  }
}

export const sound = new SoundManager();
