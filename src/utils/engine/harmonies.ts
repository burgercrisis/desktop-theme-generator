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
  strategy: VariantStrategy = VariantStrategy.TINTS_SHADES,
  space: ColorSpace = 'HSL',
  output: OutputSpace = 'sRGB'
): PaletteGroup[] => {
  const { h, s, l } = base;
  let steps: HarmonyStep[] = [];
  const angle = spread;

  switch (rule) {
    case HarmonyRule.MONOCHROMATIC: steps = [{ hOffset: 0 }]; break;
    case HarmonyRule.ANALOGOUS: steps = [{ hOffset: -angle }, { hOffset: 0 }, { hOffset: angle }]; break;
    case HarmonyRule.ANALOGOUS_5: steps = [{ hOffset: -angle*2 }, { hOffset: -angle }, { hOffset: 0 }, { hOffset: angle }, { hOffset: angle*2 }]; break;
    case HarmonyRule.ACCENTED_ANALOGOUS: steps = [{ hOffset: -angle }, { hOffset: 0 }, { hOffset: angle }, { hOffset: 180 }]; break;
    case HarmonyRule.COMPLEMENTARY: steps = [{ hOffset: 0 }, { hOffset: 180 }]; break;
    case HarmonyRule.SPLIT_COMPLEMENTARY: steps = [{ hOffset: 180 - angle }, { hOffset: 0 }, { hOffset: 180 + angle }]; break;
    case HarmonyRule.DOUBLE_SPLIT_COMPLEMENTARY: steps = [{ hOffset: -angle }, { hOffset: 0 }, { hOffset: angle }, { hOffset: 180 - angle }, { hOffset: 180 + angle }]; break;
    case HarmonyRule.TRIADIC: steps = [{ hOffset: 0 }, { hOffset: 120 }, { hOffset: 240 }]; break;
    case HarmonyRule.TETRADIC: steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 180 }, { hOffset: 180 + angle }]; break;
    case HarmonyRule.SQUARE: steps = [{ hOffset: 0 }, { hOffset: 90 }, { hOffset: 180 }, { hOffset: 270 }]; break;
    case HarmonyRule.COMPOUND: steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 180 - angle }]; break;
    case HarmonyRule.SHADES: steps = [{ hOffset: 0 }]; break;
    case HarmonyRule.SIX_TONE: steps = [0, angle, angle*2, angle*3, angle*4, angle*5].map(deg => ({ hOffset: deg })); break;
    case HarmonyRule.GOLDEN: steps = [{ hOffset: 0 }, { hOffset: 137.5 }, { hOffset: 275 }, { hOffset: 412.5 }]; break;
    case HarmonyRule.NATURAL: steps = [{ hOffset: -angle, sOffset: 15, lOffset: -15 }, { hOffset: 0 }, { hOffset: angle, sOffset: -10, lOffset: 15 }]; break;
    case HarmonyRule.VIVID_PASTEL: steps = [{ hOffset: 0 }, { hOffset: 180 - angle, sOffset: -40, lOffset: 25 }, { hOffset: 180 + angle, sOffset: -40, lOffset: 25 }]; break;
    case HarmonyRule.PENTAGRAM: steps = [0, angle, angle*2, angle*3, angle*4].map(deg => ({ hOffset: deg })); break;
    case HarmonyRule.HARD_CLASH: steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 360 - angle }]; break;
    case HarmonyRule.DOUBLE_ANALOGOUS: steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 120 }, { hOffset: 120 + angle }]; break;
    case HarmonyRule.FULL_SPECTRUM: steps = Array.from({length: 8}, (_, i) => ({ hOffset: i * angle })); break;
    case HarmonyRule.CLASH_COMPLEMENTARY: steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: 180 }]; break;
    case HarmonyRule.SYNTHWAVE: steps = [{ hOffset: 0 }, { hOffset: 180 }, { hOffset: 180 + angle }]; break;
    case HarmonyRule.ANALOGOUS_CLASH: steps = [{ hOffset: 0 }, { hOffset: angle }, { hOffset: angle * 3 }]; break;
    case HarmonyRule.DEEP_NIGHT: steps = [{ hOffset: 0, sOffset: -20, lOffset: -30 }, { hOffset: 180, sOffset: -10, lOffset: -40 }, { hOffset: 180 + angle, sOffset: -10, lOffset: -40 }]; break;
    case HarmonyRule.SOLAR_FLARE: steps = [{ hOffset: 0, sOffset: 20, lOffset: 10 }, { hOffset: 30, sOffset: 15, lOffset: 5 }, { hOffset: 60, sOffset: 10, lOffset: 0 }]; break;
    case HarmonyRule.OCEANIC: steps = [{ hOffset: 180, sOffset: 10, lOffset: -10 }, { hOffset: 210, sOffset: 5, lOffset: -5 }, { hOffset: 240, sOffset: 0, lOffset: 0 }]; break;
    case HarmonyRule.FOREST_EDGE: steps = [{ hOffset: 90, sOffset: -10, lOffset: -15 }, { hOffset: 120, sOffset: -5, lOffset: -10 }, { hOffset: 150, sOffset: 0, lOffset: -5 }]; break;
    case HarmonyRule.CYBERPUNK: steps = [{ hOffset: 0, sOffset: 30, lOffset: 5 }, { hOffset: 150, sOffset: 20, lOffset: 0 }, { hOffset: 300, sOffset: 25, lOffset: 10 }]; break;
    case HarmonyRule.ROYAL: steps = [{ hOffset: 0, sOffset: 10, lOffset: -10 }, { hOffset: 270, sOffset: 15, lOffset: -5 }, { hOffset: 50, sOffset: 20, lOffset: 10 }]; break;
    case HarmonyRule.EARTHY: steps = [{ hOffset: 20, sOffset: -10, lOffset: -20 }, { hOffset: 40, sOffset: -15, lOffset: -15 }, { hOffset: 60, sOffset: -10, lOffset: -10 }]; break;
    case HarmonyRule.PASTEL_DREAMS: steps = [{ hOffset: 0, sOffset: -40, lOffset: 30 }, { hOffset: 120, sOffset: -45, lOffset: 35 }, { hOffset: 240, sOffset: -40, lOffset: 30 }]; break;

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
