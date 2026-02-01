import { hslToHex } from "./colorUtils"
import { HSL, HarmonyRule, VariantStrategy, PaletteGroup, SeedColor, OpencodeThemeColors, InternalThemeColors } from "../types"

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

export const generateThemeColors = (paletteGroups: PaletteGroup[], baseColor: HSL): InternalThemeColors => {
  const getGroup = (index: number): PaletteGroup => {
    return paletteGroups[index] || paletteGroups[0] || {
      base: { hsl: baseColor, hex: hslToHex(baseColor.h, baseColor.s, baseColor.l), name: 'fallback' },
      variants: []
    }
  }

  const primaryGroup = getGroup(0)
  const secondaryGroup = getGroup(1)
  const accentGroup = getGroup(2)
  const successGroup = getGroup(3)
  const warningGroup = getGroup(4)
  const criticalGroup = getGroup(5)
  const infoGroup = getGroup(6)

  const primary = primaryGroup.base.hex
  const secondary = secondaryGroup.base.hex
  const accent = accentGroup.base.hex
  const success = successGroup.base.hex
  const warning = warningGroup.base.hex
  const critical = criticalGroup.base.hex
  const info = infoGroup.base.hex

  const getAt = (arr: string[], index: number, fallback: string): string => arr[index] || fallback

  const pVariants = primaryGroup.variants
  const sVariants = secondaryGroup.variants
  const aVariants = accentGroup.variants
  const sucVariants = successGroup.variants
  const warVariants = warningGroup.variants
  const criVariants = criticalGroup.variants
  const infVariants = infoGroup.variants

  const pLight = [...pVariants].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const pDark = [...pVariants].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)
  const sLight = [...sVariants].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const aLight = [...aVariants].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const aDark = [...aVariants].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)
  const sucLight = [...sucVariants].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const sucDark = [...sucVariants].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)
  const warLight = [...warVariants].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const warDark = [...warVariants].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)
  const criLight = [...criVariants].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const criDark = [...criVariants].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)
  const infLight = [...infVariants].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const infDark = [...infVariants].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)

  return {
    "background-base": getAt(pLight, 0, primary),
    "background-weak": getAt(pLight, 1, primary),
    "background-strong": getAt(pLight, 2, primary),
    "background-stronger": getAt(pLight, 3, primary),

    "surface-base": getAt(pLight, 4, primary),
    "surface-base-hover": getAt(pLight, 5, primary),
    "surface-base-active": getAt(pLight, 6, primary),
    "surface-base-interactive-active": getAt(aDark, 1, accent),
    "surface-raised-base": getAt(pLight, 3, primary),
    "surface-raised-base-hover": getAt(pLight, 4, primary),
    "surface-raised-base-active": getAt(pLight, 5, primary),
    "surface-raised-strong": getAt(pLight, 5, primary),
    "surface-weak": getAt(sLight, 2, secondary),
    "surface-weaker": getAt(sLight, 3, secondary),
    "surface-strong": getAt(aLight, 2, accent),

    "surface-brand-base": primary,
    "surface-brand-hover": getAt(pDark, 1, primary),
    "surface-interactive-base": getAt(aDark, 0, accent),
    "surface-interactive-hover": getAt(aDark, 1, accent),
    "surface-interactive-weak": getAt(aLight, 3, accent),
    "surface-interactive-weak-hover": getAt(aLight, 2, accent),

    "surface-success-base": success,
    "surface-success-weak": getAt(sucLight, 3, success),
    "surface-success-strong": getAt(sucDark, 1, success),
    "surface-warning-base": warning,
    "surface-warning-weak": getAt(warLight, 3, warning),
    "surface-warning-strong": getAt(warDark, 1, warning),
    "surface-critical-base": critical,
    "surface-critical-weak": getAt(criLight, 3, critical),
    "surface-critical-strong": getAt(criDark, 1, critical),
    "surface-info-base": info,
    "surface-info-weak": getAt(infLight, 3, info),
    "surface-info-strong": getAt(infDark, 1, info),

    "surface-diff-unchanged-base": "transparent",
    "surface-diff-skip-base": getAt(pLight, 5, primary),
    "surface-diff-add-base": getAt(sucLight, 4, success),
    "surface-diff-add-weak": getAt(sucLight, 5, success),
    "surface-diff-add-weaker": getAt(sucLight, 6, success),
    "surface-diff-add-strong": getAt(sucLight, 3, success),
    "surface-diff-add-stronger": getAt(sucLight, 2, success),
    "surface-diff-delete-base": getAt(criLight, 4, critical),
    "surface-diff-delete-weak": getAt(criLight, 5, critical),
    "surface-diff-delete-weaker": getAt(criLight, 6, critical),
    "surface-diff-delete-strong": getAt(criLight, 3, critical),
    "surface-diff-delete-stronger": getAt(criLight, 2, critical),

    "text-base": getAt(pDark, 0, primary),
    "text-weak": getAt(pDark, 1, primary),
    "text-weaker": getAt(pDark, 2, primary),
    "text-strong": getAt(pDark, 0, primary),
    "text-on-brand-base": "#FFFFFF",
    "text-interactive-base": getAt(aDark, 0, accent),
    "text-on-interactive-base": "#FFFFFF",
    "text-on-success-base": "#FFFFFF",
    "text-on-critical-base": "#FFFFFF",
    "text-on-warning-base": "#FFFFFF",
    "text-on-info-base": "#FFFFFF",
    "text-diff-add-base": getAt(sucDark, 0, success),
    "text-diff-delete-base": getAt(criDark, 0, critical),

    "border-base": getAt(pLight, 4, primary),
    "border-hover": getAt(pLight, 3, primary),
    "border-active": getAt(pLight, 2, primary),
    "border-selected": accent,
    "border-weak-base": getAt(pLight, 5, primary),
    "border-strong-base": getAt(pLight, 3, primary),
    "border-interactive-base": getAt(aLight, 2, accent),
    "border-success-base": getAt(sucLight, 2, success),
    "border-warning-base": getAt(warLight, 2, warning),
    "border-critical-base": getAt(criLight, 2, critical),
    "border-info-base": getAt(infLight, 2, info),

    "icon-base": getAt(pDark, 1, primary),
    "icon-hover": getAt(pDark, 0, primary),
    "icon-active": primary,
    "icon-selected": accent,
    "icon-brand-base": primary,
    "icon-interactive-base": accent,
    "icon-success-base": success,
    "icon-warning-base": warning,
    "icon-critical-base": critical,
    "icon-info-base": info,

    "input-base": getAt(pLight, 0, primary),
    "input-hover": getAt(pLight, 1, primary),
    "input-active": getAt(pLight, 2, primary),

    "focus-ring": accent,
    "scrollbar-thumb": getAt(pLight, 4, primary),
    "scrollbar-track": getAt(pLight, 6, primary),
    "shadow": "rgba(0,0,0,0.2)",
    "overlay": "rgba(0,0,0,0.5)"
  }
}

