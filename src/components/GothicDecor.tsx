import React, { useState } from 'react';
import { FeatureCardItem } from '../types';

/**
 * Resilient image component that ensures zero broken images
 */
export const PortalImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}> = ({ src, alt, className = '', fallbackLabel }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1A1018] via-[#100B10] to-[#2A0A14] text-[#A99AA7] ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg className="w-8 h-8 text-[#FF1729]/60 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />
        </svg>
        {fallbackLabel && <span className="text-[11px] font-medium px-2 text-center">{fallbackLabel}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

/**
 * Ornate RPG forged bronze corner brackets with metallic rivets & ruby/gold filigree
 */
export const GothicCorners: React.FC<{ crimson?: boolean }> = ({ crimson = false }) => {
  const strokeColor = crimson ? 'rgba(213, 166, 76, 0.72)' : 'rgba(213, 166, 76, 0.52)';
  const accentColor = crimson ? '#FF1729' : '#FFE29A';

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]">
      {/* Top-Left */}
      <svg className="absolute top-0 left-0 w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M1 16V3C1 1.9 1.9 1 3 1H16" stroke={strokeColor} strokeWidth="1.8" />
        <path d="M4.5 10V4.5H10" stroke="#D5A64C" strokeWidth="1" strokeOpacity="0.65" />
        <circle cx="4.5" cy="4.5" r="1.5" fill={accentColor} />
        <circle cx="11.5" cy="2.6" r="0.9" fill="#D5A64C" fillOpacity="0.75" />
        <circle cx="2.6" cy="11.5" r="0.9" fill="#D5A64C" fillOpacity="0.75" />
      </svg>
      {/* Top-Right */}
      <svg className="absolute top-0 right-0 w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M23 16V3C23 1.9 22.1 1 21 1H8" stroke={strokeColor} strokeWidth="1.8" />
        <path d="M19.5 10V4.5H14" stroke="#D5A64C" strokeWidth="1" strokeOpacity="0.65" />
        <circle cx="19.5" cy="4.5" r="1.5" fill={accentColor} />
        <circle cx="12.5" cy="2.6" r="0.9" fill="#D5A64C" fillOpacity="0.75" />
        <circle cx="21.4" cy="11.5" r="0.9" fill="#D5A64C" fillOpacity="0.75" />
      </svg>
      {/* Bottom-Left */}
      <svg className="absolute bottom-0 left-0 w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M1 8V21C1 22.1 1.9 23 3 23H16" stroke={strokeColor} strokeWidth="1.8" />
        <path d="M4.5 14V19.5H10" stroke="#D5A64C" strokeWidth="1" strokeOpacity="0.65" />
        <circle cx="4.5" cy="19.5" r="1.5" fill={accentColor} />
      </svg>
      {/* Bottom-Right */}
      <svg className="absolute bottom-0 right-0 w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M23 8V21C23 22.1 22.1 23 21 23H8" stroke={strokeColor} strokeWidth="1.8" />
        <path d="M19.5 14V19.5H14" stroke="#D5A64C" strokeWidth="1" strokeOpacity="0.65" />
        <circle cx="19.5" cy="19.5" r="1.5" fill={accentColor} />
      </svg>
    </div>
  );
};

/**
 * Ornate forged-bronze horizontal divider with ruby gemstone & filigree crest
 */
export const GothicDivider: React.FC<{ withSkull?: boolean; className?: string }> = ({
  withSkull = false,
  className = '',
}) => (
  <div className={`flex items-center justify-center gap-3 select-none ${className}`} aria-hidden="true">
    <div className="h-px flex-1 bg-gradient-to-l from-[#D5A64C]/70 via-[#8B0015]/45 to-transparent" />
    <div className="flex items-center gap-2 rounded border border-[#D5A64C]/35 bg-[#120A10]/90 px-2.5 py-0.5 shadow-[inset_0_1px_0_rgba(255,226,154,0.18)]">
      <span className="h-1.5 w-1.5 rotate-45 bg-[#FF1729] shadow-[0_0_8px_#FF1729]" />
      {withSkull ? (
        <svg className="w-4 h-4 text-[#FFE29A]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C7.58 2 4 5.36 4 9.5c0 2.34 1.15 4.42 2.95 5.8-.08.73.17 1.49.72 2.02L8 17.65V20a1 1 0 0 0 1 1h1v-2h1v2h2v-2h1v2h1a1 1 0 0 0 1-1v-2.35l.33-.33c.55-.53.8-1.29.72-2.02C18.85 13.92 20 11.84 20 9.5 20 5.36 16.42 2 12 2zm-3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-[#D5A64C]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 6.2L21 10l-6.6 1.8L12 18l-2.4-6.2L3 10l6.6-1.8L12 2z" />
        </svg>
      )}
      <span className="h-1.5 w-1.5 rotate-45 bg-[#FF1729] shadow-[0_0_8px_#FF1729]" />
    </div>
    <div className="h-px flex-1 bg-gradient-to-r from-[#D5A64C]/70 via-[#8B0015]/45 to-transparent" />
  </div>
);

