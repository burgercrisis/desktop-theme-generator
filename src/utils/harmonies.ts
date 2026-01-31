import { hslToHex } from "./colorUtils"
import { HSL, HarmonyRule, VariantStrategy, ColorStop, PaletteGroup, SeedColor, OpencodeThemeColors, InternalThemeColors, SeedName } from "../types"

const normalizeHue = (h: number): number => {
  const normalized = h % 360
  return normalized < 0 ? normalized + 360 : normalized
}

export const generateHarmony = (baseColor: HSL, rule: HarmonyRule, spread: number): PaletteGroup[] => {
  let steps: { hOffset: number; name: string }[] = []
  switch (rule) {
    case "Analogous (3)":
      steps = [{ hOffset: -spread, name: "secondary" }, { hOffset: 0, name: "primary" }, { hOffset: spread, name: "accent" }]
      break
    case "Analogous (5)":
      steps = [{ hOffset: -spread * 2, name: "secondary" }, { hOffset: -spread, name: "secondaryAccent" }, { hOffset: 0, name: "primary" }, { hOffset: spread, name: "accent" }, { hOffset: spread * 2, name: "accentSecondary" }]
      break
    case "Monochromatic (1)":
      steps = [{ hOffset: 0, name: "primary" }]
      break
    case "Triadic (3)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: 120, name: "secondary" }, { hOffset: 240, name: "accent" }]
      break
    case "Tetradic (4)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: spread, name: "secondary" }, { hOffset: 180, name: "accent" }, { hOffset: 180 + spread, name: "info" }]
      break
    case "Square (4)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: 90, name: "secondary" }, { hOffset: 180, name: "accent" }, { hOffset: 270, name: "info" }]
      break
    case "Split Complementary (3)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: 180 - spread, name: "secondary" }, { hOffset: 180 + spread, name: "accent" }]
      break
    case "Double Split Complementary (5)":
      steps = [{ hOffset: -spread, name: "secondary" }, { hOffset: 0, name: "primary" }, { hOffset: spread, name: "accent" }, { hOffset: 180 - spread, name: "info" }, { hOffset: 180 + spread, name: "warning" }]
      break
    case "Compound (3)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: spread, name: "secondary" }, { hOffset: 180 - spread, name: "accent" }]
      break
    case "Double Analogous (4)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: spread, name: "secondary" }, { hOffset: 120, name: "accent" }, { hOffset: 120 + spread, name: "warning" }]
      break
    case "Six Tone (6)":
      steps = [0, spread, spread * 2, spread * 3, spread * 4, spread * 5].map((deg, i) => ({ hOffset: deg, name: ["primary", "secondary", "accent", "info", "warning", "critical"][i] }))
      break
    case "Pentagram (5)":
      steps = [0, spread, spread * 2, spread * 3, spread * 4].map((deg, i) => ({ hOffset: deg, name: ["primary", "secondary", "accent", "info", "warning"][i] }))
      break
    case "Full Spectrum (8)":
      steps = Array.from({ length: 8 }, (_, i) => ({ hOffset: i * spread, name: ["primary", "secondary", "accent", "info", "warning", "critical", "neutral", "interactive"][i] }))
      break
    case "Clash Complementary (3)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: spread, name: "secondary" }, { hOffset: 180, name: "accent" }]
      break
    case "Synthwave (3)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: 180, name: "secondary" }, { hOffset: 180 + spread, name: "accent" }]
      break
    case "Analogous Clash (3)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: spread, name: "secondary" }, { hOffset: spread * 3, name: "accent" }]
      break
    case "Natural (3)":
      steps = [{ hOffset: -30, name: "secondary" }, { hOffset: 0, name: "primary" }, { hOffset: 30, name: "accent" }]
      break
    case "Shades (1)":
      steps = [{ hOffset: 0, name: "primary" }]
      break
    case "Hard Clash (3)":
      steps = [{ hOffset: 0, name: "primary" }, { hOffset: 60, name: "secondary" }, { hOffset: 180, name: "accent" }]
      break
    default:
      steps = [{ hOffset: -spread, name: "secondary" }, { hOffset: 0, name: "primary" }, { hOffset: spread, name: "accent" }]
  }
  return steps.map((step) => {
    const h = normalizeHue(baseColor.h + step.hOffset)
    return { base: { hsl: { h, s: baseColor.s, l: baseColor.l }, hex: hslToHex(h, baseColor.s, baseColor.l), name: step.name }, variants: [] }
  })
}

