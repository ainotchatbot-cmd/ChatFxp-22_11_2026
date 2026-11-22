export type SoundProfile = 'silent' | 'dark' | 'castle' | 'supernatural' | 'cinematic';

class GothicSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];

  private enabled = false;
  private profile: SoundProfile = 'dark';
  private masterVolume = 0.55;
  private ambientVolume = 0.5;
  private effectsVolume = 0.7;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedProfile = window.localStorage.getItem('chatfxp_sound_profile') as SoundProfile | null;
      if (savedProfile) this.profile = savedProfile;
      const savedMaster = window.localStorage.getItem('chatfxp_master_vol');
      if (savedMaster) this.masterVolume = Number(savedMaster) || 0.55;
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0;
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.ambientVolume;
      this.ambientGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private stopAmbientNodes(): void {
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // Already stopped
      }
    });
    this.activeNodes = [];
  }

  private startProfileAmbient(ctx: AudioContext): void {
    this.stopAmbientNodes();
    if (!this.ambientGain || this.profile === 'silent' || !this.enabled) return;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.profile === 'castle' ? 180 : this.profile === 'supernatural' ? 320 : 220;
    filter.Q.value = 1.8;
    filter.connect(this.ambientGain);
    this.activeNodes.push(filter);

    const freqs =
      this.profile === 'dark'
        ? [55, 82.41]
        : this.profile === 'castle'
        ? [48.99, 73.42]
        : this.profile === 'supernatural'
        ? [65.41, 98.0, 130.81]
        : [41.2, 61.74, 82.41];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.14 / freqs.length;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      this.activeNodes.push(osc, gain);
    });
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (next) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume * 0.22, ctx.currentTime, 0.25);
      this.startProfileAmbient(ctx);
      this.playEffect('chime');
    } else {
      this.masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      this.stopAmbientNodes();
    }
  }

  public setProfile(profile: SoundProfile): void {
    this.profile = profile;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('chatfxp_sound_profile', profile);
    }
    if (this.enabled && this.ctx) {
      this.startProfileAmbient(this.ctx);
    }
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('chatfxp_master_vol', String(this.masterVolume));
    }
    if (this.ctx && this.masterGain && this.enabled) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume * 0.22, this.ctx.currentTime, 0.08);
    }
  }

  public setAmbientVolume(vol: number): void {
    this.ambientVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.ctx.currentTime, 0.08);
    }
  }

  public setEffectsVolume(vol: number): void {
    this.effectsVolume = Math.max(0, Math.min(1, vol));
  }

  public getState() {
    return {
      enabled: this.enabled,
      profile: this.profile,
      masterVolume: this.masterVolume,
      ambientVolume: this.ambientVolume,
      effectsVolume: this.effectsVolume,
    };
  }

  public playClick(): void {
    this.playEffect('click');
  }

  public playEffect(kind: 'click' | 'chime' | 'bell' | 'achievement' | 'thunder'): void {
    if (!this.enabled || this.profile === 'silent') return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const peak = Math.max(0.01, this.masterVolume * this.effectsVolume * 0.12);

    if (kind === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.055);
      gain.gain.setValueAtTime(peak, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (kind === 'bell') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.24);
      gain.gain.setValueAtTime(peak, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.27);
    } else if (kind === 'achievement') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.09);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(peak, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (kind === 'thunder') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(75, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.55);
      gain.gain.setValueAtTime(peak * 1.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.58);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(peak, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    }
  }
}

export const soundEngine = new GothicSoundEngine();