export const generateOpencodeThemeColors = (seeds: SeedColor[], variants: Record<string, string[]>): OpencodeThemeColors => {
  const getFromScale = (scale: string[], position: number, fallback: string): string => {
    if (!scale || scale.length === 0) return fallback;
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
    "background-base": getFromScale(primaryScale, 0.05, primaryHex),
    "background-weak": getFromScale(primaryScale, 0.1, primaryHex),
    "background-strong": getFromScale(primaryScale, 0.15, primaryHex),
    "background-stronger": getFromScale(primaryScale, 0.2, primaryHex),
    "surface-base": getFromScale(primaryScale, 0.25, primaryHex),
    "surface-base-hover": getFromScale(primaryScale, 0.3, primaryHex),
    "surface-base-active": getFromScale(primaryScale, 0.35, primaryHex),
    "surface-base-interactive-active": getFromScale(interactiveScale, 0.6, interactiveHex),
    "surface-raised-base": getFromScale(primaryScale, 0.3, primaryHex),
    "surface-raised-base-hover": getFromScale(primaryScale, 0.35, primaryHex),
    "surface-raised-base-active": getFromScale(primaryScale, 0.4, primaryHex),
    "surface-raised-strong": getFromScale(primaryScale, 0.4, primaryHex),
    "surface-weak": getFromScale(neutralScale, 0.15, neutralHex),
    "surface-weaker": getFromScale(neutralScale, 0.1, neutralHex),
    "surface-strong": getFromScale(primaryScale, 0.45, primaryHex),
    "surface-brand-base": primaryHex,
    "surface-brand-hover": getFromScale(primaryScale, 0.6, primaryHex),
    "surface-interactive-base": getFromScale(interactiveScale, 0.5, interactiveHex),
    "surface-interactive-hover": getFromScale(interactiveScale, 0.6, interactiveHex),
    "surface-interactive-weak": getFromScale(interactiveScale, 0.2, interactiveHex),
    "surface-interactive-weak-hover": getFromScale(interactiveScale, 0.3, interactiveHex),
    "surface-success-base": successHex,
    "surface-success-weak": getFromScale(successScale, 0.2, successHex),
    "surface-success-strong": getFromScale(successScale, 0.8, successHex),
    "surface-warning-base": warningHex,
    "surface-warning-weak": getFromScale(warningScale, 0.2, warningHex),
    "surface-warning-strong": getFromScale(warningScale, 0.8, warningHex),
    "surface-critical-base": errorHex,
    "surface-critical-weak": getFromScale(errorScale, 0.2, errorHex),
    "surface-critical-strong": getFromScale(errorScale, 0.8, errorHex),
    "surface-info-base": infoHex,
    "surface-info-weak": getFromScale(infoScale, 0.2, infoHex),
    "surface-info-strong": getFromScale(infoScale, 0.8, infoHex),
    "surface-diff-unchanged-base": "transparent",
    "surface-diff-skip-base": getFromScale(primaryScale, 0.2, primaryHex),
    "surface-diff-add-base": getFromScale(diffAddScale, 0.2, diffAddHex),
    "surface-diff-add-weak": getFromScale(diffAddScale, 0.1, diffAddHex),
    "surface-diff-add-weaker": getFromScale(diffAddScale, 0.05, diffAddHex),
    "surface-diff-add-strong": getFromScale(diffAddScale, 0.4, diffAddHex),
    "surface-diff-add-stronger": getFromScale(diffAddScale, 0.6, diffAddHex),
    "surface-diff-delete-base": getFromScale(diffDeleteScale, 0.2, diffDeleteHex),
    "surface-diff-delete-weak": getFromScale(diffDeleteScale, 0.1, diffDeleteHex),
    "surface-diff-delete-weaker": getFromScale(diffDeleteScale, 0.05, diffDeleteHex),
    "surface-diff-delete-strong": getFromScale(diffDeleteScale, 0.4, diffDeleteHex),
    "surface-diff-delete-stronger": getFromScale(diffDeleteScale, 0.6, diffDeleteHex),
    "text-base": getFromScale(primaryScale, 0.85, primaryHex),
    "text-weak": getFromScale(primaryScale, 0.75, primaryHex),
    "text-weaker": getFromScale(primaryScale, 0.65, primaryHex),
    "text-strong": getFromScale(primaryScale, 0.95, primaryHex),
    "text-on-brand-base": "#FFFFFF",
    "text-interactive-base": getFromScale(interactiveScale, 0.8, interactiveHex),
    "text-on-interactive-base": "#FFFFFF",
    "text-on-success-base": "#FFFFFF",
    "text-on-critical-base": "#FFFFFF",
    "text-on-warning-base": "#FFFFFF",
    "text-on-info-base": "#FFFFFF",
    "text-diff-add-base": getFromScale(diffAddScale, 0.8, diffAddHex),
    "text-diff-delete-base": getFromScale(diffDeleteScale, 0.8, diffDeleteHex),
    "border-base": getFromScale(primaryScale, 0.3, primaryHex),
    "border-weak": getFromScale(primaryScale, 0.2, primaryHex),
    "border-strong": getFromScale(primaryScale, 0.4, primaryHex),
    "border-selected": interactiveHex,
    "border-interactive-base": getFromScale(interactiveScale, 0.4, interactiveHex),
    "border-success-base": getFromScale(successScale, 0.4, successHex),
    "border-warning-base": getFromScale(warningScale, 0.4, warningHex),
    "border-critical-base": getFromScale(errorScale, 0.4, errorHex),
    "border-info-base": getFromScale(infoScale, 0.4, infoHex),
    "icon-base": getFromScale(primaryScale, 0.7, primaryHex),
    "icon-weak": getFromScale(primaryScale, 0.6, primaryHex),
    "icon-strong": getFromScale(primaryScale, 0.9, primaryHex),
    "icon-brand-base": primaryHex,
    "icon-interactive-base": interactiveHex,
    "icon-success-base": successHex,
    "icon-warning-base": warningHex,
    "icon-critical-base": errorHex,
    "icon-info-base": infoHex,
    "primary-base": primaryHex,
    "primary-hover": getFromScale(primaryScale, 0.6, primaryHex),
    "primary-active": getFromScale(primaryScale, 0.4, primaryHex),
    "primary-text": getFromScale(primaryScale, 0.1, primaryHex),
    "secondary-base": infoHex,
    "secondary-hover": getFromScale(infoScale, 0.6, infoHex),
    "secondary-active": getFromScale(infoScale, 0.4, infoHex),
    "secondary-text": getFromScale(infoScale, 0.1, infoHex),
    "accent-base": interactiveHex,
    "accent-hover": getFromScale(interactiveScale, 0.6, interactiveHex),
    "accent-active": getFromScale(interactiveScale, 0.4, interactiveHex),
    "accent-text": getFromScale(interactiveScale, 0.1, interactiveHex),
    "success-base": successHex,
    "success-hover": getFromScale(successScale, 0.6, successHex),
    "success-active": getFromScale(successScale, 0.4, successHex),
    "success-text": getFromScale(successScale, 0.1, successHex),
    "warning-base": warningHex,
    "warning-hover": getFromScale(warningScale, 0.6, warningHex),
    "warning-active": getFromScale(warningScale, 0.4, warningHex),
    "warning-text": getFromScale(warningScale, 0.1, warningHex),
    "critical-base": errorHex,
    "critical-hover": getFromScale(errorScale, 0.6, errorHex),
    "critical-active": getFromScale(errorScale, 0.4, errorHex),
    "critical-text": getFromScale(errorScale, 0.1, errorHex),
    "info-base": infoHex,
    "info-hover": getFromScale(infoScale, 0.6, infoHex),
    "info-active": getFromScale(infoScale, 0.4, infoHex),
    "info-text": getFromScale(infoScale, 0.1, infoHex),
    "interactive-base": interactiveHex,
    "interactive-hover": getFromScale(interactiveScale, 0.6, interactiveHex),
    "interactive-active": getFromScale(interactiveScale, 0.4, interactiveHex),
    "interactive-text": getFromScale(interactiveScale, 0.1, interactiveHex),
    "diff-add-base": getFromScale(diffAddScale, 0.2, diffAddHex),
    "diff-add-foreground": getFromScale(diffAddScale, 0.8, diffAddHex),
    "diff-delete-base": getFromScale(diffDeleteScale, 0.2, diffDeleteHex),
    "diff-delete-foreground": getFromScale(diffDeleteScale, 0.8, diffDeleteHex),
    "code-background": getFromScale(primaryScale, 0.05, primaryHex),
    "code-foreground": getFromScale(primaryScale, 0.9, primaryHex),
    "tab-active": interactiveHex,
    "tab-inactive": getFromScale(primaryScale, 0.2, primaryHex),
    "tab-hover": getFromScale(primaryScale, 0.3, primaryHex),
    "line-indicator": getFromScale(primaryScale, 0.3, primaryHex),
    "line-indicator-active": interactiveHex,
    "avatar-background": getFromScale(primaryScale, 0.4, primaryHex),
    "avatar-foreground": getFromScale(primaryScale, 0.95, primaryHex),
    "input-base": getFromScale(primaryScale, 0.1, primaryHex),
    "input-hover": getFromScale(primaryScale, 0.15, primaryHex),
    "input-active": getFromScale(primaryScale, 0.2, primaryHex),
    "scrollbar-thumb": getFromScale(primaryScale, 0.4, primaryHex),
    "scrollbar-track": getFromScale(primaryScale, 0.1, primaryHex),
    "focus-ring": interactiveHex,
    "shadow": "rgba(0,0,0,0.5)",
    "overlay": "rgba(0,0,0,0.7)"
  }
  return converted
}

