import { hslToHex } from "./colorUtils"
import { HSL, HarmonyRule, VariantStrategy, SeedColor, OpencodeThemeColors } from "../types"

export const generateOpencodeSeeds = (baseColor: HSL): SeedColor[] => [
  { name: "neutral", hex: "#8e8b8b", hsl: { h: 20, s: 5, l: 55 } },
  { name: "primary", hex: hslToHex(baseColor.h, baseColor.s, baseColor.l), hsl: baseColor },
  { name: "interactive", hex: hslToHex((baseColor.h + 30) % 360, Math.min(100, baseColor.s + 30), 50), hsl: { h: (baseColor.h + 30) % 360, s: Math.min(100, baseColor.s + 30), l: 50 } },
  { name: "success", hex: "#12c905", hsl: { h: 115, s: 70, l: 40 } },
  { name: "error", hex: "#fc533a", hsl: { h: 5, s: 85, l: 52 } },
  { name: "info", hex: "#a753ae", hsl: { h: 295, s: 55, l: 52 } },
  { name: "warning", hex: "#ffb224", hsl: { h: 40, s: 95, l: 50 } },
  { name: "accent", hex: hslToHex((baseColor.h + 180) % 360, Math.min(100, baseColor.s + 20), 55), hsl: { h: (baseColor.h + 180) % 360, s: Math.min(100, baseColor.s + 20), l: 55 } },
  { name: "critical", hex: "#fc533a", hsl: { h: 5, s: 85, l: 52 } }
]

