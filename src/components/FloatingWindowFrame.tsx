import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, Eye, EyeOff, GripHorizontal, Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { LanguageCode } from '../types';
import { GothicCorners } from './GothicDecor';

export type FloatingWindowId = 'portal' | 'quests' | 'admin' | 'vault';

interface FloatingWindowFrameProps {
  id: FloatingWindowId;
  open: boolean;
  minimized: boolean;
  zIndex: number;
  lang: LanguageCode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'gold' | 'ruby' | 'cyan';
  maxWidthClass?: string;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

export const FloatingWindowFrame: React.FC<FloatingWindowFrameProps> = ({
  id,
  open,
  minimized,
  zIndex,
  lang,
  title,
  subtitle,
  icon,
  accent = 'gold',
  maxWidthClass = 'max-w-3xl',
  onFocus,
  onMinimize,
  onClose,
  children,
}) => {
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [glassEnabled, setGlassEnabled] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [closing, setClosing] = useState(false);

  const windowRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const handleRequestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 145);
  }, [onClose]);

  useEffect(() => {
    if (!open || minimized) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, minimized, handleRequestClose]);

  useEffect(() => {
    if (!open) {
      setClosing(false);
    }
  }, [open]);

  const clampOffset = useCallback((nextX: number, nextY: number) => {
    const el = windowRef.current;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const w = el?.offsetWidth ?? 680;
    const h = el?.offsetHeight ?? 520;

    const maxHorizontal = Math.max(32, (vw - w) / 2 + Math.min(w * 0.45, 220));
    const minVertical = -(vh - h) / 2 + 86;
    const maxVertical = (vh - h) / 2 - 64;

    return {
      x: Math.max(-maxHorizontal, Math.min(maxHorizontal, nextX)),
      y: Math.max(Math.min(minVertical, -20), Math.min(Math.max(maxVertical, 20), nextY)),
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.pointerX;
      const dy = e.clientY - dragStartRef.current.pointerY;
      setOffset(clampOffset(dragStartRef.current.originX + dx, dragStartRef.current.originY + dy));
    };

    const handlePointerUp = () => {
      dragStartRef.current = null;
      setDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragging, clampOffset]);

  if (!open || minimized) return null;

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    onFocus();
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setDragging(true);
  };

  const accentBorder =
    accent === 'cyan'
      ? 'border-[#38bdf8]/45'
      : accent === 'ruby'
      ? 'border-[#FF1729]/45'
      : 'border-[#D5A64C]/50';

  const accentGlow =
    accent === 'cyan'
      ? 'shadow-[0_0_24px_rgba(56,189,248,0.16)]'
      : accent === 'ruby'
      ? 'shadow-[0_0_24px_rgba(255,23,41,0.18)]'
      : 'shadow-[0_0_24px_rgba(213,166,76,0.16)]';

  return (
    <div
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      style={{ zIndex }}
      className="pointer-events-none fixed inset-0 flex items-center justify-center p-2.5 sm:p-5"
      data-window-id={id}
    >
      {/* Mobile touch backdrop */}
      <div
        onClick={handleRequestClose}
        className="pointer-events-auto fixed inset-0 bg-black/75 backdrop-blur-sm md:hidden"
        aria-hidden="true"
      />

      <div
        ref={windowRef}
        role="dialog"
        aria-modal="false"
        aria-label={title}
        onMouseDown={onFocus}
        style={{
          transform: isMaximized ? 'translate3d(0px, 0px, 0)' : `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
        className={`pointer-events-auto relative flex w-full ${
          isMaximized ? 'max-w-[96vw] h-[88vh] max-h-[90vh]' : `${maxWidthClass} max-h-[84vh] md:max-h-[82vh]`
        } flex-col overflow-hidden rounded-lg transition-[max-width,height] duration-200 ${
          glassEnabled ? 'liquid-glass-bronze' : 'liquid-glass-obsidian'
        } ${accentBorder} ${accentGlow} ${closing ? 'floating-window-exit' : 'floating-window-enter'} ${
          dragging ? 'select-none ring-1 ring-[#FFE39A]/50' : ''
        }`}
      >
        <GothicCorners crimson={accent === 'ruby'} />

        {/* Moveable Explorer Title Bar */}
        <div
          onPointerDown={handleTitlePointerDown}
          onDoubleClick={() => setOffset({ x: 0, y: 0 })}
          className="relative z-10 flex items-center justify-between gap-2 border-b border-[#D5A64C]/35 bg-gradient-to-r from-[#261816]/90 via-[#150E13]/92 to-[#211512]/90 px-3.5 sm:px-4 py-2.5 md:cursor-grab active:md:cursor-grabbing"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <GripHorizontal className="hidden md:block w-4 h-4 shrink-0 text-[#D5A64C]/70" />
            {icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[#D5A64C]/45 bg-[#0C080E]/85">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {subtitle && (
                <p className="font-gothic text-[9.5px] uppercase tracking-[0.18em] text-[#D5A64C] truncate">
                  {subtitle}
                </p>
              )}
              <h2 className="text-xs sm:text-sm font-extrabold text-white truncate">{title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(offset.x !== 0 || offset.y !== 0) && (
              <button
                type="button"
                onClick={() => setOffset({ x: 0, y: 0 })}
                title={lang === 'he' ? 'מרכז חלון' : 'Center Window'}
                aria-label="Center Window"
                className="tri-hover-gold hidden md:flex h-7 w-7 items-center justify-center rounded border border-[#D5A64C]/30 bg-[#0D090F]/80 text-[#FFE39A] cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setGlassEnabled((prev) => !prev)}
              title={
                glassEnabled
                  ? lang === 'he'
                    ? 'עבור לרקע אטום לקריאות'
                    : 'Switch to Solid Obsidian'
                  : lang === 'he'
                  ? 'הפעל זכוכית נוזלית מעושנת'
                  : 'Enable Smoked Liquid Glass'
              }
              aria-label="Toggle Liquid Glass"
              className="tri-hover-cyan flex min-h-[36px] min-w-[36px] md:min-h-0 md:min-w-0 md:h-7 md:w-7 items-center justify-center rounded border border-[#38bdf8]/35 bg-[#0A1322]/85 text-[#BAE6FD] cursor-pointer"
            >
              {glassEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMaximized((prev) => !prev);
                setOffset({ x: 0, y: 0 });
              }}
              title={
                isMaximized
                  ? lang === 'he'
                    ? 'שחזר גודל חלון'
                    : 'Restore Size'
                  : lang === 'he'
                  ? 'הגדל חלון למסך מלא'
                  : 'Maximize Window'
              }
              aria-label="Maximize or Restore Window"
              className="tri-hover-gold hidden md:flex h-7 w-7 items-center justify-center rounded border border-[#D5A64C]/35 bg-[#120D10]/85 text-[#FFE39A] cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onMinimize}
              title={lang === 'he' ? 'מזער לסרגל הפקודות' : 'Minimize to Dock'}
              aria-label="Minimize Window"
              className="tri-hover-gold hidden md:flex h-7 w-7 items-center justify-center rounded border border-[#D5A64C]/35 bg-[#120D10]/85 text-[#FFE39A] cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleRequestClose}
              title={lang === 'he' ? 'סגור חלון (Esc)' : 'Close Window (Esc)'}
              aria-label="Close Window"
              className="tri-hover-ruby flex min-h-[36px] min-w-[36px] md:min-h-0 md:min-w-0 md:h-7 md:w-7 items-center justify-center rounded border border-[#FF1729]/45 bg-[#2A0B12]/90 text-[#FFD5DA] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Window Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
};
