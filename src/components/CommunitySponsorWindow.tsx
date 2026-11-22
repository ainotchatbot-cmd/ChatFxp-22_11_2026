import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { COMMUNITY_SPONSOR_CATALOG } from '../data/portalData';
import { LanguageCode, NavSectionId } from '../types';
import { ShadowSanctumOverlay } from './ShadowSanctumOverlay';

interface CommunitySponsorWindowProps {
  lang: LanguageCode;
  communityKey: string;
  communityTitle?: string;
  adsensePublisherId?: string;
  adsenseEnabled?: boolean;
  adsenseSlotId?: string | null;
  onNavigateSection: (section: NavSectionId) => void;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const CommunitySponsorWindow: React.FC<CommunitySponsorWindowProps> = ({
  lang,
  communityKey,
  communityTitle,
  adsensePublisherId,
  adsenseEnabled = false,
  adsenseSlotId,
  onNavigateSection,
}) => {
  const [compact, setCompact] = useState(false);
  const [livePartnerReady, setLivePartnerReady] = useState(false);
  const slotContainerRef = useRef<HTMLDivElement | null>(null);

  const normalizedKey = communityKey.toLowerCase();
  const showcase =
    COMMUNITY_SPONSOR_CATALOG[normalizedKey] ??
    (normalizedKey.includes('tech') || normalizedKey.includes('ai')
      ? COMMUNITY_SPONSOR_CATALOG.techcore
      : normalizedKey.includes('gam') || normalizedKey.includes('arena') || normalizedKey.includes('pc')
      ? COMMUNITY_SPONSOR_CATALOG.gaming
      : normalizedKey.includes('cult') || normalizedKey.includes('buzz') || normalizedKey.includes('music')
      ? COMMUNITY_SPONSOR_CATALOG.culture
      : normalizedKey.includes('fam') || normalizedKey.includes('motor')
      ? COMMUNITY_SPONSOR_CATALOG.family
      : normalizedKey.includes('market')
      ? COMMUNITY_SPONSOR_CATALOG.marketplace
      : normalizedKey.includes('pride')
      ? COMMUNITY_SPONSOR_CATALOG.pride
      : COMMUNITY_SPONSOR_CATALOG.general);

  const validPubId =
    adsensePublisherId && /^ca-pub-\d{10,20}$/.test(adsensePublisherId.trim())
      ? adsensePublisherId.trim()
      : '';
  const validSlotId =
    adsenseSlotId && /^\d{6,20}$/.test(adsenseSlotId.trim()) ? adsenseSlotId.trim() : '';
  const canTryAdSense = Boolean(adsenseEnabled && validPubId && validSlotId);

  useEffect(() => {
    setLivePartnerReady(false);
    if (!canTryAdSense) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-chatfxp-publisher="${validPubId}"]`
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.chatfxpPublisher = validPubId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        validPubId
      )}`;
      script.onerror = () => setLivePartnerReady(false);
      document.head.appendChild(script);
    }

    const pushTimer = window.setTimeout(() => {
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        setLivePartnerReady(false);
      }
    }, 180);

    const checkTimer = window.setTimeout(() => {
      const ins = slotContainerRef.current?.querySelector('ins.adsbygoogle');
      if (ins && ins.getBoundingClientRect().height > 20 && ins.getAttribute('data-ad-status') !== 'unfilled') {
        setLivePartnerReady(true);
      } else {
        setLivePartnerReady(false);
      }
    }, 1600);

