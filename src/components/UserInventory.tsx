import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  Compass,
  Crown,
  Eye,
  Flame,
  Gem,
  KeyRound,
  Palette,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  canAffordCosmetic,
  COSMETIC_REWARDS_CATALOG,
  CosmeticRewardDefinition,
  CosmeticSlot,
  FOUND_TOOLS_CATALOG,
  FoundItemsInventory,
  FoundToolDefinition,
  FoundToolId,
  parseUnlockedCosmetics,
  totalFoundItemsCount,
} from '../data/relicVault';
import { LanguageCode, PortalUser } from '../types';

interface UserInventoryProps {
  lang: LanguageCode;
  viewer: PortalUser | null;
  inventory: FoundItemsInventory;
  onSelectCosmeticSlot?: (slot: CosmeticSlot) => void;
  onConvertToCosmetic: (cosmetic: CosmeticRewardDefinition) => Promise<void>;
}

const renderToolIcon = (key: FoundToolDefinition['iconKey'], className = 'w-4 h-4') => {
  switch (key) {
    case 'key':
      return <KeyRound className={className} />;
    case 'eye':
      return <Eye className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'gem':
      return <Gem className={className} />;
  }
};

const renderSlotBadge = (slot: CosmeticSlot, lang: LanguageCode) => {
  switch (slot) {
    case 'super_banner':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7DD3FC]">
          <Sparkles className="w-3 h-3" />
          <span>{lang === 'he' ? 'באנר-על רוחבי' : 'Site-Wide Banner Overlay'}</span>
        </span>
      );
    case 'logo_crest':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FFE39A]">
          <Shield className="w-3 h-3" />
          <span>{lang === 'he' ? 'לוגו מותאם' : 'Custom Logo Style'}</span>
        </span>
      );
    case 'color_scheme':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F472B6]">
          <Palette className="w-3 h-3" />
          <span>{lang === 'he' ? 'ערכת צבע פרופיל' : 'Color Scheme Differentiator'}</span>
        </span>
      );
  }
};

/**
 * UserInventory
 * Displays all found tools/items owned by the user and enables direct conversion
 * of collected items into site-wide banner overlays, custom logo crests, and color schemes.
 */
