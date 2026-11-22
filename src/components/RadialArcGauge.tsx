import React, { useId } from 'react';

interface RadialArcGaugeProps {
  value: number;
  max: number;
  label: string;
  sublabel?: string;
  centerText: string;
  variant: 'mana' | 'xp' | 'gold';
  size?: number;
  strokeWidth?: number;
}

export const RadialArcGauge: React.FC<RadialArcGaugeProps> = ({
  value,
  max,
  label,
  sublabel,
  centerText,
  variant,
  size = 64,
  strokeWidth = 5.5,
}) => {
  const gradId = useId();
  const safeMax = Math.max(1, max);
  const ratio = Math.max(0, Math.min(1, value / safeMax));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  const stops =
    variant === 'mana'
      ? { start: '#1d4ed8', mid: '#38bdf8', end: '#bae6fd', glow: 'rgba(56,189,248,0.55)', text: 'text-[#BAE6FD]' }
      : variant === 'xp'
      ? { start: '#970019', mid: '#FF1729', end: '#FFD166', glow: 'rgba(255,23,41,0.52)', text: 'text-[#FFD5DA]' }
      : { start: '#8a611b', mid: '#D5A64C', end: '#FFF1C2', glow: 'rgba(213,166,76,0.5)', text: 'text-[#FFE8A3]' };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={stops.start} />
              <stop offset="55%" stopColor={stops.mid} />
              <stop offset="100%" stopColor={stops.end} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(185, 179, 192, 0.14)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 6px ${stops.glow})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span dir="ltr" className="font-mono text-[11px] font-extrabold tabular-nums text-white">
            {centerText}
          </span>
        </div>
      </div>
      <span className={`mt-1 text-[10px] font-bold tracking-wide ${stops.text}`}>{label}</span>
      {sublabel && (
        <span dir="ltr" className="font-mono text-[9.5px] tabular-nums text-[#A99AA7]">
          {sublabel}
        </span>
      )}
    </div>
  );
};