    return () => {
      window.clearTimeout(pushTimer);
      window.clearTimeout(checkTimer);
    };
  }, [canTryAdSense, validPubId, validSlotId]);

  const toneBorder =
    showcase.accentTone === 'pride'
      ? 'gothic-pride-border'
      : showcase.accentTone === 'cyan'
      ? 'border-[#38bdf8]/45'
      : showcase.accentTone === 'crimson'
      ? 'border-[#FF1729]/45'
      : 'border-[#D5A64C]/45';

  const toneGlow =
    showcase.accentTone === 'pride'
      ? 'from-[#2A1026]/92 via-[#150E1E]/95 to-[#0D1624]/92'
      : showcase.accentTone === 'cyan'
      ? 'from-[#0C1D30]/92 via-[#11131E]/95 to-[#0B0D14]/94'
      : showcase.accentTone === 'crimson'
      ? 'from-[#260D14]/92 via-[#140B12]/95 to-[#0B080D]/94'
      : 'from-[#241A10]/92 via-[#140E13]/95 to-[#0B080D]/94';

  return (
    <ShadowSanctumOverlay
      lang={lang}
      tone={showcase.accentTone}
      communityTitle={communityTitle}
      isAdSenseLive={Boolean(canTryAdSense && livePartnerReady)}
    >
      <section
        aria-label={lang === 'he' ? 'חלון שותפים וחסות קהילתי' : 'Community Explorer Showcase'}
        className={`relative overflow-hidden bg-gradient-to-br ${toneGlow}`}
      >
        {showcase.accentTone === 'pride' && <div className="gothic-pride-ribbon w-full" />}

      {/* Permanent Explorer Window Chrome (Protected & Non-Removable Frame) */}
      <div className="flex items-center justify-between gap-2 border-b border-[#D5A64C]/30 bg-[#0A070E]/85 px-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 items-center justify-center rounded border border-[#D5A64C]/45 bg-[#19111B]">
            <Compass className="w-3 h-3 text-[#FFE39A]" />
          </span>
          <span className="text-[11px] font-bold text-[#FFE39A] truncate">
            {lang === 'he' ? showcase.badgeHe : showcase.badgeEn}
          </span>
          {communityTitle && (
            <span className="hidden sm:inline text-[10px] text-[#B9B3C0] truncate">
              · {communityTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            title={
              lang === 'he'
                ? 'חלון שותפים קבוע ומוגן בפורטל (AdSense & Community Showcase)'
                : 'Protected Explorer Partner Window (AdSense & Fallback Ready)'
            }
            className="inline-flex items-center gap-1 rounded border border-emerald-500/35 bg-emerald-950/50 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-200"
          >
            <Lock className="w-2.5 h-2.5 text-emerald-400" />
            <span>{canTryAdSense && livePartnerReady ? 'AdSense Live' : 'Verified Frame'}</span>
          </span>
          <button
            type="button"
            onClick={() => setCompact((prev) => !prev)}
            title={compact ? (lang === 'he' ? 'הרחב חלון' : 'Expand') : lang === 'he' ? 'מזער לגובה קומפקטי' : 'Compact View'}
            className="flex h-5 w-5 items-center justify-center rounded border border-[#D5A64C]/35 bg-[#16101B] text-[#FFE39A] hover:border-[#FFE39A] cursor-pointer"
          >
            {compact ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Live Google AdSense Mount (Shown inside protected Explorer window when live & unfilled fallback hidden) */}
      {canTryAdSense && !compact && (
        <div ref={slotContainerRef} className={livePartnerReady ? 'p-3' : 'h-0 overflow-hidden opacity-0'}>
          <ins
            className="adsbygoogle block w-full min-h-[90px]"
            style={{ display: 'block' }}
            data-ad-client={validPubId}
            data-ad-slot={validSlotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      )}

      {/* First-Party Context-Matched Showcase (Seamless if AdSense is unconfigured, blocked, or offline) */}
      {(!canTryAdSense || !livePartnerReady) && (
        <div className={`px-3.5 ${compact ? 'py-2' : 'py-3'} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFE39A] shrink-0" />
              <h4
                className={`text-xs sm:text-sm font-extrabold ${
                  showcase.accentTone === 'pride' ? 'gothic-pride-text' : 'text-white'
                }`}
              >
                {lang === 'he' ? showcase.headlineHe : showcase.headlineEn}
              </h4>
            </div>
            {!compact && (
              <p className="mt-1 text-[11px] sm:text-xs text-[#C8BDCB] leading-relaxed">
                {lang === 'he' ? showcase.descriptionHe : showcase.descriptionEn}
              </p>
            )}
            {!compact && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {showcase.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-[#D5A64C]/30 bg-[#0D0912]/80 px-2 py-0.5 text-[10px] font-semibold text-[#FFE39A]"
                  >
                    #{tag}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 text-[10px] text-[#A99AA7]">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>
                    {lang === 'he' ? 'תצוגה מותאמת לקהילה' : 'Community-matched slot'}
                  </span>
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateSection(showcase.targetSection)}
            className="tri-hover-gold shrink-0 inline-flex items-center justify-center gap-1.5 rounded border border-[#D5A64C]/65 bg-gradient-to-b from-[#332110] to-[#1A1008] px-3.5 py-2 text-xs font-bold text-[#FFE39A] whitespace-nowrap cursor-pointer"
          >
            <span>{lang === 'he' ? showcase.ctaHe : showcase.ctaEn}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      </section>
    </ShadowSanctumOverlay>
  );
};
