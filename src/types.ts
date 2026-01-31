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
  colors: OpencodeThemeColors;
  palette: ColorStop[];
}

// Opencode-compatible theme colors with kebab-case naming
export interface OpencodeThemeColors {
  // Background tokens
  'background-base': string;
  'background-weak': string;
  'background-strong': string;
  'background-stronger': string;
  
  // Surface tokens
  'surface-base': string;
  'surface-base-hover': string;
  'surface-base-active': string;
  'surface-raised-base': string;
  'surface-raised-base-hover': string;
  'surface-raised-base-active': string;
  'surface-raised-strong': string;
  'surface-weak': string;
  'surface-weaker': string;
  'surface-strong': string;
  
  // Text tokens
  'text-base': string;
  'text-weak': string;
  'text-weaker': string;
  'text-strong': string;
  'text-on-brand-base': string;
  
  // Border tokens
  'border-base': string;
  'border-weak': string;
  'border-strong': string;
  'border-selected': string;
  
  // Icon tokens
  'icon-base': string;
  'icon-weak': string;
  'icon-strong': string;
  
  // Primary tokens
  'primary-base': string;
  'primary-hover': string;
  'primary-active': string;
  'primary-text': string;
  
  // Secondary tokens (mapped to accent in Opencode)
  'secondary-base': string;
  'secondary-hover': string;
  'secondary-active': string;
  'secondary-text': string;
  
  // Accent tokens (mapped to info in Opencode)
  'accent-base': string;
  'accent-hover': string;
  'accent-active': string;
  'accent-text': string;
  
  // Success tokens
  'success-base': string;
  'success-hover': string;
  'success-active': string;
  'success-text': string;
  
  // Warning tokens
  'warning-base': string;
  'warning-hover': string;
  'warning-active': string;
  'warning-text': string;
  
  // Critical/Error tokens
  'critical-base': string;
  'critical-hover': string;
  'critical-active': string;
  'critical-text': string;
  
  // Info tokens (mapped from accent in current system)
  'info-base': string;
  'info-hover': string;
  'info-active': string;
  'info-text': string;
  
  // Interactive tokens
  'interactive-base': string;
  'interactive-hover': string;
  'interactive-active': string;
  'interactive-text': string;
  
  // Diff tokens
  'diff-add-base': string;
  'diff-add-foreground': string;
  'diff-delete-base': string;
  'diff-delete-foreground': string;
  
  // Code tokens
  'code-background': string;
  'code-foreground': string;
  
  // Tab tokens
  'tab-active': string;
  'tab-inactive': string;
  'tab-hover': string;
  
  // Line indicator
  'line-indicator': string;
  'line-indicator-active': string;
  
  // Avatar tokens
  'avatar-background': string;
  'avatar-foreground': string;
  
  // Scrollbar tokens
  'scrollbar-thumb': string;
  'scrollbar-track': string;
  
  // Focus and other tokens
  'focus-ring': string;
  'shadow': string;
  'overlay': string;
}

export type SeedName = 
  | 'neutral' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'interactive' 
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
