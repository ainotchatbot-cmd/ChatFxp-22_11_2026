import React from 'react';
import { Sparkles } from 'lucide-react';
import { LanguageCode } from '../types';
import { PORTAL_ASSETS } from '../data/portalData';
import { getCosmeticMeta } from '../data/relicVault';
import { PortalImage } from './GothicDecor';

interface HeroHeaderProps {
  lang: LanguageCode;
  equippedBanner?: string | null;
  onSelectHome: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ lang, equippedBanner, onSelectHome }) => {
  const bannerOverlayMeta = getCosmeticMeta(equippedBanner);

  return (
    <header className="relative w-full overflow-hidden border-b border-[#D4A64A]/55 bg-[#070609]">
      {/* Panoramic Dark-Fantasy Citadel Gatehouse under the Crimson Blood Moon */}
      <button
        type="button"
        onClick={onSelectHome}
        aria-label="ChatFXP.com Home"
        className="group relative block h-[280px] sm:h-[370px] lg:h-[450px] xl:h-[490px] w-full text-start focus:outline-none cursor-pointer"
      >
        <PortalImage
          src={PORTAL_ASSETS.heroBg}
          alt="ChatFXP.com — Hooded Warrior, Gothic Sorceress & Fit Bodybuilder Wizard Guardians"
          className="h-full w-full object-cover object-[50%_18%] transition-transform duration-700 group-hover:scale-[1.012]"
        />

        {/* Redeemed Site-Wide Super Banner Atmospheric Overlay */}
        {bannerOverlayMeta?.bannerUrl && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <img
              src={bannerOverlayMeta.bannerUrl}
              alt={bannerOverlayMeta.titleEn}
              className="h-full w-full object-cover opacity-35 mix-blend-screen"
            />
            <div
              className="absolute top-3 end-3 flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase bg-[#070609]/85 backdrop-blur-md"
              style={{ borderColor: bannerOverlayMeta.accentHex, color: bannerOverlayMeta.accentHex }}
            >
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'he' ? bannerOverlayMeta.titleHe : bannerOverlayMeta.titleEn}</span>
            </div>
          </div>
        )}

        {/* Atmospheric edge scrims keeping warrior, sorceress, hobbit wizard, and blood moon crisp */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(7,6,9,0.22) 0%, rgba(7,6,9,0.02) 38%, rgba(7,6,9,0.24) 72%, rgba(7,6,9,0.94) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 88% 88% at 50% 42%, transparent 56%, rgba(7,6,9,0.58) 100%)',
          }}
        />

        {/* Centered Sanctum Crest Medallion & ChatFXP.com Wordmark Lockup */}
        <div className="absolute inset-x-0 bottom-2.5 sm:bottom-4 z-10 flex flex-col items-center justify-center px-4 text-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span
              className="hidden sm:block h-px w-14 md:w-24 bg-gradient-to-r from-transparent via-[#D4A64A]/80 to-[#D4A64A]"
              aria-hidden="true"
            />
            <div className="relative flex h-12 w-12 sm:h-15 sm:w-15 items-center justify-center rounded-full border-2 border-[#D4A64A]/90 bg-[#070609]/95 p-0.5 shadow-[0_0_26px_rgba(255,20,43,0.48),0_0_14px_rgba(212,166,74,0.45)]">
              <PortalImage
                src={PORTAL_ASSETS.crestEmblem}
                alt="ChatFXP Trio Sanctum Crest"
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <span
              className="hidden sm:block h-px w-14 md:w-24 bg-gradient-to-l from-transparent via-[#D4A64A]/80 to-[#D4A64A]"
              aria-hidden="true"
            />
          </div>

          <div dir="ltr" className="mt-1.5 flex items-baseline justify-center">
            <span className="font-display text-2xl sm:text-4xl font-black tracking-wider gothic-metal-text">
              Chat<span className="text-[#FF1729]">FXP</span>
            </span>
            <span className="font-gothic text-sm sm:text-lg font-bold text-[#FFE39A] drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              .com
            </span>
          </div>

          <p
            dir="ltr"
            className="mt-0.5 font-gothic text-[10px] sm:text-xs tracking-[0.26em] uppercase text-[#F3EAF1] drop-shadow-[0_2px_10px_rgba(0,0,0,0.98)]"
          >
            More Than a Forum<span className="text-[#FF1729]">...</span> A Hidden Community
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs font-semibold text-[#FFE39A] drop-shadow-[0_2px_8px_rgba(0,0,0,0.98)]">
            {lang === 'he'
              ? 'היכל ChatFXP — הקהילה הישראלית המסתורית'
              : 'ChatFXP Sanctum — The Hidden Fantasy Community'}
          </p>
        </div>
      </button>

      {/* Bottom Hammered Bronze & Crimson Rune Border */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#593E17] via-[#D4A64A] via-[#FF142B] via-[#D4A64A] to-[#593E17] shadow-[0_0_16px_rgba(255,20,43,0.7)]" />
    </header>
  );
};
