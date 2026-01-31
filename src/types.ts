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
  | 'Analogous Clash (3)';

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
  | 'Glacial'
  | 'Heatwave'
  | 'Cinematic'
  | 'Memphis'
  | 'Glitch';

export interface ColorStop {
  hsl: HSL;
  hex: string;
  name: string;
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
  background: string;
  backgroundWeak: string;
  backgroundStrong: string;
  backgroundStronger: string;
  surfaceBase: string;
  surfaceBaseHover: string;
  surfaceBaseActive: string;
  surfaceRaised: string;
  surfaceRaisedHover: string;
  surfaceRaisedActive: string;
  surfaceRaisedStrong: string;
  surfaceWeak: string;
  surfaceWeaker: string;
  surfaceStrong: string;
  foreground: string;
  foregroundWeak: string;
  foregroundWeaker: string;
  foregroundStrong: string;
  textOnBrand: string;
  borderBase: string;
  borderWeak: string;
  borderStrong: string;
  borderSelected: string;
  focusRing: string;
  iconBase: string;
  iconWeak: string;
  iconStrong: string;
  lineIndicator: string;
  lineIndicatorActive: string;
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryText: string;
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryText: string;
  accent: string;
  accentHover: string;
  accentActive: string;
  accentText: string;
  success: string;
  successHover: string;
  successActive: string;
  successText: string;
  warning: string;
  warningHover: string;
  warningActive: string;
  warningText: string;
  critical: string;
  criticalHover: string;
  criticalActive: string;
  criticalText: string;
  info: string;
  infoHover: string;
  infoActive: string;
  infoText: string;
  codeBackground: string;
  codeForeground: string;
  tabActive: string;
  tabInactive: string;
  tabHover: string;
  diffAddBackground: string;
  diffAddForeground: string;
  diffRemoveBackground: string;
  diffRemoveForeground: string;
  avatarBackground: string;
  avatarForeground: string;
  scrollbarThumb: string;
  scrollbarTrack: string;
  shadow: string;
  overlay: string;
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