export const harmonyOptions: { value: HarmonyRule; label: string }[] = [
  { value: "Monochromatic (1)", label: "Monochromatic (1)" },
  { value: "Analogous (3)", label: "Analogous (3)" },
  { value: "Analogous (5)", label: "Analogous (5)" },
  { value: "Accented Analogous (4)", label: "Accented Analogous (4)" },
  { value: "Complementary (2)", label: "Complementary (2)" },
  { value: "Split Complementary (3)", label: "Split Complementary (3)" },
  { value: "Double Split Complementary (5)", label: "Double Split Complementary (5)" },
  { value: "Triadic (3)", label: "Triadic (3)" },
  { value: "Tetradic (4)", label: "Tetradic (4)" },
  { value: "Square (4)", label: "Square (4)" },
  { value: "Compound (3)", label: "Compound (3)" },
  { value: "Six Tone (6)", label: "Six Tone (6)" },
  { value: "Golden Ratio (4)", label: "Golden Ratio (4)" },
  { value: "Natural (3)", label: "Natural (3)" },
  { value: "Vivid & Pastel (3)", label: "Vivid & Pastel (3)" },
  { value: "Pentagram (5)", label: "Pentagram (5)" },
  { value: "Hard Clash (3)", label: "Hard Clash (3)" },
  { value: "Double Analogous (4)", label: "Double Analogous (4)" },
  { value: "Full Spectrum (8)", label: "Full Spectrum (8)" },
  { value: "Clash Complementary (3)", label: "Clash Complementary (3)" },
  { value: "Synthwave (3)", label: "Synthwave (3)" },
  { value: "Analogous Clash (3)", label: "Analogous Clash (3)" },
  { value: "Deep Night (3)", label: "Deep Night (3)" },
  { value: "Solar Flare (3)", label: "Solar Flare (3)" },
  { value: "Oceanic (3)", label: "Oceanic (3)" },
  { value: "Forest Edge (3)", label: "Forest Edge (3)" },
  { value: "Cyberpunk (3)", label: "Cyberpunk (3)" },
  { value: "Royal (3)", label: "Royal (3)" },
  { value: "Earthy (3)", label: "Earthy (3)" },
  { value: "Pastel Dreams (3)", label: "Pastel Dreams (3)" }
]

