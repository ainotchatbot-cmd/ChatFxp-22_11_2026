import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { LanguageCode } from '../types';

interface FingerSwipeCarouselProps {
  lang: LanguageCode;
  /** When false (full desktop), renders `desktopClassName` grid cleanly without carousel chrome. */
  active: boolean;
  desktopClassName?: string;
  /** Tailwind width/basis classes applied to each slide wrapper in carousel mode. */
  itemClassName?: string;
  labelHe?: string;
  labelEn?: string;
  children: React.ReactNode;
}

/**
 * FingerSwipeCarousel
 * Converts dense multi-column grids into a bidirectional RTL/LTR finger-swipe carousel
 * on tablet horizontal, tablet portrait, mobile, or resized compact viewports.
 */
export const FingerSwipeCarousel: React.FC<FingerSwipeCarouselProps> = ({
  lang,
  active,
  desktopClassName = 'grid grid-cols-1 md:grid-cols-2 gap-3',
  itemClassName = 'w-[80%] sm:w-[48%] md:w-[44%]',
  labelHe = 'החליקו ימינה ושמאלה לעיון נוח',
  labelEn = 'Swipe left or right to browse',
  children,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const draggedDistanceRef = useRef(0);

  const items = React.Children.toArray(children).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndexFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || items.length === 0) return;
    const firstChild = track.firstElementChild as HTMLElement | null;
    const stepWidth = firstChild ? firstChild.offsetWidth + 12 : Math.max(240, track.clientWidth * 0.65);
    const rawOffset = Math.abs(track.scrollLeft);
    const idx = Math.min(items.length - 1, Math.max(0, Math.round(rawOffset / stepWidth)));
    setActiveIndex(idx);
  }, [items.length]);

  useEffect(() => {
    if (!active) return;
    updateActiveIndexFromScroll();
  }, [active, items.length, updateActiveIndexFromScroll]);

  const stepCarousel = (direction: 'prev' | 'next') => {
    const track = trackRef.current;
    if (!track) return;
    const firstChild = track.firstElementChild as HTMLElement | null;
    const stepWidth = firstChild ? firstChild.offsetWidth + 12 : Math.max(260, track.clientWidth * 0.7);
    // In RTL, next advances visually towards the left (negative scrollLeft in modern browsers),
    // while in LTR, next advances positively toward the right.
    const sign = lang === 'he' ? -1 : 1;
    const delta = direction === 'next' ? sign * stepWidth : -sign * stepWidth;
    track.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const scrollToSlide = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const targetChild = track.children[idx] as HTMLElement | undefined;
    if (targetChild) {
      targetChild.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  // Pointer drag support for desktop mouse resizing & touchpads in addition to native finger touch swipe
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return; // Native touch momentum scroll handles finger swipes smoothly
    const track = trackRef.current;
    if (!track) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = track.scrollLeft;
    draggedDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - startXRef.current;
    draggedDistanceRef.current = Math.abs(dx);
    track.scrollLeft = startScrollLeftRef.current - dx;
  };

  const handlePointerUpOrLeave = () => {
    draggingRef.current = false;
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedDistanceRef.current > 10) {
      e.preventDefault();
      e.stopPropagation();
      draggedDistanceRef.current = 0;
    }
  };

  if (!active) {
    return <div className={desktopClassName}>{items}</div>;
  }

  return (
    <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="flex flex-col gap-2">
      {/* Compact Swipe Header & Directional Controls */}
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

      {/* Bidirectional RTL/LTR Touch-Swipe Track */}
      <div
        ref={trackRef}
        onScroll={updateActiveIndexFromScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
        onPointerLeave={handlePointerUpOrLeave}
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

      {/* Slide Progress Dots */}
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
