import React from 'react';
import { Crown, Flame, Shield, Sparkles } from 'lucide-react';
import { getColorSchemeTokens, getCosmeticMeta } from '../data/relicVault';

interface CosmeticUsernameProps {
  username: string;
  equippedLogo?: string | null;
  equippedTheme?: string | null;
  className?: string;
  showTag?: boolean;
}

export const CosmeticLogoBadge: React.FC<{ logoId?: string | null; compact?: boolean }> = ({
  logoId,
  compact = false,
}) => {
  const meta = getCosmeticMeta(logoId);
  if (!meta) return null;

  const sizeCls = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const wrapCls = compact ? 'px-1 py-0.5' : 'px-1.5 py-0.5';

  let iconEl: React.ReactNode = <Sparkles className={sizeCls} />;
  let colorCls = 'border-[#D5A64C]/50 bg-[#22160D]/90 text-[#FFE39A]';

  switch (meta.logoIcon) {
    case 'crown':
      iconEl = <Crown className={sizeCls} />;
      colorCls = 'border-amber-400/60 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(250,204,21,0.28)]';
      break;
    case 'sparkles':
      iconEl = <Sparkles className={sizeCls} />;
      colorCls = 'border-fuchsia-400/60 bg-fuchsia-950/70 text-fuchsia-200 shadow-[0_0_8px_rgba(244,114,182,0.3)]';
      break;
    case 'shield':
      iconEl = <Shield className={sizeCls} />;
      colorCls = 'border-sky-400/60 bg-sky-950/70 text-sky-200 shadow-[0_0_8px_rgba(56,189,248,0.28)]';
      break;
    case 'flame':
      iconEl = <Flame className={sizeCls} />;
      colorCls = 'border-rose-500/60 bg-rose-950/70 text-rose-300 shadow-[0_0_8px_rgba(255,23,41,0.3)]';
      break;
  }

  return (
    <span
      title={`${meta.titleHe} · ${meta.titleEn}`}
      className={`inline-flex items-center justify-center rounded border shrink-0 ${wrapCls} ${colorCls}`}
    >
      {iconEl}
    </span>
  );
};

export const CosmeticUsername: React.FC<CosmeticUsernameProps> = ({
  username,
  equippedLogo,
  equippedTheme,
  className = '',
  showTag = false,
}) => {
  const tokens = getColorSchemeTokens(equippedTheme);
  const themeMeta = getCosmeticMeta(equippedTheme);

  return (
    <span className={`inline-flex items-center gap-1 min-w-0 ${className}`}>
      <CosmeticLogoBadge logoId={equippedLogo} compact />
      <span className={`truncate ${tokens.textClass}`}>{username}</span>
      {showTag && themeMeta && (
        <span className="hidden sm:inline rounded border border-[#D5A64C]/35 bg-[#120D14]/85 px-1 py-0.2 text-[9px] font-bold text-[#FFE39A]">
          {themeMeta.previewTag}
        </span>
      )}
    </span>
  );
};