export const variantStrategyOptions: { value: VariantStrategy; label: string }[] = [
  { value: "Tints & Shades", label: "Tints & Shades" },
  { value: "Tones", label: "Tones" },
  { value: "Harmonic Blend", label: "Harmonic Blend" },
  { value: "Vibrant", label: "Vibrant" },
  { value: "Pastel", label: "Pastel" },
  { value: "Deep & Rich", label: "Deep & Rich" },
  { value: "Acid Shift", label: "Acid Shift" },
  { value: "Neon Glow", label: "Neon Glow" },
  { value: "Metallic", label: "Metallic" },
  { value: "Iridescent", label: "Iridescent" },
  { value: "Clay", label: "Clay" },
  { value: "Luminous", label: "Luminous" },
  { value: "Toxic", label: "Toxic" },
  { value: "Vintage", label: "Vintage" },
  { value: "Glacial", label: "Glacial" },
  { value: "Heatwave", label: "Heatwave" },
  { value: "Cinematic", label: "Cinematic" },
  { value: "Memphis", label: "Memphis" },
  { value: "Glitch", label: "Glitch" },
  { value: "Solarized", label: "Solarized" },
  { value: "Nordic", label: "Nordic" },
  { value: "Dracula", label: "Dracula" },
  { value: "Monokai", label: "Monokai" },
  { value: "Gruvbox", label: "Gruvbox" },
  { value: "Shaded Blend", label: "Shaded Blend" },
  { value: "Atmospheric", label: "Atmospheric" },
  { value: "Glossy", label: "Glossy" },
  { value: "X-Ray", label: "X-Ray" },
  { value: "Crystalline", label: "Crystalline" },
  { value: "Radioactive", label: "Radioactive" },
  { value: "Hyper", label: "Hyper" },
  { value: "Velvet", label: "Velvet" },
  { value: "Warm", label: "Warm" },
  { value: "Cool", label: "Cool" }
]