export const UserInventory: React.FC<UserInventoryProps> = ({
  lang,
  viewer,
  inventory,
  onSelectCosmeticSlot,
  onConvertToCosmetic,
}) => {
  const [selectedToolId, setSelectedToolId] = useState<FoundToolId | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const unlockedSet = new Set(parseUnlockedCosmetics(viewer?.unlockedCosmeticsJson));
  const totalTools = totalFoundItemsCount(inventory);
  const uniqueOwnedCount = FOUND_TOOLS_CATALOG.filter((t) => (inventory[t.id] ?? 0) > 0).length;

  const selectedTool = selectedToolId
    ? FOUND_TOOLS_CATALOG.find((t) => t.id === selectedToolId) ?? null
    : null;

  const craftableRecipes = COSMETIC_REWARDS_CATALOG.filter((c) => {
    if (!selectedToolId) return canAffordCosmetic(inventory, c) && !unlockedSet.has(c.id);
    return (c.costTools[selectedToolId] ?? 0) > 0;
  });

  const handleConvert = async (cosmetic: CosmeticRewardDefinition) => {
    setConvertingId(cosmetic.id);
    try {
      await onConvertToCosmetic(cosmetic);
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <section
      aria-label={lang === 'he' ? 'מלאי הפריטים והכלים של המשתמש' : 'User Inventory'}
      className="liquid-glass-subcard rounded-lg border border-[#D5A64C]/35 p-3.5 space-y-3"
    >
      {/* Inventory Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5A64A]/20 pb-2">
        <div>
          <h4 className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#FFE39A]">
            <Gem className="w-4 h-4 text-[#f472b6]" />
            <span>
              {lang === 'he'
                ? 'מלאי המשתמש · כלים ואוצרות שנמצאו'
                : 'User Inventory · Collected Found Items'}
            </span>
          </h4>
          <p className="mt-0.5 text-[11px] text-[#A99AA7]">
            {lang === 'he'
              ? 'לחצו על כל פריט להמרה לבאנר-על באתר, לוגו מותאם אישית או ערכת צבעים בפרופיל'
              : 'Select any item to convert into site-wide banner overlays, custom logo styles, or color schemes'}
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
          <span className="text-[#FFE39A] font-bold">
            {totalTools} {lang === 'he' ? 'פריטים' : 'Items'}
          </span>
          <span className="text-[#D5A64C]/40" aria-hidden="true">
            ·
          </span>
          <span className="text-[#7DD3FC]">
            {uniqueOwnedCount}/{FOUND_TOOLS_CATALOG.length}{' '}
            {lang === 'he' ? 'סוגים' : 'Types'}
          </span>
        </div>
      </div>

      {/* All Found Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {FOUND_TOOLS_CATALOG.map((tool) => {
          const qty = inventory[tool.id] ?? 0;
          const isSelected = selectedToolId === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setSelectedToolId((prev) => (prev === tool.id ? null : tool.id))}
              title={lang === 'he' ? tool.descriptionHe : tool.descriptionEn}
              className={`rounded border p-2.5 text-start flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#FFE39A] bg-[#2D1B12] ring-1 ring-[#FFE39A]/60 shadow-[0_0_16px_rgba(213,166,76,0.35)]'
                  : qty > 0
                  ? `${tool.accentClass} hover:brightness-110`
                  : 'border-[#D5A64C]/20 bg-[#0B080E]/75 opacity-60 hover:opacity-85'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                {renderToolIcon(tool.iconKey, 'w-4 h-4 shrink-0')}
                <span className="font-mono text-xs font-black tabular-nums">x{qty}</span>
              </div>
              <div className="w-full">
                <p className="text-[11px] font-bold leading-tight truncate">
                  {lang === 'he' ? tool.nameHe : tool.nameEn}
                </p>
                <p className="mt-0.5 text-[9.5px] uppercase tracking-wider opacity-75">{tool.rarity}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Direct Item-to-Cosmetic Conversion Workbench */}
      <div className="rounded-md border border-[#D5A64C]/25 bg-[#09060D]/85 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#F3EAF1]">
            <ArrowRightLeft className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>
              {selectedTool
                ? lang === 'he'
                  ? `שדרוגים הניתנים ליצירה עם: ${selectedTool.nameHe}`
                  : `Convertible Rewards Using: ${selectedTool.nameEn}`
                : lang === 'he'
                ? 'מוכן להמרה עכשיו מהמלאי שלך'
                : 'Ready to Convert From Your Inventory'}
            </span>
          </div>
          {selectedTool && (
            <button
              type="button"
              onClick={() => setSelectedToolId(null)}
              className="text-[11px] text-[#7DD3FC] hover:underline cursor-pointer"
            >
              {lang === 'he' ? 'הצג מוכנים להמרה' : 'Show Ready Conversions'}
            </button>
          )}
        </div>

        {craftableRecipes.length === 0 ? (
          <p className="text-[11px] text-[#A89BA8]">
            {selectedTool
              ? lang === 'he'
                ? 'אין מתכוני המרה משויכים לפריט זה.'
                : 'No conversion recipes found for this item.'
              : lang === 'he'
              ? 'אספו כלים באמצעות סריקה, בונוס יומי או פתיחת דיונים כדי להמיר אותם לשדרוגים קוסמטיים.'
              : 'Collect found items via Foraging, Daily Bonus, or Threads to unlock cosmetic conversions.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {craftableRecipes.map((cosmetic) => {
              const isUnlocked = unlockedSet.has(cosmetic.id);
              const affordable = canAffordCosmetic(inventory, cosmetic);
              const costEntries = Object.entries(cosmetic.costTools) as [FoundToolId, number][];
              return (
                <div
                  key={cosmetic.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#D5A64C]/25 bg-[#120D16] px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    {renderSlotBadge(cosmetic.slot, lang)}
                    <p className="text-xs font-bold text-white truncate mt-0.5">
                      {lang === 'he' ? cosmetic.titleHe : cosmetic.titleEn}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-mono tabular-nums">
                      {costEntries.map(([tId, qty]) => {
                        const meta = FOUND_TOOLS_CATALOG.find((t) => t.id === tId);
                        const owned = inventory[tId] ?? 0;
                        return (
                          <span
                            key={tId}
                            className={owned >= qty ? 'text-emerald-300' : 'text-rose-300'}
                          >
                            {lang === 'he' ? meta?.nameHe : meta?.nameEn}: {owned}/{qty}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => onSelectCosmeticSlot?.(cosmetic.slot)}
                      className="inline-flex items-center gap-1 rounded border border-emerald-400/50 bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-emerald-200 cursor-pointer whitespace-nowrap"
                    >
                      <Check className="w-3 h-3" />
                      <span>{lang === 'he' ? 'פתוח · הצג' : 'Unlocked · View'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!affordable || convertingId === cosmetic.id}
                      onClick={() => void handleConvert(cosmetic)}
                      className="gothic-crimson-btn rounded px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-45 cursor-pointer whitespace-nowrap"
                    >
                      {convertingId === cosmetic.id
                        ? '...'
                        : lang === 'he'
                        ? 'המר וצייד'
                        : 'Convert'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
