import { hslToHex } from "./colorUtils"
import { HSL, HarmonyRule, VariantStrategy, SeedColor, OpencodeThemeColors } from "../types"
import { STANDARD_ANSI_DARK, STANDARD_ANSI_LIGHT } from "./terminalColors"

export const generateOpencodeSeeds = (
  baseColor: HSL, 
  harmony: HarmonyRule = HarmonyRule.ANALOGOUS, 
  spread: number = 30,
  brightness: number = 50
): SeedColor[] => {
  const { h, s, l } = baseColor;
  const lOffset = brightness - 50;
  
  // Helper to get harmony colors
  const getHarmonyHue = (offset: number) => (h + offset + 360) % 360;
  // Helper to apply brightness to HSL and return hex
  const toHex = (hh: number, ss: number, ll: number) => {
    const finalL = Math.max(0, Math.min(100, ll + lOffset));
    return hslToHex(hh, ss, finalL);
  };
  const toHsl = (hh: number, ss: number, ll: number): HSL => ({
    h: hh,
    s: ss,
    l: Math.max(0, Math.min(100, ll + lOffset))
  });

  let interactiveHue = (h + spread) % 360;
  let infoHue = (h + 180) % 360;

  // Adjust interactive and info based on harmony
  switch (harmony) {
    case HarmonyRule.MONOCHROMATIC:
    case HarmonyRule.SHADES:
      interactiveHue = h;
      infoHue = h;
      break;
    case HarmonyRule.COMPLEMENTARY:
      interactiveHue = getHarmonyHue(180);
      infoHue = getHarmonyHue(180);
      break;
    case HarmonyRule.ANALOGOUS:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(-spread);
      break;
    case HarmonyRule.ANALOGOUS_5:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(spread * 2);
      break;
    case HarmonyRule.DOUBLE_SPLIT_COMPLEMENTARY:
      interactiveHue = getHarmonyHue(180 - spread);
      infoHue = getHarmonyHue(180 + spread);
      break;
    case HarmonyRule.TRIADIC:
      interactiveHue = getHarmonyHue(120);
      infoHue = getHarmonyHue(240);
      break;
    case HarmonyRule.SQUARE:
      interactiveHue = getHarmonyHue(90);
      infoHue = getHarmonyHue(180);
      break;
    case HarmonyRule.TETRADIC:
      interactiveHue = getHarmonyHue(180);
      infoHue = getHarmonyHue(180 + spread);
      break;
    case HarmonyRule.SPLIT_COMPLEMENTARY:
      interactiveHue = getHarmonyHue(180 - spread);
      infoHue = getHarmonyHue(180 + spread);
      break;
    case HarmonyRule.ACCENTED_ANALOGOUS:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(180);
      break;
    case HarmonyRule.SIX_TONE:
    case HarmonyRule.PENTAGRAM:
    case HarmonyRule.FULL_SPECTRUM:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(spread * 2);
      break;
    case HarmonyRule.COMPOUND:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(180 - spread);
      break;
    case HarmonyRule.NATURAL:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(-spread);
      break;
    case HarmonyRule.DEEP_NIGHT:
      interactiveHue = getHarmonyHue(240);
      infoHue = getHarmonyHue(240 + spread);
      break;
    case HarmonyRule.OCEANIC:
      interactiveHue = getHarmonyHue(180 + spread);
      infoHue = getHarmonyHue(210);
      break;
    case HarmonyRule.FOREST_EDGE:
      interactiveHue = getHarmonyHue(120);
      infoHue = getHarmonyHue(30);
      break;
    case HarmonyRule.SOLAR_FLARE:
      interactiveHue = getHarmonyHue(30);
      infoHue = getHarmonyHue(60);
      break;
    case HarmonyRule.EARTHY:
      interactiveHue = getHarmonyHue(45);
      infoHue = getHarmonyHue(90);
      break;
    case HarmonyRule.HARD_CLASH:
    case HarmonyRule.ANALOGOUS_CLASH:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(spread * 3);
      break;
    case HarmonyRule.DOUBLE_ANALOGOUS:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(120);
      break;
    case HarmonyRule.CLASH_COMPLEMENTARY:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(180);
      break;
    case HarmonyRule.CYBERPUNK:
      interactiveHue = getHarmonyHue(150);
      infoHue = getHarmonyHue(300);
      break;
    case HarmonyRule.ROYAL:
      interactiveHue = getHarmonyHue(270);
      infoHue = getHarmonyHue(50);
      break;
    case HarmonyRule.PASTEL_DREAMS:
      interactiveHue = getHarmonyHue(120);
      infoHue = getHarmonyHue(240);
      break;
    case HarmonyRule.GOLDEN:
      interactiveHue = getHarmonyHue(137.5);
      infoHue = getHarmonyHue(275);
      break;
    default:
      interactiveHue = getHarmonyHue(spread);
      infoHue = getHarmonyHue(180);
  }

  // Use global saturation for all semantic seeds to make the control "feel" alive
  const semanticSat = Math.max(10, s); 
  const neutralSat = Math.min(15, s * 0.2);

  return [
    { name: "primary", hex: toHex(h, s, l), hsl: toHsl(h, s, l) },
    { name: "neutral", hex: toHex(h, neutralSat, 55), hsl: toHsl(h, neutralSat, 55) },
    { name: "interactive", hex: toHex(interactiveHue, Math.min(100, s + 20), 50), hsl: toHsl(interactiveHue, Math.min(100, s + 20), 50) },
    { name: "success", hex: toHex(115, semanticSat, 40), hsl: toHsl(115, semanticSat, 40) },
    { name: "warning", hex: toHex(40, semanticSat, 50), hsl: toHsl(40, semanticSat, 50) },
    { name: "error", hex: toHex(5, semanticSat, 52), hsl: toHsl(5, semanticSat, 52) },
    { name: "info", hex: toHex(infoHue, semanticSat, 52), hsl: toHsl(infoHue, semanticSat, 52) },
    { name: "diffAdd", hex: toHex(115, semanticSat, 40), hsl: toHsl(115, semanticSat, 40) },
    { name: "diffDelete", hex: toHex(5, semanticSat, 52), hsl: toHsl(5, semanticSat, 52) }
  ]
}