export const thematicPresets = {
  cyberpunk: { h: [300, 320], s: [90, 100], l: [50, 60], harmony: "Analogous (3)" as HarmonyRule, strategy: "Neon Glow" as VariantStrategy },
  cinematic: { h: [190, 220], s: [60, 80], l: [40, 55], harmony: "Split Complementary (3)" as HarmonyRule, strategy: "Cinematic" as VariantStrategy },
  pastel: { h: [0, 360], s: [30, 60], l: [70, 90], harmony: "Analogous (3)" as HarmonyRule, strategy: "Pastel" as VariantStrategy },
  retro: { h: [20, 50], s: [60, 85], l: [45, 65], harmony: "Tetradic (4)" as HarmonyRule, strategy: "Vintage" as VariantStrategy },
  vivid: { h: [0, 360], s: [85, 100], l: [45, 60], harmony: "Triadic (3)" as HarmonyRule, strategy: "Vibrant" as VariantStrategy },
  earthy: { h: [25, 75], s: [25, 50], l: [30, 50], harmony: "Natural (3)" as HarmonyRule, strategy: "Clay" as VariantStrategy },
  popArt: { h: [0, 360], s: [80, 100], l: [50, 60], harmony: "Square (4)" as HarmonyRule, strategy: "Memphis" as VariantStrategy },
  midnight: { h: [220, 270], s: [40, 70], l: [15, 35], harmony: "Monochromatic (1)" as HarmonyRule, strategy: "Deep & Rich" as VariantStrategy },
  psychedelic: { h: [0, 360], s: [90, 100], l: [50, 60], harmony: "Full Spectrum (8)" as HarmonyRule, strategy: "Glitch" as VariantStrategy },
  warm: { h: [0, 60], s: [60, 90], l: [45, 65], harmony: "Analogous (3)" as HarmonyRule, strategy: "Heatwave" as VariantStrategy },
  cool: { h: [170, 250], s: [50, 80], l: [45, 65], harmony: "Analogous (3)" as HarmonyRule, strategy: "Glacial" as VariantStrategy },
  subtle: { h: [0, 360], s: [10, 30], l: [70, 90], harmony: "Monochromatic (1)" as HarmonyRule, strategy: "Tints & Shades" as VariantStrategy },
  neon: { h: [150, 180], s: [90, 100], l: [50, 60], harmony: "Analogous (3)" as HarmonyRule, strategy: "Neon Glow" as VariantStrategy }
}
