import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { LanguageCode } from '../types';
import { useResponsiveContext } from '../utils/ResponsiveContext';

interface SwipeCarouselProps {
  lang: LanguageCode;
  /**
   * Optional explicit override. By default activates automatically whenever
   * viewport width is below 1024px (`isBelow1024`) or `isCompactViewport` if specified.
   */
  active?: boolean;
  /** Desktop grid classes when carousel directive is inactive (>= 1024px). */
  desktopClassName?: string;
  /** Slide card sizing class on mobile/tablet resolutions. */
  itemClassName?: string;
  labelHe?: string;
  labelEn?: string;
  children: React.ReactNode;
}

/**
 * SwipeCarousel Directive
 * Automatically activates on mobile & tablet resolutions (< 1024px width) to allow
 * smooth horizontal touch panning (`onTouchStart` / `onTouchMove` / `onTouchEnd`)
 * of dashboard content sections without excessive vertical crowding.
 */
export const SwipeCarousel: React.FC<SwipeCarouselProps> = ({
  lang,
  active,
  desktopClassName = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
  itemClassName = 'w-[84%] sm:w-[48%]',
  labelHe = 'החליקו אופקית לניווט נוח בין המדורים',
  labelEn = 'Swipe horizontally to pan sections',
  children,
}) => {
  const { isBelow1024 } = useResponsiveContext();
  const isCarouselActive = active ?? isBelow1024;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartScrollRef = useRef(0);
  const touchAxisLockedRef = useRef<'x' | 'y' | null>(null);

  const draggingRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const pointerStartScrollRef = useRef(0);
  const draggedDistanceRef = useRef(0);

  const items = React.Children.toArray(children).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;
    const first = track.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 12 : Math.max(240, track.clientWidth * 0.72);
    const offset = Math.abs(track.scrollLeft);
    const idx = Math.min(items.length - 1, Math.max(0, Math.round(offset / step)));
    setActiveIndex(idx);
  }, [items.length]);

  useEffect(() => {
    if (isCarouselActive) {
      syncActiveIndex();
    }
  }, [isCarouselActive, items.length, syncActiveIndex]);

  const stepCarousel = (dir: 'prev' | 'next') => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 12 : Math.max(260, track.clientWidth * 0.75);
    const sign = lang === 'he' ? -1 : 1;
    track.scrollBy({
      left: dir === 'next' ? sign * step : -sign * step,
      behavior: 'smooth',
    });
  };

  const scrollToSlide = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[idx] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  // Explicit touch event handlers for tactile horizontal panning on mobile & tablet (< 1024px)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const track = trackRef.current;
    if (!touch || !track) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartScrollRef.current = track.scrollLeft;
    touchAxisLockedRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const track = trackRef.current;
    if (!touch || !track) return;
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;
    if (!touchAxisLockedRef.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      touchAxisLockedRef.current = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }
    if (touchAxisLockedRef.current === 'x') {
      draggedDistanceRef.current = Math.abs(dx);
      track.scrollLeft = touchStartScrollRef.current - dx;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchAxisLockedRef.current === 'x') {
      const changed = e.changedTouches[0];
      if (changed) {
        const dx = changed.clientX - touchStartXRef.current;
        if (Math.abs(dx) > 48) {
          const isSwipingLeft = dx < 0;
          const nextDir =
            lang === 'he'
              ? isSwipingLeft
                ? 'next'
                : 'prev'
              : isSwipingLeft
              ? 'next'
              : 'prev';
          stepCarousel(nextDir);
        }
      }
    }
    touchAxisLockedRef.current = null;
    syncActiveIndex();
  };

  // Pointer drag fallback for tablet/desktop emulation
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const track = trackRef.current;
    if (!track) return;
    draggingRef.current = true;
    pointerStartXRef.current = e.clientX;
    pointerStartScrollRef.current = track.scrollLeft;
    draggedDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - pointerStartXRef.current;
    draggedDistanceRef.current = Math.abs(dx);
    track.scrollLeft = pointerStartScrollRef.current - dx;
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedDistanceRef.current > 12) {
      e.preventDefault();
      e.stopPropagation();
      draggedDistanceRef.current = 0;
    }
  };

  if (!isCarouselActive) {
    return <div className={desktopClassName}>{items}</div>;
  }

  return (
    <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#D5A64C] min-w-0">
          <Hand className="w-3.5 h-3.5 text-[#FF1729] shrink-0" />
          <span className="truncate">{lang === 'he' ? labelHe : labelEn}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => stepCarousel('prev')}
            aria-label={lang === 'he' ? 'הקודם' : 'Previous'}
            className="tri-hover-gold flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded border border-[#D5A64C]/40 bg-[#120C14]/90 text-[#FFE39A] cursor-pointer"
          >
            {lang === 'he' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span dir="ltr" className="px-1 font-mono text-[11px] font-bold text-[#B9B3C0] tabular-nums">
            {activeIndex + 1}/{Math.max(1, items.length)}
          </span>
          <button
            type="button"
            onClick={() => stepCarousel('next')}
            aria-label={lang === 'he' ? 'הבא' : 'Next'}
            className="tri-hover-gold flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded border border-[#D5A64C]/40 bg-[#120C14]/90 text-[#FFE39A] cursor-pointer"
          >
            {lang === 'he' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={syncActiveIndex}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClickCapture={handleClickCapture}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-1.5 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((child, idx) => (
          <div key={idx} className={`${itemClassName} shrink-0 snap-start`}>
            {child}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToSlide(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'w-5 bg-[#FF1729] shadow-[0_0_8px_rgba(255,23,41,0.65)]'
                  : 'w-1.5 bg-[#C5BAC7]/35 hover:bg-[#D5A64C]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
