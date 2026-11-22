import React, { useState } from 'react';
import {
  Check,
  Compass,
  Crown,
  Eye,
  Flame,
  Gem,
  KeyRound,
  Palette,
  Pickaxe,
  Shield,
  Sparkles,
} from 'lucide-react';
import { PORTAL_ASSETS } from '../data/portalData';
import {
  canAffordCosmetic,
  COSMETIC_REWARDS_CATALOG,
  CosmeticRewardDefinition,
  CosmeticSlot,
  FOUND_TOOLS_CATALOG,
  FoundToolDefinition,
  FoundToolId,
  getColorSchemeTokens,
  getCosmeticMeta,
  parseFoundItems,
  parseUnlockedCosmetics,
  totalFoundItemsCount,
} from '../data/relicVault';
import { ForageResult, LanguageCode, PortalUser } from '../types';
import { CosmeticUsername } from './CosmeticUsername';
import { FloatingWindowFrame } from './FloatingWindowFrame';
import { PortalImage } from './GothicDecor';
import { UserInventory } from './UserInventory';

interface RelicVaultModalProps {
  open: boolean;
  minimized: boolean;
  zIndex: number;
  lang: LanguageCode;
  viewer: PortalUser | null;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onRequireAuth: () => void;
  onForage: () => Promise<ForageResult | null>;
  onRedeem: (cosmeticId: string) => Promise<void>;
  onEquip: (patch: {
    equippedBanner?: string | null;
    equippedLogo?: string | null;
    equippedTheme?: string | null;
  }) => Promise<void>;
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

export const RelicVaultModal: React.FC<RelicVaultModalProps> = ({
  open,
  minimized,
  zIndex,
  lang,
  viewer,
  onFocus,
  onMinimize,
  onClose,
  onRequireAuth,
  onForage,
  onRedeem,
  onEquip,
}) => {
  const [activeSlot, setActiveSlot] = useState<CosmeticSlot>('super_banner');
  const [foraging, setForaging] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastDrop, setLastDrop] = useState<ForageResult | null>(null);

  const inventory = parseFoundItems(viewer?.foundItemsJson);
  const unlockedIds = new Set(parseUnlockedCosmetics(viewer?.unlockedCosmeticsJson));
  const totalTools = totalFoundItemsCount(inventory);

  const equippedBannerMeta = getCosmeticMeta(viewer?.equippedBanner);
  const previewThemeTokens = getColorSchemeTokens(viewer?.equippedTheme);

  const slotItems = COSMETIC_REWARDS_CATALOG.filter((item) => item.slot === activeSlot);

  const handleForageClick = async () => {
    if (!viewer) {
      onRequireAuth();
      return;
    }
    setForaging(true);
    try {
      const res = await onForage();
      if (res) setLastDrop(res);
    } finally {
      setForaging(false);
    }
  };