export const generateVariants = (hsl: HSL, steps: number, contrast: number, strategy: VariantStrategy, prevHsl?: HSL, nextHsl?: HSL): ColorStop[] => {
  const variants: ColorStop[] = []
  const { h, s, l } = hsl
  const range = contrast / 100
  const generateVariant = (t: number, isLeft: boolean) => {
    const stop: HSL = { h, s, l }
    switch (strategy) {
      case "Tints & Shades":
        if (isLeft) stop.l = Math.max(0, l - (l * range * t))
        else stop.l = Math.min(100, l + ((100 - l) * range * t))
        break
      case "Tones":
        stop.s = Math.max(0, s - (30 * t))
        if (isLeft) stop.l = Math.max(0, l - (l * range * t))
        else stop.l = Math.min(100, l + ((100 - l) * range * t))
        break
      case "Neon Glow":
        stop.s = 100
        if (isLeft) stop.l = Math.max(10, l - (l * range * t * 0.7))
        else stop.l = Math.min(100, l + ((100 - l) * range * t * 0.7))
        break
      case "Vibrant":
        stop.s = Math.min(100, s + 20)
        if (isLeft) stop.l = Math.max(0, l - (l * range * t))
        else stop.l = Math.min(100, l + ((100 - l) * range * t))
        break
      case "Pastel":
        stop.s = Math.max(0, s - 40)
        stop.l = Math.min(100, l + ((100 - l) * t))
        break
      case "Vintage":
        stop.s = Math.max(0, s - 20)
        if (isLeft) stop.l = Math.max(0, l - (l * range * t * 0.5))
        else stop.l = Math.min(100, l + ((100 - l) * range * t * 0.5))
        break
      case "Clay":
        if (isLeft) stop.l = Math.max(0, l - (l * range * t))
        else stop.l = Math.min(100, l + ((100 - l) * range * t))
        break
      case "Deep & Rich":
        stop.s = Math.max(0, s + 10)
        if (isLeft) stop.l = Math.max(0, l - (l * range * t))
        else stop.l = Math.min(100, l + ((100 - l) * range * t))
        break
      case "Glacial":
        stop.s = Math.max(0, s - 20)
        if (isLeft) stop.l = Math.max(0, l - (l * range * t))
        else stop.l = Math.min(100, l + ((100 - l) * range * t))
        break
      case "Heatwave":
        stop.s = Math.min(100, s + 30)
        if (isLeft) stop.l = Math.max(0, l - (l * range * t))
        else stop.l = Math.min(100, l + ((100 - l) * range * t))
        break
      case "Cinematic":
        if (prevHsl && nextHsl) {
          stop.h = (isLeft ? prevHsl : nextHsl).h
          stop.s = (isLeft ? prevHsl : nextHsl).s
          stop.l = Math.max(0, l - (l * range * t))
        } else {
          if (isLeft) stop.l = Math.max(0, l - (l * range * t))
          else stop.l = Math.min(100, l + ((100 - l) * range * t))
        }
        break
      case "Memphis":
        const segment = Math.floor(t * 4)
        if (isLeft) stop.l = l - (l * range * t)
        else stop.l = l + ((100 - l) * range * t)
        stop.s = Math.min(100, s + (segment % 2 !== 0 ? 20 : 0))
        break
      case "Glitch":
        const glitchRange = range * 1.5
        const glitchT = t * 2
        if (isLeft) {
          stop.l = Math.max(0, l - (l * glitchRange * glitchT))
          stop.h = normalizeHue(h + (glitchT * 30))
        } else {
          stop.l = Math.min(100, l + ((100 - l) * glitchRange * glitchT))
          stop.h = normalizeHue(h - (glitchT * 30))
        }
        break
      default:
        if (isLeft) stop.l = Math.max(0, l - (l * range * t))
        else stop.l = Math.min(100, l + ((100 - l) * range * t))
    }
    return { hsl: stop, hex: hslToHex(stop.h, Math.min(100, stop.s), Math.min(100, Math.max(0, stop.l))), name: isLeft ? `Dark ${t.toFixed(1)}` : `Light ${t.toFixed(1)}` }
  }
  for (let i = steps; i > 0; i--) variants.push(generateVariant(i / (steps + 1), true))
  variants.push({ hsl: { h, s, l }, hex: hslToHex(h, s, l), name: "Base" })
  for (let i = 1; i <= steps; i++) variants.push(generateVariant(i / (steps + 1), false))
  return variants
}

