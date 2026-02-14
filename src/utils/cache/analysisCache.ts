// Smart caching system for analysis operations
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

interface SeedCacheKey {
  h: number;
  s: number;
  l: number;
  harmony: string;
  spread: number;
  strategy: string;
}

interface VariantCacheKey {
  h: number;
  s: number;
  l: number;
  count: number;
  contrast: number;
  strategy: string;
  space: string;
  output: string;
  brightness: number;
}

class AnalysisCache {
  private seedCache = new Map<string, CacheEntry<any>>();
  private variantCache = new Map<string, CacheEntry<any>>();
  private readonly maxCacheSize = 1000;
  private readonly ttl = 5 * 60 * 1000; // 5 minutes

  private generateSeedKey(key: SeedCacheKey): string {
    return `seed:${key.h.toFixed(1)}_${key.s.toFixed(1)}_${key.l.toFixed(1)}_${key.harmony}_${key.spread}_${key.strategy}`;
  }

  private generateVariantKey(key: VariantCacheKey): string {
    return `var:${key.h.toFixed(1)}_${key.s.toFixed(1)}_${key.l.toFixed(1)}_${key.count}_${key.contrast}_${key.strategy}_${key.space}_${key.output}_${key.brightness}`;
  }

  getSeeds(key: SeedCacheKey): any | null {
    const cacheKey = this.generateSeedKey(key);
    const entry = this.seedCache.get(cacheKey);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.seedCache.delete(cacheKey);
      return null;
    }
    
    entry.hits++;
    return entry.data;
  }

  setSeeds(key: SeedCacheKey, data: any): void {
    const cacheKey = this.generateSeedKey(key);
    
    if (this.seedCache.size >= this.maxCacheSize) {
      this.evictLeastUsed(this.seedCache);
    }
    
    this.seedCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  getVariants(key: VariantCacheKey): any | null {
    const cacheKey = this.generateVariantKey(key);
    const entry = this.variantCache.get(cacheKey);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.variantCache.delete(cacheKey);
      return null;
    }
    
    entry.hits++;
    return entry.data;
  }

  setVariants(key: VariantCacheKey, data: any): void {
    const cacheKey = this.generateVariantKey(key);
    
    if (this.variantCache.size >= this.maxCacheSize) {
      this.evictLeastUsed(this.variantCache);
    }
    
    this.variantCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  private evictLeastUsed(cache: Map<string, CacheEntry<any>>): void {
    let leastUsed: { key: string; hits: number } | null = null;
    
    for (const [key, entry] of cache.entries()) {
      if (!leastUsed || entry.hits < leastUsed.hits) {
        leastUsed = { key, hits: entry.hits };
      }
    }
    
    if (leastUsed) {
      cache.delete(leastUsed.key);
    }
  }

  clear(): void {
    this.seedCache.clear();
    this.variantCache.clear();
  }

  getStats() {
    return {
      seedCacheSize: this.seedCache.size,
      variantCacheSize: this.variantCache.size,
      seedHits: Array.from(this.seedCache.values()).reduce((sum, entry) => sum + entry.hits, 0),
      variantHits: Array.from(this.variantCache.values()).reduce((sum, entry) => sum + entry.hits, 0)
    };
  }
}

export const analysisCache = new AnalysisCache();