export const generateOpencodeThemeColors = (seeds: SeedColor[], variants: Record<string, string[]>): OpencodeThemeColors => {
  const getFromScale = (scale: string[], position: number, fallback: string): string => {
    if (!scale || scale.length === 0) return fallback;
    // position 0 to 1
    // 0.5 should be the center (the base color)
    const index = Math.max(0, Math.min(scale.length - 1, Math.floor(position * scale.length)));
    return scale[index];
  }

  const primaryScale = variants.primary || []
  const neutralScale = variants.neutral || []
  const interactiveScale = variants.interactive || []
  const successScale = variants.success || []
  const errorScale = variants.error || []
  const infoScale = variants.info || []
  const warningScale = variants.warning || []
  const diffAddScale = variants.diffAdd || []
  const diffDeleteScale = variants.diffDelete || []
  
  const primaryHex = seeds.find(s => s.name === "primary")?.hex || "#6366f1"
  const interactiveHex = seeds.find(s => s.name === "interactive")?.hex || "#0db9d7"
  const successHex = seeds.find(s => s.name === "success")?.hex || "#12c905"
  const errorHex = seeds.find(s => s.name === "error")?.hex || "#fc533a"
  const infoHex = seeds.find(s => s.name === "info")?.hex || "#a753ae"
  const warningHex = seeds.find(s => s.name === "warning")?.hex || "#ffb224"
  const neutralHex = seeds.find(s => s.name === "neutral")?.hex || "#8e8b8b"
  const diffAddHex = seeds.find(s => s.name === "diffAdd")?.hex || successHex
  const diffDeleteHex = seeds.find(s => s.name === "diffDelete")?.hex || errorHex

  const converted: OpencodeThemeColors = {
    // Backgrounds - Using very low positions for dark themes
    "background-base": getFromScale(primaryScale, 0.02, primaryHex),
    "background-weak": getFromScale(primaryScale, 0.05, primaryHex),
    "background-strong": getFromScale(primaryScale, 0.08, primaryHex),
    "background-stronger": getFromScale(primaryScale, 0.12, primaryHex),
    
    // Surfaces
    "surface-base": getFromScale(primaryScale, 0.15, primaryHex),
    "surface-base-hover": getFromScale(primaryScale, 0.20, primaryHex),
    "surface-base-active": getFromScale(primaryScale, 0.25, primaryHex),
    "surface-base-interactive-active": getFromScale(interactiveScale, 0.4, interactiveHex),
    
    "surface-raised-base": getFromScale(primaryScale, 0.20, primaryHex),
    "surface-raised-base-hover": getFromScale(primaryScale, 0.25, primaryHex),
    "surface-raised-base-active": getFromScale(primaryScale, 0.30, primaryHex),
    "surface-raised-strong": getFromScale(primaryScale, 0.35, primaryHex),
    
    "surface-weak": getFromScale(neutralScale, 0.10, neutralHex),
    "surface-weaker": getFromScale(neutralScale, 0.05, neutralHex),
    "surface-strong": getFromScale(primaryScale, 0.40, primaryHex),
    
    "surface-brand-base": getFromScale(primaryScale, 0.5, primaryHex),
    "surface-brand-hover": getFromScale(primaryScale, 0.6, primaryHex),
    
    "surface-interactive-base": getFromScale(interactiveScale, 0.5, interactiveHex),
    "surface-interactive-hover": getFromScale(interactiveScale, 0.6, interactiveHex),
    "surface-interactive-weak": getFromScale(interactiveScale, 0.1, interactiveHex),
    "surface-interactive-weak-hover": getFromScale(interactiveScale, 0.15, interactiveHex),
    
    "surface-success-base": getFromScale(successScale, 0.5, successHex),
    "surface-success-weak": getFromScale(successScale, 0.1, successHex),
    "surface-success-strong": getFromScale(successScale, 0.8, successHex),
    
    "surface-warning-base": getFromScale(warningScale, 0.5, warningHex),
    "surface-warning-weak": getFromScale(warningScale, 0.1, warningHex),
    "surface-warning-strong": getFromScale(warningScale, 0.8, warningHex),
    
    "surface-critical-base": getFromScale(errorScale, 0.5, errorHex),
    "surface-critical-weak": getFromScale(errorScale, 0.1, errorHex),
    "surface-critical-strong": getFromScale(errorScale, 0.8, errorHex),
    
    "surface-info-base": getFromScale(infoScale, 0.5, infoHex),
    "surface-info-weak": getFromScale(infoScale, 0.1, infoHex),
    "surface-info-strong": getFromScale(infoScale, 0.8, infoHex),
    
    "surface-diff-unchanged-base": "transparent",
    "surface-diff-skip-base": getFromScale(primaryScale, 0.15, primaryHex),
    
    "surface-diff-add-base": getFromScale(diffAddScale, 0.15, diffAddHex),
    "surface-diff-add-weak": getFromScale(diffAddScale, 0.08, diffAddHex),
    "surface-diff-add-weaker": getFromScale(diffAddScale, 0.04, diffAddHex),
    "surface-diff-add-strong": getFromScale(diffAddScale, 0.4, diffAddHex),
    "surface-diff-add-stronger": getFromScale(diffAddScale, 0.6, diffAddHex),
    
    "surface-diff-delete-base": getFromScale(diffDeleteScale, 0.15, diffDeleteHex),
    "surface-diff-delete-weak": getFromScale(diffDeleteScale, 0.08, diffDeleteHex),
    "surface-diff-delete-weaker": getFromScale(diffDeleteScale, 0.04, diffDeleteHex),
    "surface-diff-delete-strong": getFromScale(diffDeleteScale, 0.4, diffDeleteHex),
    "surface-diff-delete-stronger": getFromScale(diffDeleteScale, 0.6, diffDeleteHex),
    
    // Text
    "text-base": getFromScale(primaryScale, 0.90, primaryHex),
    "text-weak": getFromScale(primaryScale, 0.70, primaryHex),
    "text-weaker": getFromScale(primaryScale, 0.50, primaryHex),
    "text-strong": getFromScale(primaryScale, 0.98, primaryHex),
    "text-on-brand-base": "#FFFFFF",
    
    "text-interactive-base": getFromScale(interactiveScale, 0.7, interactiveHex),
    "text-on-interactive-base": "#FFFFFF",
    "text-on-success-base": "#FFFFFF",
    "text-on-critical-base": "#FFFFFF",
    "text-on-warning-base": "#FFFFFF",
    "text-on-info-base": "#FFFFFF",
    
    "text-diff-add-base": getFromScale(diffAddScale, 0.7, diffAddHex),
    "text-diff-delete-base": getFromScale(diffDeleteScale, 0.7, diffDeleteHex),
    
    // Borders
    "border-base": getFromScale(primaryScale, 0.25, primaryHex),
    "border-weak": getFromScale(primaryScale, 0.15, primaryHex),
    "border-strong": getFromScale(primaryScale, 0.35, primaryHex),
    "border-selected": getFromScale(interactiveScale, 0.5, interactiveHex),
    "border-interactive-base": getFromScale(interactiveScale, 0.4, interactiveHex),
    "border-success-base": getFromScale(successScale, 0.4, successHex),
    "border-warning-base": getFromScale(warningScale, 0.4, warningHex),
    "border-critical-base": getFromScale(errorScale, 0.4, errorHex),
    "border-info-base": getFromScale(infoScale, 0.4, infoHex),
    
    // Icons
    "icon-base": getFromScale(primaryScale, 0.7, primaryHex),
    "icon-weak": getFromScale(primaryScale, 0.5, primaryHex),
    "icon-strong": getFromScale(primaryScale, 0.9, primaryHex),
    "icon-brand-base": getFromScale(primaryScale, 0.5, primaryHex),
    "icon-interactive-base": getFromScale(interactiveScale, 0.5, interactiveHex),
    "icon-success-base": getFromScale(successScale, 0.5, successHex),
    "icon-warning-base": getFromScale(warningScale, 0.5, warningHex),
    "icon-critical-base": getFromScale(errorScale, 0.5, errorHex),
    "icon-info-base": getFromScale(infoScale, 0.5, infoHex),
    
    // Base tokens
    "primary-base": getFromScale(primaryScale, 0.5, primaryHex),
    "primary-hover": getFromScale(primaryScale, 0.6, primaryHex),
    "primary-active": getFromScale(primaryScale, 0.4, primaryHex),
    "primary-text": getFromScale(primaryScale, 0.1, primaryHex),
    
    "secondary-base": getFromScale(infoScale, 0.5, infoHex),
    "secondary-hover": getFromScale(infoScale, 0.6, infoHex),
    "secondary-active": getFromScale(infoScale, 0.4, infoHex),
    "secondary-text": getFromScale(infoScale, 0.1, infoHex),
    
    "accent-base": getFromScale(interactiveScale, 0.5, interactiveHex),
    "accent-hover": getFromScale(interactiveScale, 0.6, interactiveHex),
    "accent-active": getFromScale(interactiveScale, 0.4, interactiveHex),
    "accent-text": getFromScale(interactiveScale, 0.1, interactiveHex),
    
    "success-base": getFromScale(successScale, 0.5, successHex),
    "success-hover": getFromScale(successScale, 0.6, successHex),
    "success-active": getFromScale(successScale, 0.4, successHex),
    "success-text": getFromScale(successScale, 0.1, successHex),
    
    "warning-base": getFromScale(warningScale, 0.5, warningHex),
    "warning-hover": getFromScale(warningScale, 0.6, warningHex),
    "warning-active": getFromScale(warningScale, 0.4, warningHex),
    "warning-text": getFromScale(warningScale, 0.1, warningHex),
    
    "critical-base": getFromScale(errorScale, 0.5, errorHex),
    "critical-hover": getFromScale(errorScale, 0.6, errorHex),
    "critical-active": getFromScale(errorScale, 0.4, errorHex),
    "critical-text": getFromScale(errorScale, 0.1, errorHex),
    
    "info-base": getFromScale(infoScale, 0.5, infoHex),
    "info-hover": getFromScale(infoScale, 0.6, infoHex),
    "info-active": getFromScale(infoScale, 0.4, infoHex),
    "info-text": getFromScale(infoScale, 0.1, infoHex),
    
    "interactive-base": getFromScale(interactiveScale, 0.5, interactiveHex),
    "interactive-hover": getFromScale(interactiveScale, 0.6, interactiveHex),
    "interactive-active": getFromScale(interactiveScale, 0.4, interactiveHex),
    "interactive-text": getFromScale(interactiveScale, 0.1, interactiveHex),
    
    "diff-add-base": getFromScale(diffAddScale, 0.15, diffAddHex),
    "diff-add-foreground": getFromScale(diffAddScale, 0.8, diffAddHex),
    "diff-delete-base": getFromScale(diffDeleteScale, 0.15, diffDeleteHex),
    "diff-delete-foreground": getFromScale(diffDeleteScale, 0.8, diffDeleteHex),
    
    "code-background": getFromScale(primaryScale, 0.04, primaryHex),
    "code-foreground": getFromScale(primaryScale, 0.85, primaryHex),
    
    "tab-active": getFromScale(interactiveScale, 0.5, interactiveHex),
    "tab-inactive": getFromScale(primaryScale, 0.15, primaryHex),
    "tab-hover": getFromScale(primaryScale, 0.2, primaryHex),
    
    "line-indicator": getFromScale(primaryScale, 0.2, primaryHex),
    "line-indicator-active": getFromScale(interactiveScale, 0.5, interactiveHex),
    
    "avatar-background": getFromScale(primaryScale, 0.4, primaryHex),
    "avatar-foreground": getFromScale(primaryScale, 0.95, primaryHex),
    
    "input-base": getFromScale(primaryScale, 0.08, primaryHex),
    "input-hover": getFromScale(primaryScale, 0.12, primaryHex),
    "input-active": getFromScale(primaryScale, 0.16, primaryHex),
    
    "scrollbar-thumb": getFromScale(primaryScale, 0.3, primaryHex),
    "scrollbar-track": getFromScale(primaryScale, 0.05, primaryHex),
    "focus-ring": getFromScale(interactiveScale, 0.5, interactiveHex),
    "shadow": "rgba(0,0,0,0.5)",
    "overlay": "rgba(0,0,0,0.7)"
  }
  return converted
}

