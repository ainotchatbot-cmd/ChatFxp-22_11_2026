export type SoundProfile = 'silent' | 'dark' | 'castle' | 'supernatural' | 'cinematic';

export type AmbientMixerLayerId = 'wind' | 'whispers' | 'thunder' | 'embers';

export type AmbientMixerLayers = Record<AmbientMixerLayerId, number>;

export const DEFAULT_AMBIENT_LAYERS: AmbientMixerLayers = {
  wind: 0.65,
  whispers: 0.45,
  thunder: 0.5,
  embers: 0.45,
};

const STORAGE_MIXER_KEY = 'chatfxp_ambient_layers';

function clampUnit(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

class GothicSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private layerGains: Partial<Record<AmbientMixerLayerId, GainNode>> = {};
  private activeNodes: AudioNode[] = [];
  private activeTimers: number[] = [];
  private noiseBuffer: AudioBuffer | null = null;

  private enabled = false;
  private profile: SoundProfile = 'dark';
  private masterVolume = 0.55;
  private ambientVolume = 0.5;
  private effectsVolume = 0.7;
  private layerVolumes: AmbientMixerLayers = { ...DEFAULT_AMBIENT_LAYERS };

  constructor() {
    if (typeof window !== 'undefined') {
      const savedProfile = window.localStorage.getItem('chatfxp_sound_profile') as SoundProfile | null;
      if (savedProfile) this.profile = savedProfile;
      const savedMaster = window.localStorage.getItem('chatfxp_master_vol');
      if (savedMaster !== null) {
        const parsed = Number(savedMaster);
        if (Number.isFinite(parsed)) this.masterVolume = clampUnit(parsed);
      }
      const savedAmbient = window.localStorage.getItem('chatfxp_ambient_vol');
      if (savedAmbient !== null) {
        const parsed = Number(savedAmbient);
        if (Number.isFinite(parsed)) this.ambientVolume = clampUnit(parsed);
      }
      const savedLayers = window.localStorage.getItem(STORAGE_MIXER_KEY);
      if (savedLayers) {
        try {
          const parsed = JSON.parse(savedLayers) as Partial<AmbientMixerLayers>;
          this.layerVolumes = {
            wind: parsed.wind !== undefined ? clampUnit(Number(parsed.wind)) : DEFAULT_AMBIENT_LAYERS.wind,
            whispers:
              parsed.whispers !== undefined ? clampUnit(Number(parsed.whispers)) : DEFAULT_AMBIENT_LAYERS.whispers,
            thunder:
              parsed.thunder !== undefined ? clampUnit(Number(parsed.thunder)) : DEFAULT_AMBIENT_LAYERS.thunder,
            embers:
              parsed.embers !== undefined ? clampUnit(Number(parsed.embers)) : DEFAULT_AMBIENT_LAYERS.embers,
          };
        } catch {
          this.layerVolumes = { ...DEFAULT_AMBIENT_LAYERS };
        }
      }
    }
  }

  private persistLayers(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_MIXER_KEY, JSON.stringify(this.layerVolumes));
    } catch {
      // Ignore storage quota errors
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

  private getOrCreatePinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const durationSec = 4;
    const length = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Paul Kellet refined pink noise filter for warm organic wind & thunder beds
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private createLoopingNoise(ctx: AudioContext, offsetSec = 0): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = this.getOrCreatePinkNoiseBuffer(ctx);
    src.loop = true;
    src.start(0, offsetSec % 3.5);
    return src;
  }

  private stopAmbientNodes(): void {
    this.activeTimers.forEach((timerId) => {
      window.clearInterval(timerId);
    });
    this.activeTimers = [];

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
    this.layerGains = {};
  }

  private triggerThunderBurst(ctx: AudioContext, targetGain: GainNode, scale = 1): void {
    const noise = ctx.createBufferSource();
    noise.buffer = this.getOrCreatePinkNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(190, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(48, ctx.currentTime + 2.4);
    filter.Q.value = 1.2;

    const env = ctx.createGain();
    const peak = 0.55 * scale;
    env.gain.setValueAtTime(0.001, ctx.currentTime);
    env.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.16);
    env.gain.exponentialRampToValueAtTime(peak * 0.45, ctx.currentTime + 0.7);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.6);

    noise.connect(filter);
    filter.connect(env);
    env.connect(targetGain);

    noise.start();
    noise.stop(ctx.currentTime + 2.7);
  }

  private startProfileAmbient(ctx: AudioContext): void {
    this.stopAmbientNodes();
    if (!this.ambientGain || this.profile === 'silent' || !this.enabled) return;

    // 1. WIND LAYER: Slow sweeping cathedral night wind
    const windGain = ctx.createGain();
    windGain.gain.value = this.layerVolumes.wind * 0.45;
    windGain.connect(this.ambientGain);
    this.layerGains.wind = windGain;

    const windNoise = this.createLoopingNoise(ctx, 0.2);
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 260;
    windFilter.Q.value = 1.6;

    const windLfo = ctx.createOscillator();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.12;
    const windLfoDepth = ctx.createGain();
    windLfoDepth.gain.value = 135;
    windLfo.connect(windLfoDepth);
    windLfoDepth.connect(windFilter.frequency);

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windLfo.start();
    this.activeNodes.push(windGain, windNoise, windFilter, windLfo, windLfoDepth);

    // 2. WHISPERS LAYER: Airy spectral formant choir
    const whispersGain = ctx.createGain();
    whispersGain.gain.value = this.layerVolumes.whispers * 0.42;
    whispersGain.connect(this.ambientGain);
    this.layerGains.whispers = whispersGain;

    const whisperNoise = this.createLoopingNoise(ctx, 1.4);
    const formantA = ctx.createBiquadFilter();
    formantA.type = 'bandpass';
    formantA.frequency.value = 720;
    formantA.Q.value = 5.5;

    const formantB = ctx.createBiquadFilter();
    formantB.type = 'bandpass';
    formantB.frequency.value = 1520;
    formantB.Q.value = 6.2;

    const whisperBreathGain = ctx.createGain();
    whisperBreathGain.gain.value = 0.5;

    const whisperLfo = ctx.createOscillator();
    whisperLfo.type = 'sine';
    whisperLfo.frequency.value = 0.21;
    const whisperLfoDepth = ctx.createGain();
    whisperLfoDepth.gain.value = 0.35;
    whisperLfo.connect(whisperLfoDepth);
    whisperLfoDepth.connect(whisperBreathGain.gain);

    whisperNoise.connect(formantA);
    whisperNoise.connect(formantB);
    formantA.connect(whisperBreathGain);
    formantB.connect(whisperBreathGain);
    whisperBreathGain.connect(whispersGain);
    whisperLfo.start();
    this.activeNodes.push(
      whispersGain,
      whisperNoise,
      formantA,
      formantB,
      whisperBreathGain,
      whisperLfo,
      whisperLfoDepth
    );

    // 3. THUNDER LAYER: Continuous sub-rumble + organic periodic distant rolls
    const thunderGain = ctx.createGain();
    thunderGain.gain.value = this.layerVolumes.thunder * 0.55;
    thunderGain.connect(this.ambientGain);
    this.layerGains.thunder = thunderGain;

    const stormRumble = this.createLoopingNoise(ctx, 2.3);
    const stormFilter = ctx.createBiquadFilter();
    stormFilter.type = 'lowpass';
    stormFilter.frequency.value = 72;
    stormFilter.Q.value = 1.1;
    stormRumble.connect(stormFilter);
    stormFilter.connect(thunderGain);
    this.activeNodes.push(thunderGain, stormRumble, stormFilter);

    const stormTimer = window.setInterval(() => {
      if (!this.enabled || !this.ctx || !this.layerGains.thunder) return;
      if (this.layerVolumes.thunder > 0.08 && Math.random() < 0.65) {
        this.triggerThunderBurst(this.ctx, this.layerGains.thunder, 0.75 + Math.random() * 0.35);
      }
    }, 11500);
    this.activeTimers.push(stormTimer);

    // 4. EMBERS & CATHEDRAL DRONE LAYER: Warm hearth crackle + low harmonic chord
    const embersGain = ctx.createGain();
    embersGain.gain.value = this.layerVolumes.embers * 0.5;
    embersGain.connect(this.ambientGain);
    this.layerGains.embers = embersGain;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.profile === 'castle' ? 180 : this.profile === 'supernatural' ? 320 : 220;
    filter.Q.value = 1.8;
    filter.connect(embersGain);
    this.activeNodes.push(embersGain, filter);

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
      gain.gain.value = 0.24 / freqs.length;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      this.activeNodes.push(osc, gain);
    });

    const emberHiss = this.createLoopingNoise(ctx, 0.85);
    const emberHighpass = ctx.createBiquadFilter();
    emberHighpass.type = 'highpass';
    emberHighpass.frequency.value = 2400;
    const emberHissGain = ctx.createGain();
    emberHissGain.gain.value = 0.08;
    emberHiss.connect(emberHighpass);
    emberHighpass.connect(emberHissGain);
    emberHissGain.connect(embersGain);
    this.activeNodes.push(emberHiss, emberHighpass, emberHissGain);
  }

  public setEnabled(next: boolean): void {
    this.enabled = next;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (next) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume * 0.35, ctx.currentTime, 0.25);
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
    this.masterVolume = clampUnit(vol);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('chatfxp_master_vol', String(this.masterVolume));
    }
    if (this.ctx && this.masterGain && this.enabled) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume * 0.35, this.ctx.currentTime, 0.08);
    }
  }

  public setAmbientVolume(vol: number): void {
    this.ambientVolume = clampUnit(vol);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('chatfxp_ambient_vol', String(this.ambientVolume));
    }
    if (this.ctx && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume, this.ctx.currentTime, 0.08);
    }
  }

  public setLayerVolume(layer: AmbientMixerLayerId, vol: number): void {
    const clamped = clampUnit(vol);
    this.layerVolumes = { ...this.layerVolumes, [layer]: clamped };
    this.persistLayers();

    const gainScale: Record<AmbientMixerLayerId, number> = {
      wind: 0.45,
      whispers: 0.42,
      thunder: 0.55,
      embers: 0.5,
    };
    const gainNode = this.layerGains[layer];
    if (this.ctx && gainNode) {
      gainNode.gain.setTargetAtTime(clamped * gainScale[layer], this.ctx.currentTime, 0.08);
    }
  }

  public setLayerVolumes(next: Partial<AmbientMixerLayers>): void {
    (Object.keys(next) as AmbientMixerLayerId[]).forEach((layer) => {
      const val = next[layer];
      if (val !== undefined) {
        this.setLayerVolume(layer, val);
      }
    });
  }

  public getLayerVolumes(): AmbientMixerLayers {
    return { ...this.layerVolumes };
  }

  public auditionLayer(layer: AmbientMixerLayerId): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.enabled) return;

    const layerLevel = Math.max(0.25, this.layerVolumes[layer]);
    const gainScale = Math.max(0.05, this.masterVolume * Math.max(0.35, this.ambientVolume) * layerLevel);

    if (layer === 'thunder') {
      if (this.layerGains.thunder) {
        this.triggerThunderBurst(ctx, this.layerGains.thunder, 1.1);
      } else {
        const tmpGain = ctx.createGain();
        tmpGain.gain.value = gainScale * 0.5;
        tmpGain.connect(ctx.destination);
        this.triggerThunderBurst(ctx, tmpGain, 1.0);
      }
      return;
    }

    if (layer === 'wind') {
      const src = ctx.createBufferSource();
      src.buffer = this.getOrCreatePinkNoiseBuffer(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(190, ctx.currentTime);
      bp.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.55);
      bp.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 1.25);
      bp.Q.value = 1.8;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, ctx.currentTime);
      env.gain.linearRampToValueAtTime(gainScale * 0.35, ctx.currentTime + 0.25);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
      src.connect(bp);
      bp.connect(env);
      env.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + 1.35);
      return;
    }

    if (layer === 'whispers') {
      const src = ctx.createBufferSource();
      src.buffer = this.getOrCreatePinkNoiseBuffer(ctx);
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(760, ctx.currentTime);
      f1.Q.value = 6.5;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, ctx.currentTime);
      env.gain.linearRampToValueAtTime(gainScale * 0.42, ctx.currentTime + 0.2);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);
      src.connect(f1);
      f1.connect(env);
      env.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + 1.15);
      return;
    }

    // embers
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(82.41, ctx.currentTime + 0.75);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, ctx.currentTime);
    env.gain.linearRampToValueAtTime(gainScale * 0.22, ctx.currentTime + 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    osc.connect(env);
    env.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
  }

  public setEffectsVolume(vol: number): void {
    this.effectsVolume = clampUnit(vol);
  }

  public getState() {
    return {
      enabled: this.enabled,
      profile: this.profile,
      masterVolume: this.masterVolume,
      ambientVolume: this.ambientVolume,
      effectsVolume: this.effectsVolume,
      layerVolumes: { ...this.layerVolumes },
    };
  }

  public unlockContext(): void {
    this.ensureContext();
  }

  public playSubtleNotify(): void {
    if (this.profile === 'silent') return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainLevel = Math.max(0.012, this.masterVolume * this.effectsVolume * 0.065);

    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.linearRampToValueAtTime(gainLevel, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    playTone(587.33, 0, 0.16);
    playTone(880, 0.09, 0.22);
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

