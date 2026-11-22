import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'chatfxp_sidebar_collapsed';

export type SidebarCardId =
  | 'profile'
  | 'couple'
  | 'events'
  | 'announcements'
  | 'members'
  | 'rss'
  | 'sanctumArt';

export function useSidebarCollapse() {
  const [collapsedMap, setCollapsedMap] = useState<Partial<Record<SidebarCardId, boolean>>>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Partial<Record<SidebarCardId, boolean>>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedMap));
    } catch {
      // Ignore storage write failure
    }
  }, [collapsedMap]);

  const isCollapsed = useCallback(
    (cardId: SidebarCardId) => Boolean(collapsedMap[cardId]),
    [collapsedMap]
  );

  const toggleCard = useCallback((cardId: SidebarCardId) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  }, []);

  return { isCollapsed, toggleCard };
}