export const harmonyOptions: { value: HarmonyRule; label: string }[] = Object.entries(HarmonyRule).map(([_, value]) => ({
  value,
  label: value
}));

export const variantStrategyOptions: { value: VariantStrategy; label: string }[] = Object.entries(VariantStrategy).map(([_, value]) => ({
  value,
  label: value
}));

export const thematicPresets = {
  cyberpunk: { h: [300, 320], s: [90, 100], l: [50, 60], harmony: HarmonyRule.ANALOGOUS, strategy: VariantStrategy.NEON },
  cinematic: { h: [190, 220], s: [60, 80], l: [40, 55], harmony: HarmonyRule.SPLIT_COMPLEMENTARY, strategy: VariantStrategy.CINEMATIC },
  pastel: { h: [0, 360], s: [30, 60], l: [70, 90], harmony: HarmonyRule.ANALOGOUS, strategy: VariantStrategy.PASTEL },
  retro: { h: [20, 50], s: [60, 85], l: [45, 65], harmony: HarmonyRule.TETRADIC, strategy: VariantStrategy.VINTAGE },
  vivid: { h: [0, 360], s: [85, 100], l: [45, 60], harmony: HarmonyRule.TRIADIC, strategy: VariantStrategy.VIBRANT },
  earthy: { h: [25, 75], s: [25, 50], l: [30, 50], harmony: HarmonyRule.NATURAL, strategy: VariantStrategy.CLAY },
  popArt: { h: [0, 360], s: [80, 100], l: [50, 60], harmony: HarmonyRule.SQUARE, strategy: VariantStrategy.MEMPHIS },
  midnight: { h: [220, 270], s: [40, 70], l: [15, 35], harmony: HarmonyRule.MONOCHROMATIC, strategy: VariantStrategy.DEEP },
  psychedelic: { h: [0, 360], s: [90, 100], l: [50, 60], harmony: HarmonyRule.FULL_SPECTRUM, strategy: VariantStrategy.GLITCH },
  warm: { h: [0, 60], s: [60, 90], l: [45, 65], harmony: HarmonyRule.ANALOGOUS, strategy: VariantStrategy.HEATWAVE },
  cool: { h: [170, 250], s: [50, 80], l: [45, 65], harmony: HarmonyRule.ANALOGOUS, strategy: VariantStrategy.GLACIAL },
  subtle: { h: [0, 360], s: [10, 30], l: [70, 90], harmony: HarmonyRule.MONOCHROMATIC, strategy: VariantStrategy.TINTS_SHADES },
  neon: { h: [150, 180], s: [90, 100], l: [50, 60], harmony: HarmonyRule.ANALOGOUS, strategy: VariantStrategy.NEON }
}