/**
 * Gold Crown SVG for ChatFXP_Admin
 */
export const GoldCrownIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 24" fill="none">
    <defs>
      <linearGradient id="goldCrownGrad" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFE29A" />
        <stop offset="50%" stopColor="#D5A64C" />
        <stop offset="100%" stopColor="#8B5E16" />
      </linearGradient>
    </defs>
    <path
      d="M3 19L1 6L9 12L16 3L23 12L31 6L29 19H3Z"
      fill="url(#goldCrownGrad)"
      stroke="#FFF0C2"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <rect x="4" y="20.5" width="24" height="2.5" rx="1" fill="url(#goldCrownGrad)" />
    <circle cx="16" cy="2.5" r="1.6" fill="#FF1729" />
    <circle cx="1" cy="5.5" r="1.3" fill="#FFE29A" />
    <circle cx="31" cy="5.5" r="1.3" fill="#FFE29A" />
  </svg>
);

/**
 * Custom metallic Gothic artwork for each of the 7 Feature Navigation Cards
 */
export const FeatureCardArt: React.FC<{ artKey: FeatureCardItem['artKey'] }> = ({ artKey }) => {
  switch (artKey) {
    case 'marketplace':
      return (
        <svg className="w-12 h-12 drop-shadow-[0_0_10px_rgba(255,23,41,0.45)]" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="cartMetal" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F0E8EF" />
              <stop offset="50%" stopColor="#9A90A3" />
              <stop offset="100%" stopColor="#4A3B52" />
            </linearGradient>
          </defs>
          <path d="M10 14h8l6 26h24l6-18H21" stroke="url(#cartMetal)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 27h24M25.5 33h21" stroke="#FF1729" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.8" />
          <circle cx="26" cy="48" r="4.5" fill="#1A1018" stroke="#FF1729" strokeWidth="2.5" />
          <circle cx="45" cy="48" r="4.5" fill="#1A1018" stroke="#FF1729" strokeWidth="2.5" />
          <path d="M33 17l3 3 5-6" stroke="#D5A64C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'arena':
      return (
        <svg className="w-12 h-12 drop-shadow-[0_0_14px_rgba(255,23,41,0.55)]" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="arenaShield" x1="16" y1="10" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF5A6A" />
              <stop offset="55%" stopColor="#C80B1D" />
              <stop offset="100%" stopColor="#5C000B" />
            </linearGradient>
          </defs>
          <path d="M8 20c6 1 10 4 12 9-5-1-9-2-12-9zM56 20c-6 1-10 4-12 9 5-1 9-2 12-9z" fill="#D5A64C" fillOpacity="0.85" />
          <path
            d="M32 10L48 17v14c0 11.5-6.8 19.6-16 23-9.2-3.4-16-11.5-16-23V17l16-7z"
            fill="url(#arenaShield)"
            stroke="#F0E8EF"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M32 18v26M23 26l9-4 9 4" stroke="#FFE29A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="32" cy="31" r="3" fill="#100B10" stroke="#FFE29A" strokeWidth="1.5" />
        </svg>
      );
    case 'family':
      return (
        <svg className="w-12 h-12 drop-shadow-[0_0_12px_rgba(74,163,255,0.45)]" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="babyBlue" x1="14" y1="14" x2="50" y2="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8FD0FF" />
              <stop offset="60%" stopColor="#3B9AE1" />
              <stop offset="100%" stopColor="#1B5583" />
            </linearGradient>
          </defs>
          <path d="M12 20h6l4 10" stroke="#B9B3C0" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M22 30h28c0 9-6.2 14-14 14s-14-5-14-14z" fill="url(#babyBlue)" stroke="#CBE9FF" strokeWidth="1.4" />
          <path d="M36 30V15c7.8 0 14 6.5 14 15H36z" fill="#2A7BB8" stroke="#CBE9FF" strokeWidth="1.4" />
          <circle cx="27" cy="50" r="4.5" fill="#100B10" stroke="#8FD0FF" strokeWidth="2.4" />
          <circle cx="45" cy="50" r="4.5" fill="#100B10" stroke="#8FD0FF" strokeWidth="2.4" />
        </svg>
      );
    case 'techcore':
      return (
        <svg className="w-12 h-12 drop-shadow-[0_0_14px_rgba(255,23,41,0.52)]" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="techHex" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#39203F" />
              <stop offset="55%" stopColor="#1A1018" />
              <stop offset="100%" stopColor="#0A060B" />
            </linearGradient>
            <linearGradient id="techCoreGlow" x1="24" y1="20" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6B78" />
              <stop offset="55%" stopColor="#FF1729" />
              <stop offset="100%" stopColor="#8B0015" />
            </linearGradient>
          </defs>
          <polygon
            points="32,8 52,19.5 52,44.5 32,56 12,44.5 12,19.5"
            fill="url(#techHex)"
            stroke="#D5A64C"
            strokeWidth="1.8"
          />
          <path
            d="M32 8v10M32 46v10M12 20l9 5M43 39l9 5M52 20l-9 5M21 39l-9 5"
            stroke="#B9B3C0"
            strokeWidth="1.6"
            strokeOpacity="0.65"
            strokeLinecap="round"
          />
          <polygon
            points="32,21 41,26.5 41,37.5 32,43 23,37.5 23,26.5"
            fill="url(#techCoreGlow)"
            stroke="#FFC2C8"
            strokeWidth="1.2"
          />
          <circle cx="32" cy="32" r="3" fill="#FFF0C2" />
        </svg>
      );
    case 'culture':
      return (
        <svg className="w-12 h-12 drop-shadow-[0_0_10px_rgba(213,166,76,0.4)]" viewBox="0 0 64 64" fill="none">
          <path
            d="M12 16c6-3 14-3 20 0v15c0 8-4.5 14-10 16-5.5-2-10-8-10-16V16z"
            fill="#241729"
            stroke="#D5A64C"
            strokeWidth="2"
          />
          <path d="M17 25c1.5-1.5 3.5-1.5 5 0M25 25c1.5-1.5 3.5-1.5 5 0" stroke="#F0E8EF" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M18 33c2.5 2.5 5.5 2.5 8 0" stroke="#D5A64C" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M32 22c6-3 14-3 20 0v15c0 8-4.5 14-10 16-5.5-2-10-8-10-16V22z"
            fill="#2D0C15"
            stroke="#FF1729"
            strokeWidth="2"
          />
          <circle cx="38" cy="30" r="1.4" fill="#F0E8EF" />
          <circle cx="46" cy="30" r="1.4" fill="#F0E8EF" />
          <path d="M38 40c2.5-2.2 5.5-2.2 8 0" stroke="#FF1729" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'askhub':
      return (
        <svg className="w-12 h-12 drop-shadow-[0_0_14px_rgba(255,23,41,0.55)]" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="askRed" x1="20" y1="10" x2="44" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF6B78" />
              <stop offset="55%" stopColor="#FF1729" />
              <stop offset="100%" stopColor="#7A0010" />
            </linearGradient>
          </defs>
          <path
            d="M22 23c0-6.2 4.6-10.5 10.8-10.5 6.4 0 10.7 4 10.7 9.6 0 4.3-2.3 6.9-6.2 9.2-2.7 1.6-3.6 3-3.6 6.2v1.5h-5.8v-2c0-4.8 1.6-7.3 5.3-9.5 2.7-1.6 4.1-3.1 4.1-5.4 0-2.6-2-4.4-4.8-4.4-2.9 0-4.8 1.9-5 5.3H22z"
            fill="url(#askRed)"
            stroke="#FFC2C8"
            strokeWidth="1"
          />
          <circle cx="30.8" cy="48.5" r="3.8" fill="url(#askRed)" stroke="#FFC2C8" strokeWidth="1" />
        </svg>
      );
    case 'fanbase':
      return (
        <svg className="w-12 h-12 drop-shadow-[0_0_14px_rgba(236,72,153,0.52)]" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="pridePrism" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF3B5C" />
              <stop offset="35%" stopColor="#FACC15" />
              <stop offset="70%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>
          <path
            d="M32 52C20 43.5 12 34.5 12 24.5C12 18 17 13 23 13C27 13 30.2 15.2 32 18.2C33.8 15.2 37 13 41 13C47 13 52 18 52 24.5C52 34.5 44 43.5 32 52Z"
            fill="#1D0E1F"
            stroke="url(#pridePrism)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M32 23l3 6 6.5.9-4.7 4.6 1.1 6.5-5.9-3.1-5.9 3.1 1.1-6.5-4.7-4.6 6.5-.9z" fill="#FFE29A" />
        </svg>
      );
    case 'guides':
      return (
        <svg className="w-12 h-12 drop-shadow-[0_0_10px_rgba(185,179,192,0.35)]" viewBox="0 0 64 64" fill="none">
          <rect x="14" y="18" width="28" height="34" rx="2.5" fill="#1A1018" stroke="#6E6677" strokeWidth="1.8" />
          <rect x="19" y="13" width="28" height="34" rx="2.5" fill="#231624" stroke="#B9B3C0" strokeWidth="1.8" />
          <rect x="24" y="8" width="28" height="34" rx="2.5" fill="#140D16" stroke="#F0E8EF" strokeWidth="1.8" />
          <path d="M30 17h16M30 23h16M30 29h11" stroke="#FF1729" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="45" cy="34" r="3" fill="#D5A64C" />
        </svg>
      );
  }
};