  const handleRedeemOrEquip = async (item: CosmeticRewardDefinition) => {
    if (!viewer) {
      onRequireAuth();
      return;
    }
    const isUnlocked = unlockedIds.has(item.id);
    const isEquipped =
      (item.slot === 'super_banner' && viewer.equippedBanner === item.id) ||
      (item.slot === 'logo_crest' && viewer.equippedLogo === item.id) ||
      (item.slot === 'color_scheme' && viewer.equippedTheme === item.id);

    setBusyId(item.id);
    try {
      if (!isUnlocked) {
        await onRedeem(item.id);
      } else {
        const nextVal = isEquipped ? null : item.id;
        if (item.slot === 'super_banner') await onEquip({ equippedBanner: nextVal });
        if (item.slot === 'logo_crest') await onEquip({ equippedLogo: nextVal });
        if (item.slot === 'color_scheme') await onEquip({ equippedTheme: nextVal });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FloatingWindowFrame
      id="vault"
      open={open}
      minimized={minimized}
      zIndex={zIndex}
      lang={lang}
      title={lang === 'he' ? 'כספת הכלים ושדרוגי העיצוב האישי' : 'Relic Vault & Cosmetic Forge'}
      subtitle={lang === 'he' ? 'ChatFXP · Found Tools & Redemption' : 'ChatFXP · Found Tools & Forge'}
      icon={<Gem className="w-4 h-4 text-[#f472b6]" />}
      accent="gold"
      maxWidthClass="max-w-4xl"
      onFocus={onFocus}
      onMinimize={onMinimize}
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Top Vault Forge Header + Live Profile Identity Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Forge Forage Card */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-lg border border-[#D5A64C]/45 bg-[#120C14]">
            <div className="relative h-28 w-full overflow-hidden">
              <PortalImage
                src={PORTAL_ASSETS.relicVaultForge}
                alt="Relic Vault Forge"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120C14] via-[#120C14]/55 to-transparent" />
              <div className="absolute bottom-2.5 inset-x-3.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-[#FFE39A]">
                    {lang === 'he' ? 'איסוף כלים ונדירים ברחבי הפורטל' : 'Forage Found Tools & Relics'}
                  </h3>
                  <p className="text-[11px] text-[#D3C8D4]">
                    {lang === 'he'
                      ? `סה״כ כלים בארסנל שלך: ${totalTools} · פתיחת באנר-על, לוגו וערכת צבעים`
                      : `Owned Tools: ${totalTools} · Redeem for Super Banners, Logos & Color Schemes`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleForageClick}
                  disabled={foraging}
                  className="gothic-crimson-btn inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-xs font-bold text-white whitespace-nowrap cursor-pointer disabled:opacity-55"
                >
                  <Pickaxe className="w-3.5 h-3.5" />
                  <span>
                    {foraging
                      ? lang === 'he'
                        ? 'סורק אוצרות...'
                        : 'Foraging...'
                      : lang === 'he'
                      ? 'סרוק ומצא כלי (+10 מאנה)'
                      : 'Forage Tool (+10 Mana)'}
                  </span>
                </button>
              </div>
            </div>

            {lastDrop && (
              <div className="border-t border-emerald-500/35 bg-emerald-950/35 px-3.5 py-2 flex items-center justify-between text-xs text-emerald-200">
                <span>
                  {lang === 'he'
                    ? `נמצא אוצר: ${lastDrop.toolNameHe} (x${lastDrop.quantityAdded}) + ${lastDrop.bonusMana} מאנה`
                    : `Found: ${lastDrop.toolNameEn} (x${lastDrop.quantityAdded}) + ${lastDrop.bonusMana} Mana`}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              </div>
            )}
          </div>

          {/* Live Nameplate & Super Banner Preview */}
          <div
            className={`lg:col-span-5 relative overflow-hidden rounded-lg bg-[#0E0911] p-3.5 flex flex-col justify-between ${previewThemeTokens.borderClass}`}
          >
            {equippedBannerMeta?.bannerUrl && (
              <>
                <PortalImage
                  src={equippedBannerMeta.bannerUrl}
                  alt={equippedBannerMeta.titleEn}
                  className="absolute inset-0 h-full w-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09060C] via-[#09060C]/60 to-black/30" />
              </>
            )}

            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded border border-[#D5A64C]/45 bg-black/75 px-2 py-0.5 text-[10px] font-bold text-[#FFE39A]">
                {lang === 'he' ? 'תצוגה חיה של הפרופיל שלך' : 'Live Profile Differentiation'}
              </span>
              {viewer?.equippedTheme === 'theme_pride_spectrum' && (
                <span className="rounded border border-fuchsia-400/50 bg-fuchsia-950/80 px-1.5 py-0.5 text-[9px] font-bold text-fuchsia-100">
                  PRIDE
                </span>
              )}
            </div>

            <div className="relative z-10 mt-5 flex items-center gap-2.5">
              <PortalImage
                src={viewer?.avatarUrl ?? PORTAL_ASSETS.avatarAdmin}
                alt={viewer?.username ?? 'Guest'}
                className="h-11 w-11 rounded-full object-cover border-2 border-[#FFE39A] shadow-lg shrink-0"
              />
              <div className="min-w-0">
                <CosmeticUsername
                  username={viewer?.username ?? (lang === 'he' ? 'אורח (התחברו)' : 'Guest')}
                  equippedLogo={viewer?.equippedLogo}
                  equippedTheme={viewer?.equippedTheme}
                  showTag
                  className="text-sm sm:text-base"
                />
                <p className="text-[11px] text-[#E0D4E4] truncate">
                  {viewer?.rankTitle ?? (lang === 'he' ? 'התחברו לפדיון כלים' : 'Sign in to redeem')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Inventory & Direct Item-to-Cosmetic Conversion Workbench */}
        <UserInventory
          lang={lang}
          viewer={viewer}
          inventory={inventory}
          onSelectCosmeticSlot={(slot) => setActiveSlot(slot)}
          onConvertToCosmetic={async (item) => {
            await handleRedeemOrEquip(item);
            setActiveSlot(item.slot);
          }}
        />

        {/* Slot Tabs: Super Banners | Custom Logos | Color Schemes */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#D5A64C]/25 pb-2">
          {(
            [
              {
                id: 'super_banner',
                he: 'באנרי-על (Super Banners)',
                en: 'Super Banners',
                icon: <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />,
              },
              {
                id: 'logo_crest',
                he: 'לוגו אישי ליד השם',
                en: 'Custom Logos',
                icon: <Shield className="w-3.5 h-3.5 text-[#FFE39A]" />,
              },
              {
                id: 'color_scheme',
                he: 'ערכות צבע (Differentiation)',
                en: 'Color Schemes',
                icon: <Palette className="w-3.5 h-3.5 text-[#f472b6]" />,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSlot(tab.id)}
              className={`tri-hover-gold inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeSlot === tab.id
                  ? 'border-[#FFE39A] bg-[#D5A64C]/20 text-[#FFE39A]'
                  : 'border-[#D5A64C]/25 bg-[#120C15] text-[#C8BDCB] hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{lang === 'he' ? tab.he : tab.en}</span>
            </button>
          ))}
        </div>

        {/* Redeemable Cosmetics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {slotItems.map((item) => {
            const isUnlocked = unlockedIds.has(item.id);
            const isEquipped =
              (item.slot === 'super_banner' && viewer?.equippedBanner === item.id) ||
              (item.slot === 'logo_crest' && viewer?.equippedLogo === item.id) ||
              (item.slot === 'color_scheme' && viewer?.equippedTheme === item.id);
            const affordable = canAffordCosmetic(inventory, item);
            const costEntries = Object.entries(item.costTools) as [FoundToolId, number][];

            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3 flex flex-col justify-between gap-3 ${
                  isEquipped
                    ? 'border-emerald-400/65 bg-emerald-950/20 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                    : 'border-[#D5A64C]/35 bg-[#110C15]/90'
                }`}
              >
                <div className="space-y-2">
                  {item.bannerUrl && (
                    <div className="relative h-20 w-full overflow-hidden rounded border border-[#D5A64C]/30">
                      <PortalImage
                        src={item.bannerUrl}
                        alt={item.titleEn}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs sm:text-sm font-extrabold text-white">
                        {lang === 'he' ? item.titleHe : item.titleEn}
                      </h5>
                      <p className="mt-0.5 text-[11px] text-[#B9B3C0]">
                        {lang === 'he' ? item.descriptionHe : item.descriptionEn}
                      </p>
                    </div>
                    <span className="rounded border border-[#D5A64C]/40 bg-black/70 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[#FFE39A] shrink-0">
                      {item.previewTag}
                    </span>
                  </div>

                  {/* Preview snippet for Logo or Color Scheme */}
                  {item.slot === 'color_scheme' && (
                    <div className="rounded border border-[#D5A64C]/25 bg-[#09060C] px-2.5 py-1.5 text-xs">
                      <CosmeticUsername
                        username={viewer?.username ?? 'ChatFXP_Hero'}
                        equippedLogo={viewer?.equippedLogo}
                        equippedTheme={item.id}
                        showTag
                      />
                    </div>
                  )}
                  {item.slot === 'logo_crest' && (
                    <div className="rounded border border-[#D5A64C]/25 bg-[#09060C] px-2.5 py-1.5 text-xs">
                      <CosmeticUsername
                        username={viewer?.username ?? 'ChatFXP_Hero'}
                        equippedLogo={item.id}
                        equippedTheme={viewer?.equippedTheme}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D5A64C]/20">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'he' ? 'פתוח בחשבון' : 'Unlocked'}</span>
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {costEntries.map(([tId, qty]) => {
                        const toolMeta = FOUND_TOOLS_CATALOG.find((t) => t.id === tId);
                        const owned = inventory[tId] ?? 0;
                        return (
                          <span
                            key={tId}
                            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                              owned >= qty
                                ? 'border-emerald-500/40 bg-emerald-950/35 text-emerald-200'
                                : 'border-rose-500/40 bg-rose-950/35 text-rose-200'
                            }`}
                          >
                            {toolMeta && renderToolIcon(toolMeta.iconKey, 'w-3 h-3')}
                            <span>{lang === 'he' ? toolMeta?.nameHe : toolMeta?.nameEn}</span>
                            <span className="font-mono tabular-nums">
                              {owned}/{qty}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={busyId === item.id || (!isUnlocked && !affordable && Boolean(viewer))}
                    onClick={() => handleRedeemOrEquip(item)}
                    className={`rounded px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-45 ${
                      isEquipped
                        ? 'border border-emerald-400/60 bg-emerald-950/70 text-emerald-200 hover:bg-emerald-900/70'
                        : isUnlocked
                        ? 'tri-hover-gold border border-[#D5A64C]/60 bg-[#281A0E] text-[#FFE39A]'
                        : 'gothic-crimson-btn text-white'
                    }`}
                  >
                    {busyId === item.id
                      ? '...'
                      : isEquipped
                      ? lang === 'he'
                        ? 'מצויד (הסר)'
                        : 'Equipped (Remove)'
                      : isUnlocked
                      ? lang === 'he'
                        ? 'צייד עכשיו'
                        : 'Equip Now'
                      : lang === 'he'
                      ? 'פדה וצייד'
                      : 'Redeem & Equip'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FloatingWindowFrame>
  );
};
