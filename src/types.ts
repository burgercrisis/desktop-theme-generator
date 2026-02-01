export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type OutputSpace =
  | 'sRGB'
  | 'sRGB Linear'
  | 'P3'
  | 'P3 Linear'
  | 'AdobeRGB'
  | 'ProPhoto RGB'
  | 'Rec.709'
  | 'Rec.2020'
  | 'Rec.2100 HLG'
  | 'Rec.2100 PQ'
  | 'ICtCp'
  | 'ACES 2065-1'
  | 'ACEScc'
  | 'ACEScct'
  | 'ACEScg'
  | 'HSL'
  | 'HSV'
  | 'HWB'
  | 'XYZ D50'
  | 'XYZ D65'
  | 'CMY'
  | 'CMYK'
  | 'RYB';

export type HarmonyRule =
  | 'Monochromatic (1)'
  | 'Analogous (3)'
  | 'Analogous (5)'
  | 'Accented Analogous (4)'
  | 'Complementary (2)'
  | 'Split Complementary (3)'
  | 'Double Split Complementary (5)'
  | 'Triadic (3)'
  | 'Tetradic (4)'
  | 'Square (4)'
  | 'Compound (3)'
  | 'Shades (1)'
  | 'Six Tone (6)'
  | 'Golden Ratio (4)'
  | 'Natural (3)'
  | 'Vivid & Pastel (3)'
  | 'Pentagram (5)'
  | 'Hard Clash (3)'
  | 'Double Analogous (4)'
  | 'Full Spectrum (8)'
  | 'Clash Complementary (3)'
  | 'Synthwave (3)'
  | 'Analogous Clash (3)'
  | 'Deep Night (3)'
  | 'Solar Flare (3)'
  | 'Oceanic (3)'
  | 'Forest Edge (3)'
  | 'Cyberpunk (3)'
  | 'Royal (3)'
  | 'Earthy (3)'
  | 'Pastel Dreams (3)';

export type VariantStrategy =
  | 'Tints & Shades'
  | 'Tones'
  | 'Harmonic Blend'
  | 'Vibrant'
  | 'Shaded Blend'
  | 'Atmospheric'
  | 'Pastel'
  | 'Deep & Rich'
  | 'Acid Shift'
  | 'Neon Glow'
  | 'Metallic'
  | 'Iridescent'
  | 'Clay'
  | 'Glossy'
  | 'X-Ray'
  | 'Crystalline'
  | 'Radioactive'
  | 'Hyper'
  | 'Luminous'
  | 'Velvet'
  | 'Toxic'
  | 'Vintage'
  | 'Warm'
  | 'Cool'
  | 'Glacial'
  | 'Heatwave'
  | 'Cinematic'
  | 'Memphis'
  | 'Glitch'
  | 'Solarized'
  | 'Nordic'
  | 'Dracula'
  | 'Monokai'
  | 'Gruvbox';

export type ColorSpace = 'HSL' | 'CAM02' | 'HSLuv' | 'LCh D50' | 'LCh D65' | 'OkLCh' | 'IPT' | 'LCh(uv)';

export interface ColorStop {
  hsl: HSL;
  hex: string;
  displayString?: string;
  name?: string;
  isBase?: boolean;
  cam02?: { j: number, c: number, h: number };
  hsluv?: { h: number, s: number, l: number };
  coords?: { l: number, c: number, h: number, a?: number, b?: number };
}

export interface PaletteGroup {
  base: ColorStop;
  variants: ColorStop[];
}

export interface DesktopTheme {
  name: string;
  colors: InternalThemeColors;
  palette: ColorStop[];
}

export interface InternalThemeColors {
  [key: string]: string;
  // Background
  "background-base": string;
  "background-weak": string;
  "background-strong": string;
  "background-stronger": string;

  // Surface
  "surface-base": string;
  "surface-base-hover": string;
  "surface-base-active": string;
  "surface-raised-base": string;
  "surface-raised-base-hover": string;
  "surface-raised-base-active": string;
  "surface-raised-strong": string;
  "surface-weak": string;
  "surface-weaker": string;
  "surface-strong": string;
  "surface-brand-base": string;
  "surface-brand-hover": string;
  "surface-interactive-base": string;
  "surface-interactive-hover": string;
  "surface-interactive-weak": string;
  "surface-interactive-weak-hover": string;
  "surface-success-base": string;
  "surface-success-weak": string;
  "surface-success-strong": string;
  "surface-warning-base": string;
  "surface-warning-weak": string;
  "surface-warning-strong": string;
  "surface-critical-base": string;
  "surface-critical-weak": string;
  "surface-critical-strong": string;
  "surface-info-base": string;
  "surface-info-weak": string;
  "surface-info-strong": string;

  // Diff Surfaces
  "surface-diff-unchanged-base": string;
  "surface-diff-skip-base": string;
  "surface-diff-add-base": string;
  "surface-diff-add-weak": string;
  "surface-diff-add-weaker": string;
  "surface-diff-add-strong": string;
  "surface-diff-add-stronger": string;
  "surface-diff-delete-base": string;
  "surface-diff-delete-weak": string;
  "surface-diff-delete-weaker": string;
  "surface-diff-delete-strong": string;
  "surface-diff-delete-stronger": string;

  // Text
  "text-base": string;
  "text-weak": string;
  "text-weaker": string;
  "text-strong": string;
  "text-on-brand-base": string;
  "text-interactive-base": string;
  "text-on-interactive-base": string;
  "text-on-success-base": string;
  "text-on-critical-base": string;
  "text-on-warning-base": string;
  "text-on-info-base": string;
  "text-diff-add-base": string;
  "text-diff-delete-base": string;

  // Border
  "border-base": string;
  "border-hover": string;
  "border-active": string;
  "border-selected": string;
  "border-weak-base": string;
  "border-strong-base": string;
  "border-interactive-base": string;
  "border-success-base": string;
  "border-warning-base": string;
  "border-critical-base": string;
  "border-info-base": string;

  // Icon
  "icon-base": string;
  "icon-hover": string;
  "icon-active": string;
  "icon-selected": string;
  "icon-brand-base": string;
  "icon-interactive-base": string;
  "icon-success-base": string;
  "icon-warning-base": string;
  "icon-critical-base": string;
  "icon-info-base": string;

  // Inputs
  "input-base": string;
  "input-hover": string;
  "input-active": string;

  // Other
  "focus-ring": string;
  "scrollbar-thumb": string;
  "scrollbar-track": string;
  "shadow": string;
  "overlay": string;
}

// Opencode-compatible theme colors with kebab-case naming
export interface OpencodeThemeColors {
  [key: string]: string;
}

export type SeedName = 
  | 'neutral' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'interactive' 
  | 'accent'
  | 'critical'
  | 'diffAdd' 
  | 'diffDelete';

export interface SeedColor {
  name: SeedName;
  hsl: HSL;
  hex: string;
}

export interface OpencodeThemeExport {
  name: string;
  id: string;
  light: {
    seeds: Record<SeedName, string>;
    overrides: Partial<OpencodeThemeColors>;
  };
  dark: {
    seeds: Record<SeedName, string>;
    overrides: Partial<OpencodeThemeColors>;
  };
}

export interface ThemePreset {
  id: string;
  name: string;
  baseColor: HSL;
  harmony: HarmonyRule;
  variantStrategy: VariantStrategy;
  variantCount: number;
  contrast: number;
  spread: number;
}
