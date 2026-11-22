import React, { useMemo } from 'react';

interface GeometricSigilProps {
  handle: string;
  size?: number;
  variant?: 'amber' | 'cyan' | 'emerald';
  className?: string;
}

function hashHandle(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const GeometricSigil: React.FC<GeometricSigilProps> = ({
  handle,
  size = 40,
  variant = 'cyan',
  className = '',
}) => {
  const sigil = useMemo(() => {
    const seed = hashHandle(handle || 'Node_0000');
    const sides = 5 + (seed % 4); // 5..8 sided outer glyph
    const innerSides = 3 + ((seed >> 4) % 3); // 3..5 inner shard
    const rotOffset = ((seed >> 8) % 360) * (Math.PI / 180);

    const outerPts: string[] = [];
    const innerPts: string[] = [];
    const spokes: { x1: number; y1: number; x2: number; y2: number }[] = [];

    const cx = 32;
    const cy = 32;
    const rOuter = 23;
    const rInner = 11 + ((seed >> 12) % 5);

    for (let i = 0; i < sides; i++) {
      const a = rotOffset + (i * Math.PI * 2) / sides;
      const x = cx + Math.cos(a) * rOuter;
      const y = cy + Math.sin(a) * rOuter;
      outerPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      if ((seed >> (i % 8)) & 1) {
        spokes.push({ x1: cx, y1: cy, x2: Number(x.toFixed(1)), y2: Number(y.toFixed(1)) });
      }
    }

    for (let i = 0; i < innerSides; i++) {
      const a = -rotOffset + (i * Math.PI * 2) / innerSides;
      const x = cx + Math.cos(a) * rInner;
      const y = cy + Math.sin(a) * rInner;
      innerPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    // 4-bit symmetric corner nodes for cryptographic identicon look
    const nodes: { cx: number; cy: number }[] = [];
    for (let bit = 0; bit < 4; bit++) {
      if ((seed >> (16 + bit)) & 1) {
        const angle = (bit * Math.PI) / 2 + Math.PI / 4;
        nodes.push({
          cx: Number((cx + Math.cos(angle) * 26).toFixed(1)),
          cy: Number((cy + Math.sin(angle) * 26).toFixed(1)),
        });
      }
    }

    return {
      outerPoints: outerPts.join(' '),
      innerPoints: innerPts.join(' '),
      spokes,
      nodes,
      fingerprint: seed.toString(16).toUpperCase().padStart(8, '0'),
    };
  }, [handle]);

  const primaryStroke =
    variant === 'amber' ? '#F59E0B' : variant === 'emerald' ? '#34D399' : '#22D3EE';
  const secondaryStroke = variant === 'amber' ? '#22D3EE' : '#F59E0B';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`Cryptographic sigil for ${handle} (${sigil.fingerprint})`}
      className={`shrink-0 rounded-md border border-slate-700/80 bg-[#0A0A0C] ${className}`}
    >
      <rect x="2" y="2" width="60" height="60" rx="6" fill="#0A0A0C" stroke="#1E293B" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="27" fill="none" stroke={primaryStroke} strokeOpacity="0.18" strokeDasharray="3 3" />
      {sigil.spokes.map((sp, idx) => (
        <line
          key={idx}
          x1={sp.x1}
          y1={sp.y1}
          x2={sp.x2}
          y2={sp.y2}
          stroke={primaryStroke}
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />
      ))}
      <polygon
        points={sigil.outerPoints}
        fill={primaryStroke}
        fillOpacity="0.08"
        stroke={primaryStroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <polygon
        points={sigil.innerPoints}
        fill={secondaryStroke}
        fillOpacity="0.16"
        stroke={secondaryStroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3" fill={primaryStroke} />
      {sigil.nodes.map((n, idx) => (
        <circle key={idx} cx={n.cx} cy={n.cy} r="2" fill={secondaryStroke} />
      ))}
    </svg>
  );
};
