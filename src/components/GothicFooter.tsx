import React from 'react';
import { ArrowUp, ChevronLeft, ChevronRight, Mail, MessageCircle, Send, Youtube } from 'lucide-react';
import { PORTAL_ASSETS } from '../data/portalData';
import { LanguageCode } from '../types';
import { GothicDivider, PortalImage } from './GothicDecor';

interface GothicFooterProps {
  lang: LanguageCode;
  onOpenInfoModal: (type: 'privacy' | 'terms' | 'about' | 'contact') => void;
  onQuickJump: (section: 'top' | 'forums' | 'marketplace') => void;
}

export const GothicFooter: React.FC<GothicFooterProps> = ({ lang, onOpenInfoModal, onQuickJump }) => {
  return (
    <footer className="relative z-10 mt-8 w-full overflow-hidden border-t border-[#D4A64A]/45 bg-gradient-to-b from-[#140B14]/95 via-[#0B060C]/98 to-[#050306] pt-8 pb-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(255, 20, 43, 0.14), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-[var(--portal-max-width,1640px)] px-4 sm:px-6">
        <GothicDivider withSkull className="mb-6" />

        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-5 sm:gap-10">
            <button
              type="button"
              onClick={() => onQuickJump('forums')}
              title={lang === 'he' ? 'מעבר מהיר לפורומים' : 'Jump to Forums'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4A64A]/55 bg-[#1A1018] text-[#FFE39A] shadow-[0_0_12px_rgba(212,166,74,0.28)] transition-all hover:bg-[#FF142B] hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => onQuickJump('top')}
              className="group flex flex-col items-center focus:outline-none cursor-pointer"
              aria-label="ChatFXP.com Home"
            >
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#D4A64A]/70 bg-[#070609] p-0.5 shadow-[0_0_22px_rgba(255,20,43,0.38)] transition-transform group-hover:scale-105">
                <PortalImage
                  src={PORTAL_ASSETS.crestEmblem}
                  alt="ChatFXP Crest"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <span dir="ltr" className="font-display text-3xl sm:text-4xl font-black tracking-wider gothic-metal-text">
                Chat<span className="text-[#FF142B]">FXP</span>
                <span className="text-lg font-gothic text-[#FFE39A]">.com</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onQuickJump('marketplace')}
              title={lang === 'he' ? 'מעבר מהיר למרקטפלייס' : 'Jump to Marketplace'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4A64A]/55 bg-[#1A1018] text-[#FFE39A] shadow-[0_0_12px_rgba(212,166,74,0.28)] transition-all hover:bg-[#FF142B] hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <p dir="ltr" className="mt-2 font-gothic text-[11px] tracking-[0.22em] uppercase text-[#A89BA8]">
            More Than a Forum... A Hidden Community
          </p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <a
              href="#youtube"
              onClick={(e) => {
                e.preventDefault();
                onOpenInfoModal('about');
              }}
              aria-label="YouTube"
              className="gothic-slate-btn flex h-10 w-10 items-center justify-center rounded-full text-[#F3EAF1] hover:text-[#FF142B] transition-all"
            >
              <Youtube className="w-4 h-4" />
            </a>
            <a
              href="#discord"
              onClick={(e) => {
                e.preventDefault();
                onOpenInfoModal('about');
              }}
              aria-label="Discord"
              className="gothic-slate-btn flex h-10 w-10 items-center justify-center rounded-full text-[#F3EAF1] hover:text-[#FF142B] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="#telegram"
              onClick={(e) => {
                e.preventDefault();
                onOpenInfoModal('about');
              }}
              aria-label="Telegram"
              className="gothic-slate-btn flex h-10 w-10 items-center justify-center rounded-full text-[#F3EAF1] hover:text-[#FF142B] transition-all"
            >
              <Send className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => onOpenInfoModal('contact')}
              aria-label="Email"
              className="gothic-slate-btn flex h-10 w-10 items-center justify-center rounded-full text-[#F3EAF1] hover:text-[#FF142B] transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#A89BA8]">
            <button
              type="button"
              onClick={() => onOpenInfoModal('privacy')}
              className="hover:text-[#FF142B] transition-colors cursor-pointer"
            >
              {lang === 'he' ? 'מדיניות פרטיות' : 'Privacy Policy'}
            </button>
            <span className="text-[#FF142B]/50" aria-hidden="true">
              ◆
            </span>
            <button
              type="button"
              onClick={() => onOpenInfoModal('terms')}
              className="hover:text-[#FF142B] transition-colors cursor-pointer"
            >
              {lang === 'he' ? 'תנאי שימוש' : 'Terms of Service'}
            </button>
            <span className="text-[#FF142B]/50" aria-hidden="true">
              ◆
            </span>
            <button
              type="button"
              onClick={() => onOpenInfoModal('about')}
              className="hover:text-[#FF142B] transition-colors cursor-pointer"
            >
              {lang === 'he' ? 'אודות הקהילה' : 'About Community'}
            </button>
            <span className="text-[#FF142B]/50" aria-hidden="true">
              ◆
            </span>
            <button
              type="button"
              onClick={() => onOpenInfoModal('contact')}
              className="hover:text-[#FF142B] transition-colors cursor-pointer"
            >
              {lang === 'he' ? 'צור קשר' : 'Contact Staff'}
            </button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-[11px] text-[#A89BA8]/80">
            <span>© 2026 ChatFXP.com · {lang === 'he' ? 'כל הזכויות שמורות' : 'All Rights Reserved'}</span>
            <button
              type="button"
              onClick={() => onQuickJump('top')}
              className="inline-flex items-center gap-1 rounded border border-[#FF142B]/35 bg-[#1A1018] px-2.5 py-1 text-[11px] text-[#F3EAF1] hover:border-[#FF142B] hover:text-[#FF142B] transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3 h-3" />
              <span>{lang === 'he' ? 'למעלה' : 'Back to Top'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
