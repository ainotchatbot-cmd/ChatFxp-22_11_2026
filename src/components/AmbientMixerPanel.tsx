import React, { useRef } from 'react';
import {
  CloudLightning,
  Flame,
  Ghost,
  Play,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import type { LanguageCode } from '../types';
import {
  AmbientMixerLayerId,
  AmbientMixerLayers,
  DEFAULT_AMBIENT_LAYERS,
} from '../utils/soundEngine';

interface AmbientMixerPanelProps {
  lang: LanguageCode;
  soundEnabled: boolean;
  masterVolume: number;
  ambientVolume: number;
  layers: AmbientMixerLayers;
  onToggleSound: () => void;
  onMasterVolumeChange: (v: number) => void;
  onAmbientVolumeChange: (v: number) => void;
  onLayerVolumeChange: (layer: AmbientMixerLayerId, v: number) => void;
  onApplyPreset: (layers: AmbientMixerLayers) => void;
  onAuditionLayer: (layer: AmbientMixerLayerId) => void;
}

interface LayerDescriptor {
  id: AmbientMixerLayerId;
  labelHe: string;
  labelEn: string;
  descHe: string;
  descEn: string;
  accentHex: string;
  icon: React.ComponentType<{ className?: string }>;
}

const LAYER_CHANNELS: LayerDescriptor[] = [
  {
    id: 'wind',
    labelHe: 'רוח לילית במגדל',
    labelEn: 'Cathedral Wind',
    descHe: 'משבי רוח מסוננים בגובה הצריחים',
    descEn: 'Slow-sweeping filtered spire gusts',
    accentHex: '#38BDF8',
    icon: Wind,
  },
  {
    id: 'whispers',
    labelHe: 'לחישות הצללים',
    labelEn: 'Crypt Whispers',
    descHe: 'תהודה אוורירית ועדינה ממסדרונות הסתר',
    descEn: 'Airy spectral formant resonance',
    accentHex: '#C084FC',
    icon: Ghost,
  },
  {
    id: 'thunder',
    labelHe: 'רעמים רחוקים',
    labelEn: 'Distant Thunder',
    descHe: 'נהמת סופה נמוכה והבזקי רעם מחזוריים',
    descEn: 'Low storm rumble & periodic rolls',
    accentHex: '#FF142B',
    icon: CloudLightning,
  },
  {
    id: 'embers',
    labelHe: 'גחלים ואח בוערת',
    labelEn: 'Hearth & Drone',
    descHe: 'הרמוניית בס חמימה ורחש גחלים עדין',
    descEn: 'Warm cathedral chord & ember crackle',
    accentHex: '#D4A64A',
    icon: Flame,
  },
];

const MIXER_PRESETS: {
  id: string;
  labelHe: string;
  labelEn: string;
  values: AmbientMixerLayers;
}[] = [
  {
    id: 'storm',
    labelHe: 'סערת חצות',
    labelEn: 'Midnight Storm',
    values: { wind: 0.85, whispers: 0.3, thunder: 0.9, embers: 0.35 },
  },
  {
    id: 'whispers',
    labelHe: 'מסדרון הלחישות',
    labelEn: 'Whispering Crypt',
    values: { wind: 0.35, whispers: 0.88, thunder: 0.15, embers: 0.5 },
  },
  {
    id: 'hearth',
    labelHe: 'אח ההיכל',
    labelEn: 'Sanctum Hearth',
    values: { wind: 0.2, whispers: 0.12, thunder: 0.1, embers: 0.9 },
  },
  {
    id: 'mute-layers',
    labelHe: 'השתק שכבות',
    labelEn: 'Mute Layers',
    values: { wind: 0, whispers: 0, thunder: 0, embers: 0 },
  },
];

export const AmbientMixerPanel: React.FC<AmbientMixerPanelProps> = ({
  lang,
  soundEnabled,
  masterVolume,
  ambientVolume,
  layers,
  onToggleSound,
  onMasterVolumeChange,
  onAmbientVolumeChange,
  onLayerVolumeChange,
  onApplyPreset,
  onAuditionLayer,
}) => {
  const isHe = lang === 'he';
  const lastNonZeroRef = useRef<AmbientMixerLayers>({ ...DEFAULT_AMBIENT_LAYERS });

  const handleToggleLayerMute = (id: AmbientMixerLayerId) => {
    const current = layers[id] ?? 0;
    if (current > 0.01) {
      lastNonZeroRef.current[id] = current;
      onLayerVolumeChange(id, 0);
    } else {
      onLayerVolumeChange(id, lastNonZeroRef.current[id] > 0.05 ? lastNonZeroRef.current[id] : 0.55);
    }
  };

  return (
    <div className="rounded-md border border-[#D4A64A]/35 bg-[#0A070D] p-4 flex flex-col gap-3.5">
      {/* Mixer Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-[#FFE39A] flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#D4A64A] shrink-0" />
            <span>{isHe ? 'מיקסר אווירה רב-שכבתי (Ambient Mixer)' : 'Ambient Audio Layer Mixer'}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#A89BA8]">
            {isHe
              ? 'שליטה נפרדת בעוצמת הרוח, הלחישות, הרעמים והגחלים בזמן אמת'
              : 'Independently balance wind, whispers, thunder & ember layers in real time'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onApplyPreset({ ...DEFAULT_AMBIENT_LAYERS })}
            className="flex items-center gap-1 rounded border border-[#C5BAC7]/25 bg-[#120B13] px-2.5 py-1.5 text-[11px] font-semibold text-[#C5BAC7] hover:border-[#D4A64A]/50 hover:text-white cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isHe ? 'איפוס' : 'Reset'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
              soundEnabled
                ? 'bg-[#FF142B] text-white shadow-[0_0_12px_rgba(255,20,43,0.35)]'
                : 'border border-[#D4A64A]/45 bg-[#19110D] text-[#FFE39A] hover:bg-[#2A1B12]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>
              {soundEnabled
                ? isHe
                  ? 'שמע פעיל'
                  : 'Audio On'
                : isHe
                ? 'הפעל שמע'
                : 'Enable Audio'}
            </span>
          </button>
        </div>
      </div>

      {/* Scene Presets Strip */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-[#A89BA8] me-1">
          {isHe ? 'פרופילים:' : 'Presets:'}
        </span>
        {MIXER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApplyPreset({ ...preset.values })}
            className="rounded border border-[#C5BAC7]/20 bg-[#120B13] px-2.5 py-1 text-[11px] font-semibold text-[#E8DCE8] hover:border-[#D4A64A]/60 hover:text-[#FFE39A] cursor-pointer whitespace-nowrap transition-colors"
          >
            {isHe ? preset.labelHe : preset.labelEn}
          </button>
        ))}
      </div>

      {/* Independent Atmospheric Layer Sliders */}
      <div className="grid grid-cols-1 gap-2.5">
        {LAYER_CHANNELS.map((ch) => {
          const Icon = ch.icon;
          const level = layers[ch.id] ?? 0;
          const pct = Math.round(level * 100);
          const isMuted = pct === 0;

          return (
            <div
              key={ch.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded border border-[#C5BAC7]/15 bg-[#120B13] px-3 py-2.5"
            >
              {/* Layer Label & Mute Toggle */}
              <div className="flex items-center gap-2.5 sm:w-52 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleLayerMute(ch.id)}
                  aria-label={
                    isMuted
                      ? `${isHe ? 'הפעל שכבת' : 'Unmute'} ${isHe ? ch.labelHe : ch.labelEn}`
                      : `${isHe ? 'השתק שכבת' : 'Mute'} ${isHe ? ch.labelHe : ch.labelEn}`
                  }
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer ${
                    isMuted
                      ? 'border-[#C5BAC7]/20 bg-[#0A070D] text-[#6E6270]'
                      : 'border-[#D4A64A]/45 bg-[#0A070D] text-white'
                  }`}
                  style={!isMuted ? { color: ch.accentHex, borderColor: `${ch.accentHex}66` } : undefined}
                >
                  <Icon className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#F3EAF1] truncate">
                    {isHe ? ch.labelHe : ch.labelEn}
                  </p>
                  <p className="text-[10.5px] text-[#A89BA8] truncate">
                    {isHe ? ch.descHe : ch.descEn}
                  </p>
                </div>
              </div>

              {/* Range Slider */}
              <div className="flex flex-1 items-center gap-2.5 min-w-0" dir="ltr">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={pct}
                  aria-label={`${isHe ? ch.labelHe : ch.labelEn} volume`}
                  onChange={(e) => {
                    const nextVal = Number(e.target.value) / 100;
                    if (nextVal > 0.01) lastNonZeroRef.current[ch.id] = nextVal;
                    onLayerVolumeChange(ch.id, nextVal);
                  }}
                  style={{
                    background: `linear-gradient(to right, ${ch.accentHex} 0%, ${ch.accentHex} ${pct}%, #231927 ${pct}%, #231927 100%)`,
                  }}
                  className="h-1.5 flex-1 appearance-none rounded-full cursor-pointer accent-[#FFE39A]"
                />
                <span className="w-10 text-end font-mono text-xs font-bold tabular-nums text-[#FFE39A] shrink-0">
                  {pct}%
                </span>
              </div>

              {/* Audition / Preview Button */}
              <button
                type="button"
                onClick={() => onAuditionLayer(ch.id)}
                className="flex items-center justify-center gap-1 rounded border border-[#C5BAC7]/20 bg-[#0A070D] px-2.5 py-1 text-[11px] font-semibold text-[#C5BAC7] hover:border-[#D4A64A] hover:text-[#FFE39A] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-3 h-3" />
                <span>{isHe ? 'השמע' : 'Test'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Master & Ambient Bus Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-[#C5BAC7]/15 pt-3">
        <div className="flex items-center gap-2.5 rounded border border-[#C5BAC7]/15 bg-[#0E0911] px-3 py-2">
          <span className="text-[11px] font-bold text-[#F3EAF1] whitespace-nowrap">
            {isHe ? 'עוצמה ראשית' : 'Master Vol'}
          </span>
          <div className="flex flex-1 items-center gap-2" dir="ltr">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(masterVolume * 100)}
              aria-label="Master volume"
              onChange={(e) => onMasterVolumeChange(Number(e.target.value) / 100)}
              className="h-1.5 flex-1 accent-[#FF142B] cursor-pointer"
            />
            <span className="w-9 text-end font-mono text-[11px] font-bold tabular-nums text-[#C5BAC7]">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded border border-[#C5BAC7]/15 bg-[#0E0911] px-3 py-2">
          <span className="text-[11px] font-bold text-[#F3EAF1] whitespace-nowrap">
            {isHe ? 'אפיק אווירה' : 'Ambient Bus'}
          </span>
          <div className="flex flex-1 items-center gap-2" dir="ltr">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(ambientVolume * 100)}
              aria-label="Ambient bus volume"
              onChange={(e) => onAmbientVolumeChange(Number(e.target.value) / 100)}
              className="h-1.5 flex-1 accent-[#D4A64A] cursor-pointer"
            />
            <span className="w-9 text-end font-mono text-[11px] font-bold tabular-nums text-[#C5BAC7]">
              {Math.round(ambientVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {!soundEnabled && (
        <p className="text-[11px] text-[#A89BA8]">
          {isHe
            ? 'השינויים נשמרים אוטומטית. לחצו על "הפעל שמע" או על "השמע" כדי לשמוע את שכבות האווירה.'
            : 'Mix levels save automatically. Click "Enable Audio" or "Test" on any layer to hear your mix.'}
        </p>
      )}
    </div>
  );
};
