import { getContrastScore as originalGetContrastScore } from './colorUtils'

/**
 * Selector-based cache for WCAG contrast calculations.
 * 
 * Cache key format: "bgKey:fgKey:bgHex:fgHex"
 * This ensures we only recalculate when the actual color values change,
 * not when unrelated colors in the theme change.
 * 
 * Example: If background-base changes from #1a1a2e to #252541,
 * only pairs USING background-base will recalculate, not all 500+ pairs.
 */
const contrastScoreCache = new Map<string, {
  ratio: number
  hueDiff: number
  level: string
  pass: boolean
}>()

/**
 * Get cached contrast score or calculate if not in cache.
 * Uses structural sharing - same color combinations return identical objects.
 */
export function getCachedContrastScore(
  bgKey: string,
  fgKey: string,
  bg: string,
  fg: string,
  isNonText: boolean,
  isBorder: boolean,
  isWeak: boolean,
  isStrong: boolean
): { ratio: number; hueDiff: number; level: string; pass: boolean } {
  // Cache key includes the actual hex values, not just the keys
  const cacheKey = `${bgKey}:${fgKey}:${bg}:${fg}:${isNonText}:${isBorder}:${isWeak}:${isStrong}`
  
  const cached = contrastScoreCache.get(cacheKey)
  if (cached) {
    return cached
  }
  
  const score = originalGetContrastScore(bg, fg, isNonText, isBorder, isWeak, isStrong)
  contrastScoreCache.set(cacheKey, score)
  return score
}

/**
 * Get cache statistics for debugging/optimization.
 */
export function getContrastCacheStats(): { size: number; hitRate?: number } {
  return {
    size: contrastScoreCache.size,
  }
}

/**
 * Clear the contrast cache if needed (e.g., for testing).
 */
export function clearContrastCache(): void {
  contrastScoreCache.clear()
}