export const generateThemeColors = (paletteGroups: PaletteGroup[], baseColor: HSL): InternalThemeColors => {
  const primary = paletteGroups[0]?.base.hex || hslToHex(baseColor.h, baseColor.s, baseColor.l)
  const secondary = paletteGroups[1]?.base.hex || hslToHex((baseColor.h + 120) % 360, baseColor.s, baseColor.l)
  const accent = paletteGroups[2]?.base.hex || hslToHex((baseColor.h + 60) % 360, baseColor.s, baseColor.l)
  const success = paletteGroups[3]?.base.hex || hslToHex((baseColor.h + 90) % 360, Math.min(100, baseColor.s + 20), 40)
  const warning = paletteGroups[4]?.base.hex || hslToHex((baseColor.h + 45) % 360, Math.min(100, baseColor.s + 30), 45)
  const critical = paletteGroups[5]?.base.hex || hslToHex((baseColor.h - 15 + 360) % 360, Math.min(100, baseColor.s + 20), 45)
  const info = paletteGroups[6]?.base.hex || hslToHex((baseColor.h + 180) % 360, Math.min(100, baseColor.s + 10), 50)
  const getAt = (arr: string[], index: number, fallback: string): string => arr[index] || fallback
  const pLight = [...(paletteGroups[0]?.variants || [])].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const pDark = [...(paletteGroups[0]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)
  const sLight = [...(paletteGroups[1]?.variants || [])].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const aLight = [...(paletteGroups[2]?.variants || [])].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const sucLight = [...(paletteGroups[3]?.variants || [])].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const sucDark = [...(paletteGroups[3]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)
  const criLight = [...(paletteGroups[5]?.variants || [])].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex)
  const criDark = [...(paletteGroups[5]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex)
  return {
    background: getAt(pLight, 0, primary),
    backgroundWeak: getAt(pLight, 1, primary),
    backgroundStrong: getAt(pLight, 2, primary),
    backgroundStronger: getAt(pLight, 3, primary),
    surfaceBase: getAt(pLight, 4, primary),
    surfaceBaseHover: getAt(pLight, 5, primary),
    surfaceBaseActive: getAt(pLight, 6, primary),
    surfaceRaised: getAt(pLight, 3, primary),
    surfaceRaisedHover: getAt(pLight, 4, primary),
    surfaceRaisedActive: getAt(pLight, 5, primary),
    surfaceRaisedStrong: getAt(pLight, 5, primary),
    surfaceWeak: getAt(sLight, 2, primary),
    surfaceWeaker: getAt(sLight, 3, primary),
    surfaceStrong: getAt(aLight, 2, primary),
    foreground: getAt(pDark, 0, primary),
    foregroundWeak: getAt(pDark, 1, primary),
    foregroundWeaker: getAt(pDark, 2, primary),
    foregroundStrong: getAt(pDark, 0, primary),
    textOnBrand: getAt(pLight, 1, primary),
    borderBase: getAt(sLight, 3, primary),
    borderWeak: getAt(sLight, 4, primary),
    borderStrong: getAt(sLight, 2, primary),
    borderSelected: getAt(aLight, 2, primary),
    focusRing: getAt(aLight, 1, primary),
    iconBase: getAt(pLight, 5, primary),
    iconWeak: getAt(pLight, 6, primary),
    iconStrong: getAt(pDark, 2, primary),
    lineIndicator: getAt(pDark, 3, primary),
    lineIndicatorActive: getAt(pDark, 2, primary),
    primary: primary,
    primaryHover: getAt(pDark, 1, primary),
    primaryActive: getAt(pDark, 2, primary),
    primaryText: getAt(pLight, 1, primary),
    secondary: secondary,
    secondaryHover: getAt([...(paletteGroups[1]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex), 1, secondary),
    secondaryActive: getAt([...(paletteGroups[1]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex), 2, secondary),
    secondaryText: getAt(sLight, 1, secondary),
    accent: accent,
    accentHover: getAt([...(paletteGroups[2]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex), 1, accent),
    accentActive: getAt([...(paletteGroups[2]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex), 2, accent),
    accentText: getAt(aLight, 1, accent),
    success: success,
    successHover: getAt(sucDark, 1, success),
    successActive: getAt(sucDark, 2, success),
    successText: getAt(sucLight, 1, success),
    warning: warning,
    warningHover: getAt([...(paletteGroups[4]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex), 1, warning),
    warningActive: getAt([...(paletteGroups[4]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex), 2, warning),
    warningText: getAt([...(paletteGroups[4]?.variants || [])].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex), 1, warning),
    critical: critical,
    criticalHover: getAt(criDark, 1, critical),
    criticalActive: getAt(criDark, 2, critical),
    criticalText: getAt(criLight, 1, critical),
    info: info,
    infoHover: getAt([...(paletteGroups[6]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex), 1, info),
    infoActive: getAt([...(paletteGroups[6]?.variants || [])].sort((a, b) => a.hsl.l - b.hsl.l).map(v => v.hex), 2, info),
    infoText: getAt([...(paletteGroups[6]?.variants || [])].sort((a, b) => b.hsl.l - a.hsl.l).map(v => v.hex), 1, info),
    codeBackground: getAt(pLight, 3, primary),
    codeForeground: getAt(pDark, 0, primary),
    tabActive: getAt(pLight, 1, primary),
    tabInactive: getAt(pLight, 2, primary),
    tabHover: getAt(pLight, 3, primary),
    diffAddBackground: getAt(sucLight, 3, success),
    diffAddForeground: getAt(sucDark, 1, success),
    diffRemoveBackground: getAt(criLight, 3, critical),
    diffRemoveForeground: getAt(criDark, 1, critical),
    avatarBackground: getAt(sLight, 2, secondary),
    avatarForeground: getAt(sLight, 1, secondary),
    scrollbarThumb: getAt(pLight, 5, primary),
    scrollbarTrack: getAt(pLight, 6, primary),
    shadow: getAt(criDark, 1, critical),
    overlay: getAt(pLight, 4, primary)
  }
}

export const harmonyOptions: { value: HarmonyRule; label: string }[] = [
  { value: "Analogous (3)", label: "Analogous (3)" },
  { value: "Analogous (5)", label: "Analogous (5)" },
  { value: "Monochromatic (1)", label: "Monochromatic (1)" },
  { value: "Triadic (3)", label: "Triadic (3)" },
  { value: "Tetradic (4)", label: "Tetradic (4)" },
  { value: "Square (4)", label: "Square (4)" },
  { value: "Split Complementary (3)", label: "Split Complementary (3)" },
  { value: "Double Split Complementary (5)", label: "Double Split Complementary (5)" },
  { value: "Compound (3)", label: "Compound (3)" },
  { value: "Double Analogous (4)", label: "Double Analogous (4)" },
  { value: "Six Tone (6)", label: "Six Tone (6)" },
  { value: "Pentagram (5)", label: "Pentagram (5)" },
  { value: "Full Spectrum (8)", label: "Full Spectrum (8)" },
  { value: "Clash Complementary (3)", label: "Clash Complementary (3)" },
  { value: "Synthwave (3)", label: "Synthwave (3)" },
  { value: "Analogous Clash (3)", label: "Analogous Clash (3)" },
  { value: "Natural (3)", label: "Natural (3)" },
  { value: "Shades (1)", label: "Shades (1)" },
  { value: "Hard Clash (3)", label: "Hard Clash (3)" }
]

export const variantStrategyOptions: { value: VariantStrategy; label: string }[] = [
  { value: "Tints & Shades", label: "Tints & Shades" },
  { value: "Tones", label: "Tones" },
  { value: "Neon Glow", label: "Neon Glow" },
  { value: "Vibrant", label: "Vibrant" },
  { value: "Pastel", label: "Pastel" },
  { value: "Vintage", label: "Vintage" },
  { value: "Clay", label: "Clay" },
  { value: "Deep & Rich", label: "Deep & Rich" },
  { value: "Glacial", label: "Glacial" },
  { value: "Heatwave", label: "Heatwave" },
  { value: "Cinematic", label: "Cinematic" },
  { value: "Memphis", label: "Memphis" },
  { value: "Glitch", label: "Glitch" }
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

export const generate9SeedHarmony = (baseColor: HSL, _rule?: HarmonyRule, _spread?: number): SeedColor[] => [
  { name: "neutral", hex: "#8e8b8b", hsl: { h: 20, s: 5, l: 55 } },
  { name: "primary", hex: hslToHex(baseColor.h, baseColor.s, baseColor.l), hsl: baseColor },
  { name: "interactive", hex: "#0db9d7", hsl: { h: 190, s: 85, l: 48 } },
  { name: "success", hex: "#12c905", hsl: { h: 115, s: 70, l: 40 } },
  { name: "error", hex: "#fc533a", hsl: { h: 5, s: 85, l: 52 } },
  { name: "info", hex: "#a753ae", hsl: { h: 295, s: 55, l: 52 } },
  { name: "warning", hex: "#ffb224", hsl: { h: 40, s: 95, l: 50 } },
  { name: "accent", hex: "#f3d398", hsl: { h: 40, s: 85, l: 70 } },
  { name: "critical", hex: "#fc533a", hsl: { h: 5, s: 85, l: 52 } }
]

export const generateOpencodeThemeColors = (seeds: SeedColor[], variants: Record<SeedName, string[]>): OpencodeThemeColors => {
  const getAt = (arr: string[], index: number, fallback: string): string => arr[index] || fallback
  const primaryHex = seeds.find(s => s.name === "primary")?.hex || "#6366f1"
  const interactiveHex = seeds.find(s => s.name === "interactive")?.hex || "#0db9d7"
  const successHex = seeds.find(s => s.name === "success")?.hex || "#12c905"
  const errorHex = seeds.find(s => s.name === "error")?.hex || "#fc533a"
  const infoHex = seeds.find(s => s.name === "info")?.hex || "#a753ae"
  const warningHex = seeds.find(s => s.name === "warning")?.hex || "#ffb224"
  const accentHex = seeds.find(s => s.name === "accent")?.hex || "#f3d398"
  const neutralHex = seeds.find(s => s.name === "neutral")?.hex || "#8e8b8b"
  return {
    "background-base": getAt(variants.primary || [], 0, primaryHex),
    "background-weak": getAt(variants.primary || [], 1, primaryHex),
    "background-strong": getAt(variants.primary || [], 2, primaryHex),
    "background-stronger": getAt(variants.primary || [], 3, primaryHex),
    "surface-base": getAt(variants.primary || [], 4, primaryHex),
    "surface-base-hover": getAt(variants.primary || [], 5, primaryHex),
    "surface-base-active": getAt(variants.primary || [], 6, primaryHex),
    "surface-raised-base": getAt(variants.primary || [], 3, primaryHex),
    "surface-raised-base-hover": getAt(variants.primary || [], 4, primaryHex),
    "surface-raised-base-active": getAt(variants.primary || [], 5, primaryHex),
    "surface-raised-strong": getAt(variants.primary || [], 5, primaryHex),
    "surface-weak": getAt(variants.neutral || [], 2, neutralHex),
    "surface-weaker": getAt(variants.neutral || [], 3, neutralHex),
    "surface-strong": getAt(variants.accent || [], 2, accentHex),
    "text-base": getAt([...(variants.primary || [])].reverse(), 0, primaryHex),
    "text-weak": getAt([...(variants.primary || [])].reverse(), 1, primaryHex),
    "text-weaker": getAt([...(variants.primary || [])].reverse(), 2, primaryHex),
    "text-strong": getAt([...(variants.primary || [])].reverse(), 0, primaryHex),
    "text-on-brand-base": getAt(variants.primary || [], 1, primaryHex),
    "border-base": getAt(variants.neutral || [], 3, neutralHex),
    "border-weak": getAt(variants.neutral || [], 4, neutralHex),
    "border-strong": getAt(variants.neutral || [], 2, neutralHex),
    "border-selected": getAt(variants.interactive || [], 2, interactiveHex),
    "icon-base": getAt(variants.primary || [], 5, primaryHex),
    "icon-weak": getAt(variants.primary || [], 6, primaryHex),
    "icon-strong": getAt([...(variants.primary || [])].reverse(), 2, primaryHex),
    "primary-base": primaryHex,
    "primary-hover": getAt([...(variants.primary || [])].reverse(), 1, primaryHex),
    "primary-active": getAt([...(variants.primary || [])].reverse(), 2, primaryHex),
    "primary-text": getAt(variants.primary || [], 1, primaryHex),
    "secondary-base": infoHex,
    "secondary-hover": getAt([...(variants.info || [])].reverse(), 1, infoHex),
    "secondary-active": getAt([...(variants.info || [])].reverse(), 2, infoHex),
    "secondary-text": getAt(variants.info || [], 1, infoHex),
    "accent-base": interactiveHex,
    "accent-hover": getAt([...(variants.interactive || [])].reverse(), 1, interactiveHex),
    "accent-active": getAt([...(variants.interactive || [])].reverse(), 2, interactiveHex),
    "accent-text": getAt(variants.interactive || [], 1, interactiveHex),
    "success-base": successHex,
    "success-hover": getAt([...(variants.success || [])].reverse(), 1, successHex),
    "success-active": getAt([...(variants.success || [])].reverse(), 2, successHex),
    "success-text": getAt(variants.success || [], 1, successHex),
    "warning-base": warningHex,
    "warning-hover": getAt([...(variants.warning || [])].reverse(), 1, warningHex),
    "warning-active": getAt([...(variants.warning || [])].reverse(), 2, warningHex),
    "warning-text": getAt(variants.warning || [], 1, warningHex),
    "critical-base": errorHex,
    "critical-hover": getAt([...(variants.error || [])].reverse(), 1, errorHex),
    "critical-active": getAt([...(variants.error || [])].reverse(), 2, errorHex),
    "critical-text": getAt(variants.error || [], 1, errorHex),
    "info-base": infoHex,
    "info-hover": getAt([...(variants.info || [])].reverse(), 1, infoHex),
    "info-active": getAt([...(variants.info || [])].reverse(), 2, infoHex),
    "info-text": getAt(variants.info || [], 1, infoHex),
    "interactive-base": interactiveHex,
    "interactive-hover": getAt([...(variants.interactive || [])].reverse(), 1, interactiveHex),
    "interactive-active": getAt([...(variants.interactive || [])].reverse(), 2, interactiveHex),
    "interactive-text": getAt(variants.interactive || [], 1, interactiveHex),
    "diff-add-base": getAt(variants.success || [], 3, successHex),
    "diff-add-foreground": getAt([...(variants.success || [])].reverse(), 1, "#0d0d0d"),
    "diff-delete-base": getAt(variants.error || [], 3, errorHex),
    "diff-delete-foreground": getAt([...(variants.error || [])].reverse(), 1, "#0d0d0d"),
    "code-background": getAt(variants.neutral || [], 3, neutralHex),
    "code-foreground": getAt([...(variants.neutral || [])].reverse(), 0, neutralHex),
    "tab-active": getAt(variants.info || [], 1, infoHex),
    "tab-inactive": getAt(variants.primary || [], 6, primaryHex),
    "tab-hover": getAt(variants.info || [], 2, infoHex),
    "line-indicator": getAt([...(variants.neutral || [])].reverse(), 3, neutralHex),
    "line-indicator-active": getAt([...(variants.neutral || [])].reverse(), 2, neutralHex),
    "avatar-background": getAt(variants.info || [], 2, infoHex),
    "avatar-foreground": getAt(variants.info || [], 1, infoHex),
    "scrollbar-thumb": getAt(variants.neutral || [], 5, neutralHex),
    "scrollbar-track": getAt(variants.neutral || [], 7, neutralHex),
    "focus-ring": getAt(variants.interactive || [], 1, interactiveHex),
    "shadow": getAt([...(variants.error || [])].reverse(), 1, errorHex),
    "overlay": getAt(variants.neutral || [], 4, neutralHex)
  }
}
