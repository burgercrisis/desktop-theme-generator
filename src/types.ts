
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
  "surface-base-interactive-active": string;
  "surface-inset-base": string;
  "surface-inset-base-hover": string;
  "surface-inset-base-active": string;
  "surface-inset-strong": string;
  "surface-inset-strong-hover": string;
  "surface-raised-base": string;
  "surface-raised-base-hover": string;
  "surface-raised-base-active": string;
  "surface-raised-strong": string;
  "surface-raised-strong-hover": string;
  "surface-raised-stronger": string;
  "surface-raised-stronger-hover": string;
  "surface-float-base": string;
  "surface-float-base-hover": string;
  "surface-float-base-active": string;
  "surface-float-strong": string;
  "surface-float-strong-hover": string;
  "surface-float-strong-active": string;
  "surface-weak": string;
  "surface-weaker": string;
  "surface-strong": string;
  "surface-raised-stronger-non-alpha": string;
  "surface-brand-base": string;
  "surface-brand-hover": string;
  "surface-brand-active": string;
  "surface-interactive-base": string;
  "surface-interactive-hover": string;
  "surface-interactive-active": string;
  "surface-interactive-weak": string;
  "surface-interactive-weak-hover": string;
  "surface-success-base": string;
  "surface-success-hover": string;
  "surface-success-active": string;
  "surface-success-weak": string;
  "surface-success-strong": string;
  "surface-warning-base": string;
  "surface-warning-hover": string;
  "surface-warning-active": string;
  "surface-warning-weak": string;
  "surface-warning-strong": string;
  "surface-critical-base": string;
  "surface-critical-hover": string;
  "surface-critical-active": string;
  "surface-critical-weak": string;
  "surface-critical-strong": string;
  "surface-info-base": string;
  "surface-info-hover": string;
  "surface-info-active": string;
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

  "surface-diff-hidden-base": string;
  "surface-diff-hidden-weak": string;
  "surface-diff-hidden-weaker": string;
  "surface-diff-hidden-strong": string;
  "surface-diff-hidden-stronger": string;

  // Text
  "text-base": string;
  "text-weak": string;
  "text-weaker": string;
  "text-strong": string;
  "text-stronger": string;
  "text-invert-base": string;
  "text-invert-weak": string;
  "text-invert-weaker": string;
  "text-invert-strong": string;
  "text-on-brand-base": string;
  "text-on-brand-weak": string;
  "text-on-brand-weaker": string;
  "text-on-brand-strong": string;
  "text-interactive-base": string;
  "text-on-interactive-base": string;
  "text-on-interactive-weak": string;
  "text-on-success-base": string;
  "text-on-success-weak": string;
  "text-on-success-strong": string;
  "text-on-warning-base": string;
  "text-on-warning-weak": string;
  "text-on-warning-strong": string;
  "text-on-critical-base": string;
  "text-on-critical-weak": string;
  "text-on-critical-strong": string;
  "text-on-info-base": string;
  "text-on-info-weak": string;
  "text-on-info-strong": string;
  "text-diff-add-base": string;
  "text-diff-add-strong": string;
  "text-diff-delete-base": string;
  "text-diff-delete-strong": string;

  // Input
  "input-base": string;
  "input-hover": string;
  "input-active": string;
  "input-disabled": string;

  // Button
  "button-secondary-base": string;
  "button-secondary-hover": string;
  "button-danger-base": string;
  "button-danger-hover": string;
  "button-danger-active": string;
  "button-ghost-hover": string;
  "button-ghost-hover2": string;

  // Border
  "border-base": string;
  "border-hover": string;
  "border-active": string;
  "border-selected": string;
  "border-disabled": string;
  "border-focus": string;
  "border-weak-base": string;
  "border-weak-hover": string;
  "border-weak-active": string;
  "border-weak-selected": string;
  "border-weak-disabled": string;
  "border-weak-focus": string;
  "border-weaker-base": string;
  "border-weaker-hover": string;
  "border-weaker-active": string;
  "border-weaker-selected": string;
  "border-weaker-disabled": string;
  "border-weaker-focus": string;
  "border-strong-base": string;
  "border-strong-hover": string;
  "border-strong-active": string;
  "border-strong-selected": string;
  "border-strong-disabled": string;
  "border-strong-focus": string;
  // Tree UI
  "tree-background-selected": string;
  "tree-background-hover": string;
  "tree-foreground-selected": string;
  "tree-foreground-hover": string;
  "tree-icon-selected": string;

  // Tabs Extended
  "tab-active-background": string;
  "tab-active-foreground": string;
  "tab-active-border": string;
  "tab-inactive-background": string;
  "tab-inactive-foreground": string;

  // Breadcrumbs
  "breadcrumb-background": string;
  "breadcrumb-foreground": string;
  "breadcrumb-foreground-hover": string;
  "breadcrumb-separator": string;

  // Input Focus Ring
  "input-focus-ring": string;

  // Terminal Extras
  "terminal-cursor": string;
  "terminal-selection": string;

  // Border Functional (Explicit)
  "border-interactive-base": string;
  "border-interactive-hover": string;
  "border-interactive-active": string;
  "border-interactive-selected": string;
  "border-success-base": string;
  "border-success-hover": string;
  "border-success-selected": string;
  "border-warning-base": string;
  "border-warning-hover": string;
  "border-warning-selected": string;
  "border-critical-base": string;
  "border-critical-hover": string;
  "border-critical-selected": string;
  "border-info-base": string;
  "border-info-hover": string;
  "border-info-selected": string;
  "border-strong-disabled": string;
  "border-strong-focus": string;
  "border-color": string;

  // Icon
  "icon-base": string;
  "icon-hover": string;
  "icon-active": string;
  "icon-selected": string;
  "icon-disabled": string;
  "icon-focus": string;
  "icon-invert-base": string;
  "icon-weak-base": string;
  "icon-weak-hover": string;
  "icon-weak-active": string;
  "icon-weak-selected": string;
  "icon-weak-disabled": string;
  "icon-weak-focus": string;
  "icon-strong-base": string;
  "icon-strong-hover": string;
  "icon-strong-active": string;
  "icon-strong-selected": string;
  "icon-strong-disabled": string;
  "icon-strong-focus": string;
  "icon-brand-base": string;
  "icon-interactive-base": string;
  "icon-success-base": string;
  "icon-warning-base": string;
  "icon-critical-base": string;
  "icon-info-base": string;
  "icon-diff-add-base": string;
  "icon-diff-add-hover": string;
  "icon-diff-add-active": string;
  "icon-diff-delete-base": string;
  "icon-diff-delete-hover": string;
  "icon-diff-modified-base": string;

  "icon-on-brand-base": string;
  "icon-on-brand-hover": string;
  "icon-on-brand-selected": string;
  "icon-on-interactive-base": string;
  "icon-on-success-base": string;
  "icon-on-success-hover": string;
  "icon-on-success-selected": string;
  "icon-on-warning-base": string;
  "icon-on-warning-hover": string;
  "icon-on-warning-selected": string;
  "icon-on-critical-base": string;
  "icon-on-critical-hover": string;
  "icon-on-critical-selected": string;
  "icon-on-info-base": string;
  "icon-on-info-hover": string;
  "icon-on-info-selected": string;

  "icon-agent-plan-base": string;
  "icon-agent-docs-base": string;
  "icon-agent-ask-base": string;
  "icon-agent-build-base": string;

  // Terminal ANSI
  "terminal-ansi-black": string;
  "terminal-ansi-red": string;
  "terminal-ansi-green": string;
  "terminal-ansi-yellow": string;
  "terminal-ansi-blue": string;
  "terminal-ansi-magenta": string;
  "terminal-ansi-cyan": string;
  "terminal-ansi-white": string;
  "terminal-ansi-bright-black": string;
  "terminal-ansi-bright-red": string;
  "terminal-ansi-bright-green": string;
  "terminal-ansi-bright-yellow": string;
  "terminal-ansi-bright-blue": string;
  "terminal-ansi-bright-magenta": string;
  "terminal-ansi-bright-cyan": string;
  "terminal-ansi-bright-white": string;

  // Syntax
  "syntax-comment": string;
  "syntax-keyword": string;
  "syntax-function": string;
  "syntax-variable": string;
  "syntax-string": string;
  "syntax-number": string;
  "syntax-type": string;
  "syntax-operator": string;
  "syntax-punctuation": string;
  "syntax-object": string;
  "syntax-regexp": string;
  "syntax-primitive": string;
  "syntax-property": string;
  "syntax-constant": string;
  "syntax-tag": string;
  "syntax-attribute": string;
  "syntax-value": string;
  "syntax-namespace": string;
  "syntax-class": string;
  "syntax-success": string;
  "syntax-warning": string;
  "syntax-critical": string;
  "syntax-info": string;
  "syntax-diff-add": string;
  "syntax-diff-delete": string;

  // Markdown
  "markdown-text": string;
  "markdown-heading": string;
  "markdown-link": string;
  "markdown-link-text": string;
  "markdown-code": string;
  "markdown-block-quote": string;
  "markdown-emph": string;
  "markdown-strong": string;
  "markdown-horizontal-rule": string;
  "markdown-list-item": string;
  "markdown-list-enumeration": string;
  "markdown-image": string;
  "markdown-image-text": string;
  "markdown-code-block": string;

  // Code/Editor
  "code-background": string;
  "code-foreground": string;
  "line-indicator": string;
  "line-indicator-active": string;
  "line-indicator-hover": string;

  // Tab
  "tab-active": string;
  "tab-inactive": string;
  "tab-hover": string;

  // Avatar
  "avatar-background": string;
  "avatar-foreground": string;
  "avatar-background-pink": string;
  "avatar-background-mint": string;
  "avatar-background-orange": string;
  "avatar-background-purple": string;
  "avatar-background-cyan": string;
  "avatar-background-lime": string;
  "avatar-background-blue": string;
  "avatar-background-green": string;
  "avatar-background-yellow": string;
  "avatar-background-red": string;
  "avatar-background-gray": string;
  "avatar-text-pink": string;
  "avatar-text-mint": string;
  "avatar-text-orange": string;
  "avatar-text-purple": string;
  "avatar-text-cyan": string;
  "avatar-text-lime": string;
  "avatar-text-blue": string;
  "avatar-text-green": string;
  "avatar-text-yellow": string;
  "avatar-text-red": string;
  "avatar-text-gray": string;

  // Scrollbar
  "scrollbar-thumb": string;
  "scrollbar-track": string;

  // Misc
  "focus-ring": string;
  "shadow": string;
  "overlay": string;
  "selection-background": string;
  "selection-foreground": string;
  "selection-inactive-background": string;

  // Semantic Base
  "primary-base": string;
  "primary-hover": string;
  "primary-active": string;
  "primary-text": string;
  "secondary-base": string;
  "secondary-hover": string;
  "secondary-active": string;
  "secondary-text": string;
  "accent-base": string;
  "accent-hover": string;
  "accent-active": string;
  "accent-text": string;
  "success-base": string;
  "success-hover": string;
  "success-active": string;
  "success-text": string;
  "warning-base": string;
  "warning-hover": string;
  "warning-active": string;
  "warning-text": string;
  "critical-base": string;
  "critical-hover": string;
  "critical-active": string;
  "critical-text": string;
  "info-base": string;
  "info-hover": string;
  "info-active": string;
  "info-text": string;
  "interactive-base": string;
  "interactive-hover": string;
  "interactive-active": string;
  "interactive-text": string;
  "diff-add-base": string;
  "diff-add-foreground": string;
  "diff-delete-base": string;
  "diff-delete-foreground": string;
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
