
export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export type ColorSpace = 
  | 'HSL' 
  | 'HSV'
  | 'HWB'
  | 'CAM02' 
  | 'HSLuv' 
  | 'OkLCh' 
  | 'LCh D50' 
  | 'LCh D65' 
  | 'IPT' 
  | 'LCh(uv)'
  | 'XYZ D50'
  | 'XYZ D65'
  | 'CMY'
  | 'CMYK'
  | 'RYB';

export type OutputSpace = 
  | 'sRGB' 
  | 'P3' 
  | 'AdobeRGB' 
  | 'sRGB Linear' 
  | 'P3 Linear'
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

export enum HarmonyRule {
  MONOCHROMATIC = 'Monochromatic (1)',
  ANALOGOUS = 'Analogous (3)',
  ANALOGOUS_5 = 'Analogous (5)',
  ACCENTED_ANALOGOUS = 'Accented Analogous (4)',
  COMPLEMENTARY = 'Complementary (2)',
  SPLIT_COMPLEMENTARY = 'Split Complementary (3)',
  DOUBLE_SPLIT_COMPLEMENTARY = 'Double Split Complementary (5)',
  TRIADIC = 'Triadic (3)',
  TETRADIC = 'Tetradic (4)',
  SQUARE = 'Square (4)',
  COMPOUND = 'Compound (3)',
  SHADES = 'Shades (1)',
  SIX_TONE = 'Six Tone (6)',
  GOLDEN = 'Golden Ratio (4)',
  NATURAL = 'Natural (3)',
  VIVID_PASTEL = 'Vivid & Pastel (3)',
  PENTAGRAM = 'Pentagram (5)',
  HARD_CLASH = 'Hard Clash (3)',
  DOUBLE_ANALOGOUS = 'Double Analogous (4)',
  FULL_SPECTRUM = 'Full Spectrum (8)',
  CLASH_COMPLEMENTARY = 'Clash Complementary (3)',
  SYNTHWAVE = 'Synthwave (3)',
  ANALOGOUS_CLASH = 'Analogous Clash (3)',
  // Extended rules from generator
  DEEP_NIGHT = 'Deep Night (3)',
  SOLAR_FLARE = 'Solar Flare (3)',
  OCEANIC = 'Oceanic (3)',
  FOREST_EDGE = 'Forest Edge (3)',
  CYBERPUNK = 'Cyberpunk (3)',
  ROYAL = 'Royal (3)',
  EARTHY = 'Earthy (3)',
  PASTEL_DREAMS = 'Pastel Dreams (3)'
}

export enum VariantStrategy {
  TINTS_SHADES = 'Tints & Shades',
  TONES = 'Tones',
  BLEND = 'Harmonic Blend',
  VIBRANT = 'Vibrant',
  SHADED_BLEND = 'Shaded Blend',
  ATMOSPHERIC = 'Atmospheric',
  PASTEL = 'Pastel',
  DEEP = 'Deep & Rich',
  ACID = 'Acid Shift',
  NEON = 'Neon Glow',
  METALLIC = 'Metallic',
  IRIDESCENT = 'Iridescent',
  CLAY = 'Clay',
  GLOSSY = 'Glossy',
  X_RAY = 'X-Ray',
  CRYSTALLINE = 'Crystalline',
  RADIOACTIVE = 'Radioactive',
  HYPER = 'Hyper',
  LUMINOUS = 'Luminous',
  VELVET = 'Velvet',
  TOXIC = 'Toxic',
  VINTAGE = 'Vintage',
  WARM = 'Warm',
  COOL = 'Cool',
  GLACIAL = 'Glacial',
  HEATWAVE = 'Heatwave',
  CINEMATIC = 'Cinematic',
  MEMPHIS = 'Memphis',
  GLITCH = 'Glitch',
  SOLARIZED = 'Solarized',
  NORDIC = 'Nordic',
  DRACULA = 'Dracula',
  MONOKAI = 'Monokai',
  GRUVBOX = 'Gruvbox'
}

export interface ColorStop {
  hsl: HSL;
  hex: string;
  displayString: string;
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
}

export interface SeedColor {
  name: string;
  hex: string;
  hsl: HSL;
}

export type SeedName = 
  | "primary" 
  | "neutral" 
  | "success" 
  | "warning" 
  | "error" 
  | "info" 
  | "interactive" 
  | "diffAdd" 
  | "diffDelete";

export type OpencodeThemeColors = Record<string, string>;