export const generateOpencodeThemeColors = (seeds: SeedColor[], variants: Record<string, string[]>, isDark: boolean): OpencodeThemeColors => {
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

  // Invert positions if light mode
  const pos = (p: number) => isDark ? p : 1 - p;

  // Background and surface colors in Light Mode often end up too close to pure white
  // because the variant scale ends at ~98-100% lightness.
  // We should clamp the light mode background positions to ensure they stay in the "soft" range.
  const bgPos = (p: number) => {
    if (isDark) return p;
    // In light mode, p=0.01 (bg-base) maps to index ~0.99 (very white).
    // We want to pull it back so it's not pure white. 
    const inverted = 1 - p;
    // Primary scale is usually 2n+1 long (e.g. 9 colors if count=4).
    // Indices: 0-3 (shades), 4 (base), 5-8 (tints)
    // We want to cap it so it stays at index 6 or lower to maintain a visible tint.
    // Index 6 is roughly 0.67-0.75 in a 9-step scale.
    return Math.min(0.65, inverted); 
  };

  const converted: OpencodeThemeColors = {
    // Backgrounds
    "background-base": getFromScale(primaryScale, bgPos(0.01), primaryHex),
    "background-weak": getFromScale(primaryScale, bgPos(0.04), primaryHex),
    "background-strong": getFromScale(primaryScale, bgPos(0.07), primaryHex),
    "background-stronger": getFromScale(primaryScale, bgPos(0.10), primaryHex),
    
    // Surfaces
    "surface-base": getFromScale(primaryScale, bgPos(0.15), primaryHex),
    "surface-base-hover": getFromScale(primaryScale, bgPos(0.20), primaryHex),
    "surface-base-active": getFromScale(primaryScale, bgPos(0.25), primaryHex),
    "surface-base-interactive-active": getFromScale(interactiveScale, bgPos(0.4), interactiveHex),
    
    "surface-inset-base": getFromScale(primaryScale, bgPos(0.08), primaryHex),
    "surface-inset-base-hover": getFromScale(primaryScale, bgPos(0.12), primaryHex),
    "surface-inset-base-active": getFromScale(primaryScale, bgPos(0.15), primaryHex),
    "surface-inset-strong": getFromScale(primaryScale, bgPos(0.15), primaryHex),
    "surface-inset-strong-hover": getFromScale(primaryScale, bgPos(0.20), primaryHex),

    "surface-raised-base": getFromScale(primaryScale, bgPos(0.20), primaryHex),
    "surface-raised-base-hover": getFromScale(primaryScale, bgPos(0.25), primaryHex),
    "surface-raised-base-active": getFromScale(primaryScale, bgPos(0.30), primaryHex),
    "surface-raised-strong": getFromScale(primaryScale, bgPos(0.35), primaryHex),
    "surface-raised-strong-hover": getFromScale(primaryScale, bgPos(0.40), primaryHex),
    "surface-raised-stronger": getFromScale(primaryScale, bgPos(0.45), primaryHex),
    "surface-raised-stronger-hover": getFromScale(primaryScale, bgPos(0.50), primaryHex),
    
    "surface-float-base": getFromScale(primaryScale, bgPos(0.25), primaryHex),
    "surface-float-base-hover": getFromScale(primaryScale, bgPos(0.30), primaryHex),
    "surface-float-base-active": getFromScale(primaryScale, bgPos(0.35), primaryHex),
    "surface-float-strong": getFromScale(primaryScale, bgPos(0.40), primaryHex),
    "surface-float-strong-hover": getFromScale(primaryScale, bgPos(0.45), primaryHex),
    "surface-float-strong-active": getFromScale(primaryScale, bgPos(0.50), primaryHex),

    "surface-weak": getFromScale(neutralScale, bgPos(0.10), neutralHex),
    "surface-weaker": getFromScale(neutralScale, bgPos(0.05), neutralHex),
    "surface-strong": getFromScale(primaryScale, bgPos(0.40), primaryHex),
    "surface-raised-stronger-non-alpha": getFromScale(primaryScale, bgPos(0.45), primaryHex),
    
    "surface-brand-base": getFromScale(primaryScale, 0.5, primaryHex),
    "surface-brand-hover": getFromScale(primaryScale, isDark ? 0.6 : 0.4, primaryHex),
    "surface-brand-active": getFromScale(primaryScale, isDark ? 0.4 : 0.6, primaryHex),
    
    "surface-interactive-base": getFromScale(interactiveScale, 0.5, interactiveHex),
    "surface-interactive-hover": getFromScale(interactiveScale, isDark ? 0.6 : 0.4, interactiveHex),
    "surface-interactive-active": getFromScale(interactiveScale, isDark ? 0.4 : 0.6, interactiveHex),
    "surface-interactive-weak": getFromScale(interactiveScale, pos(0.1), interactiveHex),
    "surface-interactive-weak-hover": getFromScale(interactiveScale, pos(0.15), interactiveHex),
    
    "surface-success-base": getFromScale(successScale, 0.5, successHex),
    "surface-success-hover": getFromScale(successScale, isDark ? 0.6 : 0.4, successHex),
    "surface-success-active": getFromScale(successScale, isDark ? 0.4 : 0.6, successHex),
    "surface-success-weak": getFromScale(successScale, pos(0.1), successHex),
    "surface-success-strong": getFromScale(successScale, pos(0.8), successHex),
    
    "surface-warning-base": getFromScale(warningScale, 0.5, warningHex),
    "surface-warning-hover": getFromScale(warningScale, isDark ? 0.6 : 0.4, warningHex),
    "surface-warning-active": getFromScale(warningScale, isDark ? 0.4 : 0.6, warningHex),
    "surface-warning-weak": getFromScale(warningScale, pos(0.1), warningHex),
    "surface-warning-strong": getFromScale(warningScale, pos(0.8), warningHex),
    
    "surface-critical-base": getFromScale(errorScale, 0.5, errorHex),
    "surface-critical-hover": getFromScale(errorScale, isDark ? 0.6 : 0.4, errorHex),
    "surface-critical-active": getFromScale(errorScale, isDark ? 0.4 : 0.6, errorHex),
    "surface-critical-weak": getFromScale(errorScale, pos(0.1), errorHex),
    "surface-critical-strong": getFromScale(errorScale, pos(0.8), errorHex),
    
    "surface-info-base": getFromScale(infoScale, 0.5, infoHex),
    "surface-info-hover": getFromScale(infoScale, isDark ? 0.6 : 0.4, infoHex),
    "surface-info-active": getFromScale(infoScale, isDark ? 0.4 : 0.6, infoHex),
    "surface-info-weak": getFromScale(infoScale, pos(0.1), infoHex),
    "surface-info-strong": getFromScale(infoScale, pos(0.8), infoHex),
    
    "surface-diff-unchanged-base": "transparent",
    "surface-diff-skip-base": getFromScale(primaryScale, pos(0.15), primaryHex),

    "surface-diff-hidden-base": getFromScale(interactiveScale, pos(0.15), interactiveHex),
    "surface-diff-hidden-weak": getFromScale(interactiveScale, pos(0.08), interactiveHex),
    "surface-diff-hidden-weaker": getFromScale(interactiveScale, pos(0.04), interactiveHex),
    "surface-diff-hidden-strong": getFromScale(interactiveScale, pos(0.4), interactiveHex),
    "surface-diff-hidden-stronger": getFromScale(interactiveScale, pos(0.6), interactiveHex),
    
    "surface-diff-add-base": getFromScale(diffAddScale, pos(0.15), diffAddHex),
    "surface-diff-add-weak": getFromScale(diffAddScale, pos(0.08), diffAddHex),
    "surface-diff-add-weaker": getFromScale(diffAddScale, pos(0.04), diffAddHex),
    "surface-diff-add-strong": getFromScale(diffAddScale, pos(0.4), diffAddHex),
    "surface-diff-add-stronger": getFromScale(diffAddScale, pos(0.6), diffAddHex),
    
    "surface-diff-delete-base": getFromScale(diffDeleteScale, pos(0.15), diffDeleteHex),
    "surface-diff-delete-weak": getFromScale(diffDeleteScale, pos(0.08), diffDeleteHex),
    "surface-diff-delete-weaker": getFromScale(diffDeleteScale, pos(0.04), diffDeleteHex),
    "surface-diff-delete-strong": getFromScale(diffDeleteScale, pos(0.4), diffDeleteHex),
    "surface-diff-delete-stronger": getFromScale(diffDeleteScale, pos(0.6), diffDeleteHex),

    // Input Focus Ring
    "input-focus-ring": getFromScale(interactiveScale, 0.5, interactiveHex),

    // Terminal Extras
    "terminal-cursor": getFromScale(interactiveScale, 0.5, interactiveHex),
    "terminal-selection": getFromScale(interactiveScale, pos(0.3), interactiveHex),

    // Tree & List UI
    "tree-background-selected": getFromScale(primaryScale, pos(0.2), primaryHex),
    "tree-background-hover": getFromScale(primaryScale, pos(0.12), primaryHex),
    "tree-foreground-selected": getFromScale(primaryScale, pos(0.95), primaryHex),
    "tree-foreground-hover": getFromScale(primaryScale, pos(0.9), primaryHex),
    "tree-icon-selected": getFromScale(interactiveScale, 0.5, interactiveHex),

    // Tabs Extended
    "tab-active-background": getFromScale(primaryScale, bgPos(0.15), primaryHex),
    "tab-active-foreground": getFromScale(primaryScale, pos(0.95), primaryHex),
    "tab-active-border": getFromScale(interactiveScale, 0.5, interactiveHex),
    "tab-inactive-background": getFromScale(primaryScale, bgPos(0.05), primaryHex),
    "tab-inactive-foreground": getFromScale(primaryScale, pos(0.6), primaryHex),

    // Breadcrumbs
    "breadcrumb-background": "transparent",
    "breadcrumb-foreground": getFromScale(primaryScale, pos(0.7), primaryHex),
    "breadcrumb-foreground-hover": getFromScale(primaryScale, pos(0.9), primaryHex),
    "breadcrumb-separator": getFromScale(neutralScale, pos(0.4), neutralHex),

    // Buttons
    "button-secondary-base": isDark ? getFromScale(primaryScale, 0.2, primaryHex) : getFromScale(primaryScale, 0.9, primaryHex),
    "button-secondary-hover": isDark ? getFromScale(primaryScale, 0.3, primaryHex) : getFromScale(primaryScale, 0.85, primaryHex),
    "button-danger-base": getFromScale(errorScale, 0.5, errorHex),
    "button-danger-hover": getFromScale(errorScale, 0.6, errorHex),
    "button-danger-active": getFromScale(errorScale, 0.4, errorHex),
    "button-ghost-hover": isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
    "button-ghost-hover2": isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",

    // Inputs
    "input-base": getFromScale(primaryScale, pos(0.08), primaryHex),
    "input-hover": getFromScale(primaryScale, pos(0.12), primaryHex),
    "input-active": getFromScale(primaryScale, pos(0.15), primaryHex),
    "input-disabled": getFromScale(neutralScale, pos(0.05), neutralHex),

    // Selection
    "selection-background": getFromScale(interactiveScale, pos(0.3), interactiveHex),
    "selection-foreground": getFromScale(primaryScale, pos(0.95), primaryHex),
    "selection-inactive-background": getFromScale(primaryScale, pos(0.2), primaryHex),
    
    // Focus & Scrollbars
    "focus-ring": getFromScale(interactiveScale, 0.5, interactiveHex),
    "scrollbar-thumb": getFromScale(primaryScale, pos(0.3), primaryHex),
    "scrollbar-track": "transparent",

    // Overlays & Shadows
    "shadow": isDark ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.15)",
    "overlay": isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.3)",
    
    // Text
    "text-base": getFromScale(primaryScale, pos(0.90), primaryHex),
    "text-weak": getFromScale(primaryScale, pos(0.70), primaryHex),
    "text-weaker": getFromScale(primaryScale, pos(0.50), primaryHex),
    "text-strong": getFromScale(primaryScale, pos(0.98), primaryHex),
    "text-stronger": getFromScale(primaryScale, pos(1.0), primaryHex),
    
    "text-invert-base": getFromScale(primaryScale, pos(0.1), primaryHex),
    "text-invert-weak": getFromScale(primaryScale, pos(0.3), primaryHex),
    "text-invert-weaker": getFromScale(primaryScale, pos(0.5), primaryHex),
    "text-invert-strong": getFromScale(primaryScale, pos(0.02), primaryHex),

    "text-on-brand-base": isDark ? "#FFFFFF" : getFromScale(primaryScale, 0.05, primaryHex),
    "text-on-brand-weak": isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
    "text-on-brand-weaker": isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
    "text-on-brand-strong": isDark ? "#FFFFFF" : getFromScale(primaryScale, 0.02, primaryHex),
    
    "text-interactive-base": getFromScale(interactiveScale, pos(0.7), interactiveHex),
    "text-on-interactive-base": isDark ? "#FFFFFF" : getFromScale(interactiveScale, 0.05, interactiveHex),
    "text-on-interactive-weak": getFromScale(interactiveScale, pos(0.8), interactiveHex),
    "text-on-success-base": isDark ? "#FFFFFF" : getFromScale(successScale, 0.05, successHex),
    "text-on-success-weak": isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
    "text-on-success-strong": isDark ? "#FFFFFF" : getFromScale(successScale, 0.02, successHex),
    "text-on-warning-base": isDark ? "#000000" : getFromScale(warningScale, 0.05, warningHex),
    "text-on-warning-weak": isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.7)",
    "text-on-warning-strong": isDark ? "#000000" : getFromScale(warningScale, 0.02, warningHex),
    "text-on-info-base": isDark ? "#FFFFFF" : getFromScale(infoScale, 0.05, infoHex),
    "text-on-info-weak": isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
    "text-on-info-strong": isDark ? "#FFFFFF" : getFromScale(infoScale, 0.02, infoHex),
    "text-on-critical-base": isDark ? "#FFFFFF" : getFromScale(errorScale, 0.05, errorHex),
    "text-on-critical-weak": isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
    "text-on-critical-strong": isDark ? "#FFFFFF" : getFromScale(errorScale, 0.05, errorHex),
    
    "text-diff-add-base": getFromScale(diffAddScale, pos(0.7), diffAddHex),
    "text-diff-add-strong": isDark ? "#FFFFFF" : getFromScale(diffAddScale, 0.05, diffAddHex),
    "text-diff-delete-base": getFromScale(diffDeleteScale, pos(0.7), diffDeleteHex),
    "text-diff-delete-strong": isDark ? "#FFFFFF" : getFromScale(diffDeleteScale, 0.05, diffDeleteHex),
    
    // Borders
    "border-base": getFromScale(primaryScale, pos(0.25), primaryHex),
    "border-hover": getFromScale(primaryScale, pos(0.35), primaryHex),
    "border-active": getFromScale(primaryScale, pos(0.45), primaryHex),
    "border-selected": getFromScale(interactiveScale, 0.5, interactiveHex),
    "border-disabled": getFromScale(neutralScale, pos(0.2), neutralHex),
    "border-focus": getFromScale(interactiveScale, 0.6, interactiveHex),

    "border-weak-base": getFromScale(primaryScale, pos(0.15), primaryHex),
    "border-weak-hover": getFromScale(primaryScale, pos(0.20), primaryHex),
    "border-weak-active": getFromScale(primaryScale, pos(0.25), primaryHex),
    "border-weak-selected": getFromScale(interactiveScale, 0.3, interactiveHex),
    "border-weak-disabled": getFromScale(neutralScale, pos(0.1), neutralHex),
    "border-weak-focus": getFromScale(interactiveScale, 0.4, interactiveHex),

    "border-weaker-base": getFromScale(primaryScale, pos(0.10), primaryHex),
    "border-weaker-hover": getFromScale(primaryScale, pos(0.15), primaryHex),
    "border-weaker-active": getFromScale(primaryScale, pos(0.20), primaryHex),
    "border-weaker-selected": getFromScale(interactiveScale, 0.2, interactiveHex),
    "border-weaker-disabled": getFromScale(neutralScale, pos(0.05), neutralHex),
    "border-weaker-focus": getFromScale(interactiveScale, 0.3, interactiveHex),

    "border-strong-base": getFromScale(primaryScale, pos(0.35), primaryHex),
    "border-strong-hover": getFromScale(primaryScale, pos(0.40), primaryHex),
    "border-strong-active": getFromScale(primaryScale, pos(0.45), primaryHex),
    "border-strong-selected": getFromScale(interactiveScale, 0.6, interactiveHex),

    // Semantic Borders (Explicit)
    "border-interactive-base": getFromScale(interactiveScale, pos(0.4), interactiveHex),
    "border-interactive-hover": getFromScale(interactiveScale, pos(0.5), interactiveHex),
    "border-interactive-active": getFromScale(interactiveScale, pos(0.6), interactiveHex),
    "border-interactive-selected": getFromScale(interactiveScale, 0.5, interactiveHex),
    "border-success-base": getFromScale(successScale, pos(0.41), successHex),
    "border-success-hover": getFromScale(successScale, pos(0.51), successHex),
    "border-success-selected": getFromScale(successScale, pos(0.61), successHex),
    "border-warning-base": getFromScale(warningScale, pos(0.41), warningHex),
    "border-warning-hover": getFromScale(warningScale, pos(0.51), warningHex),
    "border-warning-selected": getFromScale(warningScale, pos(0.61), warningHex),
    "border-critical-base": getFromScale(errorScale, pos(0.41), errorHex),
    "border-critical-hover": getFromScale(errorScale, pos(0.51), errorHex),
    "border-critical-selected": getFromScale(errorScale, pos(0.61), errorHex),
    "border-info-base": getFromScale(infoScale, pos(0.41), infoHex),
    "border-info-hover": getFromScale(infoScale, pos(0.51), infoHex),
    "border-info-selected": getFromScale(infoScale, pos(0.61), infoHex),
    "border-strong-disabled": getFromScale(neutralScale, pos(0.3), neutralHex),
    "border-strong-focus": getFromScale(interactiveScale, 0.7, interactiveHex),
    
    // Icons
    "icon-base": getFromScale(primaryScale, pos(0.7), primaryHex),
    "icon-hover": getFromScale(primaryScale, pos(0.8), primaryHex),
    "icon-active": getFromScale(primaryScale, pos(0.9), primaryHex),
    "icon-selected": getFromScale(interactiveScale, 0.5, interactiveHex),
    "icon-disabled": getFromScale(neutralScale, pos(0.4), neutralHex),
    "icon-focus": getFromScale(interactiveScale, 0.6, interactiveHex),
    "icon-invert-base": getFromScale(primaryScale, pos(0.1), primaryHex),
    
    "icon-brand-base": getFromScale(primaryScale, 0.5, primaryHex),
    "icon-interactive-base": getFromScale(interactiveScale, 0.5, interactiveHex),
    "icon-success-base": getFromScale(successScale, 0.5, successHex),
    "icon-warning-base": getFromScale(warningScale, 0.5, warningHex),
    "icon-critical-base": getFromScale(errorScale, 0.5, errorHex),
    "icon-info-base": getFromScale(infoScale, 0.5, infoHex),

    "icon-weak-base": getFromScale(primaryScale, pos(0.5), primaryHex),
    "icon-weak-hover": getFromScale(primaryScale, pos(0.6), primaryHex),
    "icon-weak-active": getFromScale(primaryScale, pos(0.7), primaryHex),
    "icon-weak-selected": getFromScale(interactiveScale, 0.3, interactiveHex),
    "icon-weak-disabled": getFromScale(neutralScale, pos(0.2), neutralHex),
    "icon-weak-focus": getFromScale(interactiveScale, 0.4, interactiveHex),
    
    "icon-strong-base": getFromScale(primaryScale, pos(0.9), primaryHex),
    "icon-strong-hover": getFromScale(primaryScale, pos(0.95), primaryHex),
    "icon-strong-active": getFromScale(primaryScale, pos(1.0), primaryHex),
    "icon-strong-selected": getFromScale(interactiveScale, 0.7, interactiveHex),
    "icon-strong-disabled": getFromScale(neutralScale, pos(0.6), neutralHex),
    "icon-strong-focus": getFromScale(interactiveScale, 0.8, interactiveHex),

    "icon-diff-add-base": getFromScale(diffAddScale, 0.5, diffAddHex),
    "icon-diff-add-hover": getFromScale(diffAddScale, 0.6, diffAddHex),
    "icon-diff-add-active": getFromScale(diffAddScale, 0.4, diffAddHex),
    "icon-diff-delete-base": getFromScale(diffDeleteScale, 0.5, diffDeleteHex),
    "icon-diff-delete-hover": getFromScale(diffDeleteScale, 0.6, diffDeleteHex),
    "icon-diff-modified-base": getFromScale(infoScale, 0.5, infoHex),

    "icon-on-brand-base": isDark ? "#FFFFFF" : getFromScale(primaryScale, 0.05, primaryHex),
    "icon-on-brand-hover": isDark ? "#FFFFFF" : getFromScale(primaryScale, 0.02, primaryHex),
    "icon-on-brand-selected": isDark ? "#FFFFFF" : getFromScale(primaryScale, 0.02, primaryHex),
    "icon-on-interactive-base": isDark ? "#FFFFFF" : getFromScale(interactiveScale, 0.05, interactiveHex),
    "icon-on-success-base": isDark ? "#FFFFFF" : getFromScale(successScale, 0.05, successHex),
    "icon-on-success-hover": isDark ? "#FFFFFF" : getFromScale(successScale, 0.02, successHex),
    "icon-on-success-selected": isDark ? "#FFFFFF" : getFromScale(successScale, 0.02, successHex),
    "icon-on-warning-base": isDark ? "#000000" : getFromScale(warningScale, 0.05, warningHex),
    "icon-on-warning-hover": isDark ? "#000000" : getFromScale(warningScale, 0.02, warningHex),
    "icon-on-warning-selected": isDark ? "#000000" : getFromScale(warningScale, 0.02, warningHex),
    "icon-on-critical-base": isDark ? "#FFFFFF" : getFromScale(errorScale, 0.05, errorHex),
    "icon-on-critical-hover": isDark ? "#FFFFFF" : getFromScale(errorScale, 0.02, errorHex),
    "icon-on-critical-selected": isDark ? "#FFFFFF" : getFromScale(errorScale, 0.02, errorHex),
    "icon-on-info-base": isDark ? "#FFFFFF" : getFromScale(infoScale, 0.05, infoHex),
    "icon-on-info-hover": isDark ? "#FFFFFF" : getFromScale(infoScale, 0.02, infoHex),
    "icon-on-info-selected": isDark ? "#FFFFFF" : getFromScale(infoScale, 0.02, infoHex),

    "icon-agent-plan-base": getFromScale(infoScale, 0.5, infoHex),
    "icon-agent-docs-base": getFromScale(successScale, 0.5, successHex),
    "icon-agent-ask-base": getFromScale(warningScale, 0.5, warningHex),
    "icon-agent-build-base": getFromScale(primaryScale, 0.5, primaryHex),

    // Base tokens
    "primary-base": getFromScale(primaryScale, 0.5, primaryHex),
    "primary-hover": getFromScale(primaryScale, isDark ? 0.6 : 0.4, primaryHex),
    "primary-active": getFromScale(primaryScale, isDark ? 0.4 : 0.6, primaryHex),
    "primary-text": getFromScale(primaryScale, pos(0.1), primaryHex),
    
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

    // Syntax
    "syntax-comment": getFromScale(neutralScale, pos(0.5), neutralHex),
    "syntax-keyword": getFromScale(infoScale, pos(0.6), infoHex),
    "syntax-function": getFromScale(interactiveScale, pos(0.6), interactiveHex),
    "syntax-variable": getFromScale(primaryScale, pos(0.8), primaryHex),
    "syntax-string": getFromScale(successScale, pos(0.6), successHex),
    "syntax-number": getFromScale(warningScale, pos(0.6), warningHex),
    "syntax-type": getFromScale(infoScale, pos(0.7), infoHex),
    "syntax-operator": getFromScale(primaryScale, pos(0.6), primaryHex),
    "syntax-punctuation": getFromScale(primaryScale, pos(0.4), primaryHex),
    "syntax-object": getFromScale(primaryScale, pos(0.7), primaryHex),
    "syntax-regexp": getFromScale(errorScale, pos(0.6), errorHex),
    "syntax-primitive": getFromScale(warningScale, pos(0.7), warningHex),
    "syntax-property": getFromScale(interactiveScale, pos(0.7), interactiveHex),
    "syntax-constant": getFromScale(warningScale, pos(0.8), warningHex),
    "syntax-tag": getFromScale(errorScale, pos(0.5), errorHex),
    "syntax-attribute": getFromScale(warningScale, pos(0.5), warningHex),
    "syntax-value": getFromScale(successScale, pos(0.5), successHex),
    "syntax-namespace": getFromScale(infoScale, pos(0.5), infoHex),
    "syntax-class": getFromScale(infoScale, pos(0.8), infoHex),
    "syntax-success": getFromScale(successScale, pos(0.5), successHex),
    "syntax-warning": getFromScale(warningScale, pos(0.5), warningHex),
    "syntax-critical": getFromScale(errorScale, pos(0.5), errorHex),
    "syntax-info": getFromScale(infoScale, pos(0.5), infoHex),
    "syntax-diff-add": getFromScale(successScale, pos(0.7), successHex),
    "syntax-diff-delete": getFromScale(errorScale, pos(0.7), errorHex),

    // Markdown
    "markdown-text": getFromScale(primaryScale, pos(0.9), primaryHex),
    "markdown-heading": getFromScale(primaryScale, pos(0.98), primaryHex),
    "markdown-link": getFromScale(interactiveScale, pos(0.6), interactiveHex),
    "markdown-link-text": getFromScale(interactiveScale, pos(0.6), interactiveHex),
    "markdown-code": getFromScale(primaryScale, pos(0.8), primaryHex),
    "markdown-block-quote": getFromScale(primaryScale, pos(0.4), primaryHex),
    "markdown-emph": getFromScale(primaryScale, pos(0.9), primaryHex),
    "markdown-strong": getFromScale(primaryScale, pos(0.98), primaryHex),
    "markdown-horizontal-rule": getFromScale(primaryScale, pos(0.2), primaryHex),
    "markdown-list-item": getFromScale(primaryScale, pos(0.9), primaryHex),
    "markdown-list-enumeration": getFromScale(interactiveScale, pos(0.6), interactiveHex),
    "markdown-image": getFromScale(infoScale, pos(0.6), infoHex),
    "markdown-image-text": getFromScale(infoScale, pos(0.6), infoHex),
    "markdown-code-block": getFromScale(primaryScale, pos(0.1), primaryHex),

    // Avatars
    "avatar-background": getFromScale(primaryScale, pos(0.2), primaryHex),
    "avatar-foreground": getFromScale(primaryScale, pos(0.9), primaryHex),
    "avatar-background-pink": "#ffc0cb",
    "avatar-background-mint": "#98ff98",
    "avatar-background-orange": "#ffa500",
    "avatar-background-purple": "#800080",
    "avatar-background-cyan": "#00ffff",
    "avatar-background-lime": "#00ff00",
    "avatar-background-blue": "#0000ff",
    "avatar-background-green": "#008000",
    "avatar-background-yellow": "#ffff00",
    "avatar-background-red": "#ff0000",
    "avatar-background-gray": "#808080",
    "avatar-text-pink": "#000000",
    "avatar-text-mint": "#000000",
    "avatar-text-orange": "#000000",
    "avatar-text-purple": "#ffffff",
    "avatar-text-cyan": "#000000",
    "avatar-text-lime": "#000000",
    "avatar-text-blue": "#ffffff",
    "avatar-text-green": "#ffffff",
    "avatar-text-yellow": "#000000",
    "avatar-text-red": "#ffffff",
    "avatar-text-gray": "#ffffff",

    // Terminal
    "terminal-ansi-black": isDark ? STANDARD_ANSI_DARK.black : STANDARD_ANSI_LIGHT.black,
    "terminal-ansi-red": isDark ? STANDARD_ANSI_DARK.red : STANDARD_ANSI_LIGHT.red,
    "terminal-ansi-green": isDark ? STANDARD_ANSI_DARK.green : STANDARD_ANSI_LIGHT.green,
    "terminal-ansi-yellow": isDark ? STANDARD_ANSI_DARK.yellow : STANDARD_ANSI_LIGHT.yellow,
    "terminal-ansi-blue": isDark ? STANDARD_ANSI_DARK.blue : STANDARD_ANSI_LIGHT.blue,
    "terminal-ansi-magenta": isDark ? STANDARD_ANSI_DARK.magenta : STANDARD_ANSI_LIGHT.magenta,
    "terminal-ansi-cyan": isDark ? STANDARD_ANSI_DARK.cyan : STANDARD_ANSI_LIGHT.cyan,
    "terminal-ansi-white": isDark ? STANDARD_ANSI_DARK.white : STANDARD_ANSI_LIGHT.white,
    "terminal-ansi-bright-black": isDark ? STANDARD_ANSI_DARK.brightBlack : STANDARD_ANSI_LIGHT.brightBlack,
    "terminal-ansi-bright-red": isDark ? STANDARD_ANSI_DARK.brightRed : STANDARD_ANSI_LIGHT.brightRed,
    "terminal-ansi-bright-green": isDark ? STANDARD_ANSI_DARK.brightGreen : STANDARD_ANSI_LIGHT.brightGreen,
    "terminal-ansi-bright-yellow": isDark ? STANDARD_ANSI_DARK.brightYellow : STANDARD_ANSI_LIGHT.brightYellow,
    "terminal-ansi-bright-blue": isDark ? STANDARD_ANSI_DARK.brightBlue : STANDARD_ANSI_LIGHT.brightBlue,
    "terminal-ansi-bright-magenta": isDark ? STANDARD_ANSI_DARK.brightMagenta : STANDARD_ANSI_LIGHT.brightMagenta,
    "terminal-ansi-bright-cyan": isDark ? STANDARD_ANSI_DARK.brightCyan : STANDARD_ANSI_LIGHT.brightCyan,
    "terminal-ansi-bright-white": isDark ? STANDARD_ANSI_DARK.brightWhite : STANDARD_ANSI_LIGHT.brightWhite,

    // Editor Misc
    "code-background": getFromScale(primaryScale, pos(0.02), primaryHex),
    "code-foreground": getFromScale(primaryScale, pos(0.9), primaryHex),
    "line-indicator": getFromScale(primaryScale, pos(0.2), primaryHex),
    "line-indicator-active": getFromScale(interactiveScale, 0.5, interactiveHex),
    "line-indicator-hover": getFromScale(primaryScale, pos(0.3), primaryHex),
    "tab-active": getFromScale(primaryScale, pos(0.15), primaryHex),
    "tab-inactive": "transparent",
    "tab-hover": getFromScale(primaryScale, pos(0.1), primaryHex),
    "border-color": getFromScale(primaryScale, pos(0.25), primaryHex),
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
