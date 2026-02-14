import { analysisCache } from './analysisCache';
import { generateOpencodeSeeds as originalGenerateSeeds } from '../harmonies';
import { generateVariants as originalGenerateVariants } from '../engine/variants';
import { HSL, HarmonyRule, VariantStrategy, ColorSpace, OutputSpace, SeedColor, ColorStop } from '../../types';

// Cached wrapper for generateOpencodeSeeds
export const generateOpencodeSeeds = (
  baseColor: HSL,
  harmony: HarmonyRule = HarmonyRule.ANALOGOUS,
  spread: number = 30,
  brightness: number = 50,
  strategy: VariantStrategy = VariantStrategy.TINTS_SHADES
): SeedColor[] => {
  const cacheKey = {
    h: Math.round(baseColor.h * 10) / 10,
    s: Math.round(baseColor.s * 10) / 10,
    l: Math.round(baseColor.l * 10) / 10,
    harmony: harmony.toString(),
    spread: Math.round(spread * 10) / 10,
    strategy: strategy.toString()
  };

  const cached = analysisCache.getSeeds(cacheKey);
  if (cached) {
    return cached;
  }

  const result = originalGenerateSeeds(baseColor, harmony, spread, brightness, strategy);
  analysisCache.setSeeds(cacheKey, result);
  return result;
};

// Cached wrapper for generateVariants
export const generateVariants = (
  baseHsl: HSL,
  count: number,
  contrast: number,
  strategy: VariantStrategy,
  space: ColorSpace,
  output: OutputSpace,
  brightness: number = 50,
  prevHsl?: HSL,
  nextHsl?: HSL
): ColorStop[] => {
  const cacheKey = {
    h: Math.round(baseHsl.h * 10) / 10,
    s: Math.round(baseHsl.s * 10) / 10,
    l: Math.round(baseHsl.l * 10) / 10,
    count,
    contrast: Math.round(contrast * 10) / 10,
    strategy: strategy.toString(),
    space: space.toString(),
    output: output.toString(),
    brightness: Math.round(brightness * 10) / 10
  };

  const cached = analysisCache.getVariants(cacheKey);
  if (cached) {
    return cached;
  }

  const result = originalGenerateVariants(baseHsl, count, contrast, strategy, space, output, brightness, prevHsl, nextHsl);
  analysisCache.setVariants(cacheKey, result);
  return result;
};
