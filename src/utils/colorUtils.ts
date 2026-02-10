import { getLuminance, hexToHsl, hslToHex } from "./colorUtils";

export const getContrastRatio = (c1: string, c2: string): number => {
  const l1 = getLuminance(c1);
  const l2 = getLuminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

export const getWCAGLevel = (ratio: number): string => {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "A";
  return "FAIL";
};

export const getHueDifference = (c1: string, c2: string): number => {
  const hsl1 = hexToHsl(c1);
  const hsl2 = hexToHsl(c2);
  
  // Only care about hue difference if both colors have some saturation
  // If one is grayscale (s < 5), hue is essentially meaningless
  if (hsl1.s < 5 || hsl2.s < 5) return 0;
  
  let diff = Math.abs(hsl1.h - hsl2.h);
  if (diff > 180) diff = 360 - diff;
  return diff;
};

export const getTargetContrast = (
  isNonText: boolean = false,
  isBorder: boolean = false,
  isWeak: boolean = false,
  isStrong: boolean = false,
  category?: string
): number => {
  // Special handling for LOG_12_SPLASH_LOADING
  if (category === "LOG_12_SPLASH_LOADING") {
    return 1.1;
  }

  // Border contrast can be low as it's often just a subtle separator
  if (isBorder) return 1.1;

  if (isNonText) {
    // Icons/UI components - WCAG 2.1 requires 3:1 for non-text contrast (AA).
    // User requested 4.5 for icons/strong elements.
    if (isStrong) return 4.5;
    if (isWeak) return 1.1; // Restore to 1.1 for surfaces/weak elements to allow subtle separation
    return 3.0; // Standard non-text requirement
  }

  // Text requirements: WCAG AA is 4.5:1, AAA is 7:1.
  // We favor text having at least 4.5.
  if (isStrong) return 4.5; // Changed from 7.0 to 4.5 to match user expectation of AA
  if (isWeak) return 4.5;   // Even weak text should meet AA
  return 4.5;              // Default text requirement
};

export const getThresholdLabel = (
  isNonText: boolean = false,
  isBorder: boolean = false,
  isWeak: boolean = false,
  isStrong: boolean = false,
  category?: string
): string => {
  // Use 1.1/15° rule for all borders and weak non-text/surfaces
  if (isBorder || (isNonText && isWeak) || category === "LOG_12_SPLASH_LOADING") {
    return "1.1/15°";
  }

  if (isNonText) {
    if (isStrong) return "4.5/15°";
    return "3.0/15°";
  }
  // Text targets
  return "4.5+";
};

export const getContrastScore = (
  background: string, 
  foreground: string, 
  isNonText: boolean = false,
  isBorder: boolean = false,
  isWeak: boolean = false,
  isStrong: boolean = false,
  category?: string
): { ratio: number; hueDiff: number; level: string; pass: boolean } => {
  const ratio = getContrastRatio(background, foreground);
  const hueDiff = getHueDifference(background, foreground);
  const level = getWCAGLevel(ratio);
  const target = getTargetContrast(isNonText, isBorder, isWeak, isStrong, category);
  
  let contrastPass = false;
  if (isNonText && isWeak && category !== "LOG_12_SPLASH_LOADING") {
    // Weak non-text has a minimum of 1.1. (Removed the upper bound 2.5 to allow H-DIFF logic)
    contrastPass = ratio >= 1.1;
  } else {
    contrastPass = ratio >= target;
  }

  // Hue pass: 15 degrees difference is a good indicator of visual separation
  // even if brightness is similar.
  const huePass = hueDiff >= 15;

  let pass = contrastPass;
  // Borders, Non-Text items (Icons/Indicators), and Splash Loading allow for Hue Pass
  if (isNonText || isBorder || category === "LOG_12_SPLASH_LOADING") {
    // For non-text/borders or Splash category, pass if either contrast OR hue is sufficient
    pass = contrastPass || huePass;
  }
  
  return { 
    ratio: Math.round(ratio * 100) / 100, 
    hueDiff: Math.round(hueDiff),
    level, 
    pass 
  };
};

export const getClosestPassingColor = (
  background: string,
  foreground: string,
  isNonText: boolean = false,
  isBorder: boolean = false,
  isWeak: boolean = false,
  isStrong: boolean = false,
  category?: string
): string => {
  const currentScore = getContrastScore(background, foreground, isNonText, isBorder, isWeak, isStrong, category);

  if (currentScore.pass) return foreground;

  const fgHsl = hexToHsl(foreground);
  let bestL = -1;
  let minDelta = Infinity;

  // Search entire lightness range for closest passing color
  for (let l = 0; l <= 100; l++) {
    const candidateHex = hslToHex(fgHsl.h, fgHsl.s, l);
    const score = getContrastScore(background, candidateHex, isNonText, isBorder, isWeak, isStrong, category);

    if (score.pass) {
      const delta = Math.abs(l - fgHsl.l);
      if (delta < minDelta) {
        minDelta = delta;
        bestL = l;
      } else if (delta === minDelta && bestL !== -1) {
        // Tie-breaker: when equidistant, prefer moving toward middle gray (l=50)
        const distToMid = (val: number) => Math.abs(val - 50);
        if (distToMid(l) < distToMid(bestL)) {
          bestL = l;
        }
      }
    }
  }

  return bestL === -1 ? foreground : hslToHex(fgHsl.h, fgHsl.s, bestL);
};

export const getClosestHuePassingColor = (
  background: string,
  foreground: string,
  isNonText: boolean = false,
  isBorder: boolean = false,
  isWeak: boolean = false,
  isStrong: boolean = false,
  category?: string
): string => {
  const currentScore = getContrastScore(background, foreground, isNonText, isBorder, isWeak, isStrong, category);
  if (currentScore.pass) return foreground;

  const fgHsl = hexToHsl(foreground);
  let bestH = -1;
  let minDelta = Infinity;

  // Search entire hue range
  for (let h = 0; h < 360; h++) {
    const candidateHex = hslToHex(h, fgHsl.s, fgHsl.l);
    const score = getContrastScore(background, candidateHex, isNonText, isBorder, isWeak, isStrong, category);

    if (score.pass) {
      let delta = Math.abs(h - fgHsl.h);
      if (delta > 180) delta = 360 - delta;

      if (delta < minDelta) {
        minDelta = delta;
        bestH = h;
      }
    }
  }

  return bestH === -1 ? foreground : hslToHex(bestH, fgHsl.s, fgHsl.l);
};
