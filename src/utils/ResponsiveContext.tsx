import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ScreenOrientation = 'portrait' | 'landscape';
export type RecommendedLayoutMode = 'mobile-stack' | 'tablet-swipe' | 'desktop-3col';

export interface ResponsiveContextValue {
  viewportWidth: number;
  viewportHeight: number;
  deviceType: DeviceType;
  orientation: ScreenOrientation;
  hasTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isTabletLandscape: boolean;
  isDesktop: boolean;
  /** True strictly below 1024px (mobile + portrait/compact tablet resolutions). */
  isBelow1024: boolean;
  /** True on mobile, tablet portrait/landscape, or resized windows narrower than desktop width (< 1280px). */
  isCompactViewport: boolean;
  /** True when horizontal finger-swipe carousels should replace dense multi-column grids. */
  useSwipeCarousels: boolean;
  recommendedLayout: RecommendedLayoutMode;
}

const DEFAULT_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1440;
const DEFAULT_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 900;

function detectTouchCapability(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarse || navigator.maxTouchPoints > 0;
}

function computeResponsiveSnapshot(width: number, height: number, hasTouch: boolean): ResponsiveContextValue {
  const orientation: ScreenOrientation = width >= height ? 'landscape' : 'portrait';

  // Mobile phones in portrait (< 768px) or compact phone landscape (height < 480px on touch screens)
  const isPhone = width < 768 || (hasTouch && height < 480 && width < 940);

  // Tablets (portrait 768-1023, horizontal/landscape 768-1279, or touch tablets up to 1366px) OR resized smaller desktop windows (< 1280px)
  const isTabletOrCompact = !isPhone && (width < 1280 || (hasTouch && width <= 1366 && height <= 960));

  const deviceType: DeviceType = isPhone ? 'mobile' : isTabletOrCompact ? 'tablet' : 'desktop';
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';
  const isTabletLandscape = isTablet && orientation === 'landscape';
  const isBelow1024 = width < 1024;
  const isCompactViewport = deviceType !== 'desktop';
  const useSwipeCarousels = isCompactViewport;

  const recommendedLayout: RecommendedLayoutMode = isMobile
    ? 'mobile-stack'
    : isTablet
    ? 'tablet-swipe'
    : 'desktop-3col';

  return {
    viewportWidth: width,
    viewportHeight: height,
    deviceType,
    orientation,
    hasTouch,
    isMobile,
    isTablet,
    isTabletLandscape,
    isDesktop,
    isBelow1024,
    isCompactViewport,
    useSwipeCarousels,
    recommendedLayout,
  };
}

const ResponsiveContext = createContext<ResponsiveContextValue>(
  computeResponsiveSnapshot(DEFAULT_WIDTH, DEFAULT_HEIGHT, detectTouchCapability())
);

export const ResponsiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [size, setSize] = useState<{ width: number; height: number; hasTouch: boolean }>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
    hasTouch: detectTouchCapability(),
  }));

  useEffect(() => {
    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
          hasTouch: detectTouchCapability(),
        });
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const value = useMemo(
    () => computeResponsiveSnapshot(size.width, size.height, size.hasTouch),
    [size.width, size.height, size.hasTouch]
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.device = value.deviceType;
    document.documentElement.dataset.orientation = value.orientation;
    document.documentElement.dataset.layoutMode = value.recommendedLayout;
  }, [value.deviceType, value.orientation, value.recommendedLayout]);

  return <ResponsiveContext.Provider value={value}>{children}</ResponsiveContext.Provider>;
};

export function useResponsiveContext(): ResponsiveContextValue {
  return useContext(ResponsiveContext);
}
