import { RGB, HSL } from '../types';

export const normalizeHue = (h: number) => (h % 360 + 360) % 360;

export const hslToHex = (h: number, s: number, l: number): string => {
  const hNorm = normalizeHue(h);
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((hNorm / 60) % 2 - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= hNorm && hNorm < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= hNorm && hNorm < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= hNorm && hNorm < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= hNorm && hNorm < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= hNorm && hNorm < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= hNorm && hNorm < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round((n + m) * 255))).toString(16);
    return hex.padStart(2, '0').toUpperCase();
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const hexToHsl = (hex: string): HSL => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

export const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const adjustLightness = (hex: string, amount: number): string => {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + amount)));
};

export const adjustSaturation = (hex: string, amount: number): string => {
  const hsl = hexToHsl(hex);
  return hslToHex(hsl.h, Math.max(0, Math.min(100, hsl.s + amount)), hsl.l);
};

export const getContrastColor = (hex: string): string => {
  return getWCAGTextColor(hex);
};

export const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const r = rgb1.r + (rgb2.r - rgb1.r) * factor;
  const g = rgb1.g + (rgb2.g - rgb1.g) * factor;
  const b = rgb1.b + (rgb2.b - rgb1.b) * factor;
  return rgbToHex(r, g, b);
};

export const interpolateValues = (start: HSL, end: HSL, t: number): HSL => {
  let dH = end.h - start.h;
  if (dH > 180) dH -= 360;
  else if (dH < -180) dH += 360;
  
  return {
    h: normalizeHue(start.h + dH * t),
    s: start.s + (end.s - start.s) * t,
    l: start.l + (end.l - start.l) * t
  };
};

export const lighten = (hex: string, amount: number): string => adjustLightness(hex, amount);

export const getLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const alpha = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  const r = Math.round(rgb.r + (255 - rgb.r) * (1 - alpha));
  const g = Math.round(rgb.g + (255 - rgb.g) * (1 - alpha));
  const b = Math.round(rgb.b + (255 - rgb.b) * (1 - alpha));
  return rgbToHex(r, g, b);
};

// WCAG Contrast Checking Utilities
export const getRelativeLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const getContrastRatio = (hex1: string, hex2: string): number => {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

export const getWCAGLevel = (contrast: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' => {
  if (contrast >= 7) return 'AAA';
  if (contrast >= 4.5) return 'AA';
  if (contrast >= 3) return 'AA Large';
  return 'Fail';
};

export const getContrastScore = (
  background: string, 
  foreground: string, 
  isNonText: boolean = false,
  isBorder: boolean = false
): { ratio: number; level: string; pass: boolean } => {
  const ratio = getContrastRatio(background, foreground);
  const level = getWCAGLevel(ratio);
  
  let pass = false;
  if (isBorder) {
    // Borders only need a minimum of 1.1 contrast
    pass = ratio >= 1.1;
  } else if (isNonText) {
    // Non-text UI elements (like icons) should be between 1.1 and 2 for subtlety
    pass = ratio >= 1.1 && ratio <= 2;
  } else {
    // Text pairs require high contrast (AA standard)
    pass = ratio >= 4.5;
  }
  
  return { ratio: Math.round(ratio * 100) / 100, level, pass };
};

// Find the best contrasting color from a palette
export const findBestContrastColor = (background: string, candidates: string[]): string => {
  let bestColor = candidates[0];
  let bestRatio = 0;
  
  for (const candidate of candidates) {
    const ratio = getContrastRatio(background, candidate);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestColor = candidate;
    }
  }
  
  return bestColor;
};

// Generate WCAG-compliant text color (black or white based on background)
export const getWCAGTextColor = (background: string): string => {
  const blackContrast = getContrastRatio(background, '#000000');
  const whiteContrast = getContrastRatio(background, '#ffffff');
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
};

// Adjust color lightness to meet WCAG contrast
export const adjustForContrast = (background: string, targetContrast: number = 4.5): string => {
  const hsl = hexToHsl(background);
  let bestHex = background;
  let bestRatio = getContrastRatio(background, getWCAGTextColor(background));
  
  // Try lighter versions
  for (let i = 1; i <= 20; i++) {
    const lighterHsl = { ...hsl, l: Math.min(100, hsl.l + i * 2) };
    const lighterHex = hslToHex(lighterHsl.h, lighterHsl.s, lighterHsl.l);
    const ratio = getContrastRatio(lighterHex, getWCAGTextColor(lighterHex));
    
    if (ratio >= targetContrast) {
      return lighterHex;
    }
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestHex = lighterHex;
    }
  }
  
  // Try darker versions
  for (let i = 1; i <= 20; i++) {
    const darkerHsl = { ...hsl, l: Math.max(0, hsl.l - i * 2) };
    const darkerHex = hslToHex(darkerHsl.h, darkerHsl.s, darkerHsl.l);
    const ratio = getContrastRatio(darkerHex, getWCAGTextColor(darkerHex));
    
    if (ratio >= targetContrast) {
      return darkerHex;
    }
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestHex = darkerHex;
    }
  }
  
  return bestHex;
};

// Validate a complete color scheme for WCAG compliance
export const validateColorScheme = (colors: Record<string, string>): Record<string, { ratio: number; level: string; pass: boolean }> => {
  const results: Record<string, { ratio: number; level: string; pass: boolean }> = {};
  
  // Common contrast checks
  const checks = [
    { bg: 'background-base', fg: 'text-base', name: 'text-on-background' },
    { bg: 'primary-base', fg: 'primary-text', name: 'primary-text' },
    { bg: 'surface-base', fg: 'text-base', name: 'text-on-surface' },
    { bg: 'surface-raised-base', fg: 'text-base', name: 'text-on-raised' },
  ];
  
  for (const check of checks) {
    if (colors[check.bg] && colors[check.fg]) {
      results[check.name] = getContrastScore(colors[check.bg], colors[check.fg]);
    }
  }
  
  return results;
};
