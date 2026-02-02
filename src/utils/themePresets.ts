import { HSL, HarmonyRule, VariantStrategy } from "../types"

export interface OpencodePreset {
  id: string
  name: string
  description: string
  // Manual overrides mapping property names to hex colors
  overrides: Record<string, string>
  // Optional: base color and settings for quick preview
  baseColor?: HSL
  harmony?: HarmonyRule
  variantStrategy?: VariantStrategy
}

// Popular Opencode desktop themes as presets
// These define which CSS properties to override for each theme
export const opencodePresets: Record<string, OpencodePreset> = {
  aura: {
    id: "aura",
    name: "Aura",
    description: "Cyan and purple accents with dark background",
    overrides: {
      // Background - darker base
      "background-base": "#0a0e14",
      "background-weak": "#111922",
      "background-strong": "#1a2533",
      "background-stronger": "#242e3d",

      // Surface - subtle dark grays
      "surface-base": "#141b24",
      "surface-base-hover": "#1c2430",
      "surface-base-active": "#252e3c",
      "surface-raised-base": "#1e2634",
      "surface-raised-base-hover": "#26303f",
      "surface-raised-base-active": "#2f3a4a",

      // Text - soft white/gray
      "text-base": "#e6eef5",
      "text-weak": "#a8b5c4",
      "text-weaker": "#768496",
      "text-strong": "#ffffff",

      // Primary - cyan accent
      "primary-base": "#00bcd4",
      "primary-hover": "#00acc1",
      "primary-active": "#009ca8",
      "primary-text": "#ffffff",

      // Accent - purple
      "accent-base": "#9c27b0",
      "accent-hover": "#8e24aa",
      "accent-active": "#7b1fa2",
      "accent-text": "#ffffff",

      // Border
      "border-base": "#2d3a4d",
      "border-weak": "#1f2a3a",
      "border-strong": "#3d4a5e",

      // Icon
      "icon-base": "#a8b5c4",
      "icon-weak": "#768496",
      "icon-strong": "#e6eef5",
    },
    baseColor: { h: 180, s: 60, l: 50 },
    harmony: HarmonyRule.ANALOGOUS,
    variantStrategy: VariantStrategy.VIBRANT,
  },

  ayu: {
    id: "ayu",
    name: "Ayu",
    description: "Warm earth tones with amber accents",
    overrides: {
      // Background - warm dark
      "background-base": "#0f1419",
      "background-weak": "#161d24",
      "background-strong": "#1e262f",
      "background-stronger": "#28323d",

      // Surface - warm dark grays
      "surface-base": "#1a222e",
      "surface-base-hover": "#232e3c",
      "surface-base-active": "#2d3a4a",
      "surface-raised-base": "#242e3c",
      "surface-raised-base-hover": "#2d3a4a",
      "surface-raised-base-active": "#374658",

      // Text - warm white
      "text-base": "#e0e6ed",
      "text-weak": "#aab8c9",
      "text-weaker": "#6f7e94",
      "text-strong": "#f0f4f8",

      // Primary - amber/gold
      "primary-base": "#ffb86c",
      "primary-hover": "#ffaa50",
      "primary-active": "#ff9b35",
      "primary-text": "#0f1419",

      // Accent - warm orange
      "accent-base": "#ff79c6",
      "accent-hover": "#ff65b4",
      "accent-active": "#ff50a2",
      "accent-text": "#0f1419",

      // Border
      "border-base": "#2a3544",
      "border-weak": "#1e262f",
      "border-strong": "#384658",

      // Icon
      "icon-base": "#aab8c9",
      "icon-weak": "#6f7e94",
      "icon-strong": "#e0e6ed",
    },
    baseColor: { h: 35, s: 70, l: 50 },
    harmony: HarmonyRule.ANALOGOUS,
    variantStrategy: VariantStrategy.WARM,
  },

  oc1: {
    id: "oc1",
    name: "OC-1",
    description: "Clean minimal gray with subtle blue hints",
    overrides: {
      // Background - clean dark gray
      "background-base": "#121212",
      "background-weak": "#1a1a1a",
      "background-strong": "#222222",
      "background-stronger": "#2d2d2d",

      // Surface - minimal grays
      "surface-base": "#1e1e1e",
      "surface-base-hover": "#282828",
      "surface-base-active": "#333333",
      "surface-raised-base": "#262626",
      "surface-raised-base-hover": "#303030",
      "surface-raised-base-active": "#3d3d3d",

      // Text - clean white
      "text-base": "#e0e0e0",
      "text-weak": "#b0b0b0",
      "text-weaker": "#808080",
      "text-strong": "#ffffff",

      // Primary - subtle blue
      "primary-base": "#4a90e2",
      "primary-hover": "#357abd",
      "primary-active": "#2564aa",
      "primary-text": "#ffffff",

      // Accent - teal
      "accent-base": "#50e3c2",
      "accent-hover": "#3dd1b0",
      "accent-active": "#2abf9e",
      "accent-text": "#121212",

      // Border
      "border-base": "#333333",
      "border-weak": "#262626",
      "border-strong": "#404040",

      // Icon
      "icon-base": "#b0b0b0",
      "icon-weak": "#808080",
      "icon-strong": "#e0e0e0",
    },
    baseColor: { h: 210, s: 50, l: 50 },
    harmony: HarmonyRule.MONOCHROMATIC,
    variantStrategy: VariantStrategy.TINTS_SHADES,
  },

  shadesOfPurple: {
    id: "shadesOfPurple",
    name: "Shades of Purple",
    description: "Rich purple tones with magenta highlights",
    overrides: {
      // Background - dark purple base
      "background-base": "#1a1b26",
      "background-weak": "#242638",
      "background-strong": "#2e304a",
      "background-stronger": "#383a5c",

      // Surface - purple-tinted grays
      "surface-base": "#262942",
      "surface-base-hover": "#313356",
      "surface-base-active": "#3c3e6a",
      "surface-raised-base": "#2f324f",
      "surface-raised-base-hover": "#3a3d63",
      "surface-raised-base-active": "#454877",

      // Text - soft purple-white
      "text-base": "#e0d8f0",
      "text-weak": "#b8a8d0",
      "text-weaker": "#8070a0",
      "text-strong": "#f0e8ff",

      // Primary - vibrant purple
      "primary-base": "#c792ea",
      "primary-hover": "#b676db",
      "primary-active": "#a55acc",
      "primary-text": "#1a1b26",

      // Accent - magenta
      "accent-base": "#f7768e",
      "accent-hover": "#e45c76",
      "accent-active": "#d1425e",
      "accent-text": "#1a1b26",

      // Secondary - soft blue-purple
      "secondary-base": "#7dcfff",
      "secondary-hover": "#67b7df",
      "secondary-active": "#51a2cf",
      "secondary-text": "#1a1b26",

      // Border
      "border-base": "#3d4066",
      "border-weak": "#2e304a",
      "border-strong": "#4c507f",

      // Icon
      "icon-base": "#b8a8d0",
      "icon-weak": "#8070a0",
      "icon-strong": "#e0d8f0",

      // Surface raised strong
      "surface-raised-strong": "#3e4168",
    },
    baseColor: { h: 270, s: 40, l: 45 },
    harmony: HarmonyRule.ANALOGOUS,
    variantStrategy: VariantStrategy.DEEP,
  },
}

export const presetIds = Object.keys(opencodePresets) as Array<keyof typeof opencodePresets>

export const getPreset = (id: string): OpencodePreset | null => {
  return opencodePresets[id] || null
}

export const getPresetOverrides = (id: string): Record<string, string> => {
  const preset = getPreset(id)
  return preset?.overrides || {}
}
