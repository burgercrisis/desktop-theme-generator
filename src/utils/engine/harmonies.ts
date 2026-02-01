import { HSL, HarmonyRule, PaletteGroup, VariantStrategy, ColorSpace, OutputSpace } from '../../types';
import { createColorStop, normalizeHue } from './core';
import { generateVariants } from './variants';

interface HarmonyStep {
  hOffset: number;
  sOffset?: number;
  lOffset?: number;
}

export const generateHarmony = (
  base: HSL, 
  rule: HarmonyRule, 
  spread: number = 30,
  variantCount: number = 2,
  contrast: number = 50,
  strategy: VariantStrategy = 'Tints & Shades',
  space: ColorSpace = 'HSL',
  output: OutputSpace = 'sRGB'
): PaletteGroup[] => {
  const { h, s, l } = base;
  let steps: HarmonyStep[] = [];
  const angle = spread;

  switch (rule) {
    case 'Monochromatic (1)': steps = [{ hOffset: 0 }]; break;
    case 'Analogous (3)': steps = [{ hOffset: -angle }, { hOffset: 0 }, { hOffset: angle }]; break;
    case 'Analogous (5)': steps = [{ hOffset: -angle*2 }, { hOffset: -angle }, { hOffset: 0 }, { hOffset: angle }, { hOffset: angle*2 }]; break;
    case 'Accented Analogous (4)': steps = [{ hOffset: -angle }, { hOffset: 0 }, { hOffset: angle }, { hOffset: 180 }]; break;
    case 'Natural (3)': steps = [{ hOffset: -angle, sOffset: 15, lOffset: -15 }, { hOffset: 0 }, { hOffset: angle, sOffset: -10, lOffset: 15 }]; break;
    case 'Complementary (2)': steps = [{ hOffset: 0 }, { hOffset: 180 }]; break;
    case 'Split Complementary (3)': steps = [{ hOffset: 180 - angle }, { hOffset: 0 }, { hOffset: 180 + angle }]; break;
    case 'Triadic (3)': steps = [{ hOffset: 0 }, { hOffset: 120 }, { hOffset: 240 }]; break;
    case 'Tetradic (4)': steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 180 }, { hOffset: 180 + angle }]; break;
    case 'Square (4)': steps = [{ hOffset: 0 }, { hOffset: 90 }, { hOffset: 180 }, { hOffset: 270 }]; break;
    case 'Double Split Complementary (5)': steps = [{ hOffset: -angle }, { hOffset: 0 }, { hOffset: angle }, { hOffset: 180 - angle }, { hOffset: 180 + angle }]; break;
    case 'Six Tone (6)': steps = [0, angle, angle*2, angle*3, angle*4, angle*5].map(deg => ({ hOffset: deg })); break;
    case 'Compound (3)': steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 180 - angle }]; break;
    case 'Shades (1)': steps = [{ hOffset: 0 }]; break;
    case 'Golden Ratio (4)': steps = [{ hOffset: 0 }, { hOffset: 137.5 }, { hOffset: 275 }, { hOffset: 412.5 }]; break;
    case 'Vivid & Pastel (3)': steps = [{ hOffset: 0 }, { hOffset: 180 - angle, sOffset: -40, lOffset: 25 }, { hOffset: 180 + angle, sOffset: -40, lOffset: 25 }]; break;
    case 'Pentagram (5)': steps = [0, angle, angle*2, angle*3, angle*4].map(deg => ({ hOffset: deg })); break;
    case 'Hard Clash (3)': steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 360 - angle }]; break;
    case 'Double Analogous (4)': steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 120 }, { hOffset: 120 + angle }]; break;
    case 'Full Spectrum (8)': steps = Array.from({length: 8}, (_, i) => ({ hOffset: i * angle })); break;
    case 'Clash Complementary (3)': steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 180 }]; break;
    case 'Synthwave (3)': steps = [{ hOffset: 0 }, { hOffset: 180 }, { hOffset: 180 + angle }]; break;
    case 'Analogous Clash (3)': steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: angle * 3 }]; break;
    case 'Deep Night (3)': steps = [{ hOffset: 0, sOffset: -20, lOffset: -30 }, { hOffset: 180, sOffset: -10, lOffset: -40 }, { hOffset: 180 + angle, sOffset: -10, lOffset: -40 }]; break;
    case 'Solar Flare (3)': steps = [{ hOffset: 0, sOffset: 20, lOffset: 10 }, { hOffset: 30, sOffset: 15, lOffset: 5 }, { hOffset: 60, sOffset: 10, lOffset: 0 }]; break;
    case 'Oceanic (3)': steps = [{ hOffset: 180, sOffset: 10, lOffset: -10 }, { hOffset: 210, sOffset: 5, lOffset: -5 }, { hOffset: 240, sOffset: 0, lOffset: 0 }]; break;
    case 'Forest Edge (3)': steps = [{ hOffset: 90, sOffset: -10, lOffset: -15 }, { hOffset: 120, sOffset: -5, lOffset: -10 }, { hOffset: 150, sOffset: 0, lOffset: -5 }]; break;
    case 'Cyberpunk (3)': steps = [{ hOffset: 0, sOffset: 30, lOffset: 5 }, { hOffset: 150, sOffset: 20, lOffset: 0 }, { hOffset: 300, sOffset: 25, lOffset: 10 }]; break;
    case 'Royal (3)': steps = [{ hOffset: 0, sOffset: 10, lOffset: -10 }, { hOffset: 270, sOffset: 15, lOffset: -5 }, { hOffset: 50, sOffset: 20, lOffset: 10 }]; break;
    case 'Earthy (3)': steps = [{ hOffset: 20, sOffset: -10, lOffset: -20 }, { hOffset: 40, sOffset: -15, lOffset: -15 }, { hOffset: 60, sOffset: -10, lOffset: -10 }]; break;
    case 'Pastel Dreams (3)': steps = [{ hOffset: 0, sOffset: -40, lOffset: 30 }, { hOffset: 120, sOffset: -45, lOffset: 35 }, { hOffset: 240, sOffset: -40, lOffset: 30 }]; break;
    default: steps = [{ hOffset: 0 }];
  }

  const isExtendedSpace = (space === 'CAM02' || space.startsWith('LCh') || space.startsWith('Ok') || space === 'IPT');
  const maxS = isExtendedSpace ? 150 : 100;

  const bases: HSL[] = steps.map(step => {
    const newH = normalizeHue(h + step.hOffset);
    const rawS = s + (step.sOffset || 0);
    const newS = Math.max(0, Math.min(maxS, rawS));
    const newL = Math.max(0, Math.min(100, l + (step.lOffset || 0)));
    return { h: newH, s: newS, l: newL };
  });

  return bases.map((currentBase, idx) => {
    const prevBase = bases[idx === 0 ? bases.length - 1 : idx - 1];
    const nextBase = bases[(idx + 1) % bases.length];
    const isMainBase = idx === steps.findIndex(s => s.hOffset === 0 && !s.sOffset && !s.lOffset);

    return {
      base: createColorStop(currentBase.h, currentBase.s, currentBase.l, isMainBase, space, output),
      variants: generateVariants(currentBase, variantCount, contrast, strategy, space, output, prevBase, nextBase)
    };
  });
};
