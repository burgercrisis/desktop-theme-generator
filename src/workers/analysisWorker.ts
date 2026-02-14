// Web Worker for expensive analysis calculations
import { generateOpencodeSeeds, generateVariants } from '../utils/cache/cachedFunctions';
import { HSL, HarmonyRule, VariantStrategy, ColorSpace, OutputSpace, SeedColor } from '../types';

interface AnalysisMessage {
  type: 'ANALYZE';
  payload: {
    currentSeeds: SeedColor[];
    baseHue: number;
    avgS: number;
    avgL: number;
    activeMode: 'light' | 'dark';
    lightContrast: number;
    darkContrast: number;
    colorSpace: ColorSpace;
    outputSpace: OutputSpace;
    harmonyRules: string[];
    strategies: string[];
  };
}

interface ProgressMessage {
  type: 'PROGRESS';
  payload: {
    current: number;
    total: number;
    phase: 'coarse' | 'fine';
  };
}

interface ResultMessage {
  type: 'RESULT';
  payload: {
    bestHarmony: string;
    bestSpread: number;
    bestStrategy: string;
  };
}

self.onmessage = async (event: MessageEvent<AnalysisMessage>) => {
  const { type, payload } = event.data;
  
  if (type === 'ANALYZE') {
    await performAnalysis(payload);
  }
};

async function performAnalysis(payload: AnalysisMessage['payload']) {
  const {
    currentSeeds,
    baseHue,
    avgS,
    avgL,
    activeMode,
    lightContrast,
    darkContrast,
    colorSpace,
    outputSpace,
    harmonyRules,
    strategies
  } = payload;

  // Helper for weighted error calculation
  const calculateSeedError = (testSeeds: SeedColor[]) => {
    let totalError = 0;
    let totalWeight = 0;

    currentSeeds.forEach(target => {
      const match = testSeeds.find(ts => ts.name === target.name);
      if (match) {
        const hueDiff = Math.min(Math.abs(match.hsl.h - target.hsl.h), 360 - Math.abs(match.hsl.h - target.hsl.h));
        const satDiff = Math.abs(match.hsl.s - target.hsl.s);
        const lumDiff = Math.abs(match.hsl.l - target.hsl.l);
        
        let semanticWeight = 1.0;
        if (target.name === "primary") semanticWeight = 5.0;
        if (target.name === "neutral") semanticWeight = 4.0;
        if (target.name === "interactive") semanticWeight = 3.0;

        const error = (hueDiff * 2.0) + (satDiff * 0.5) + (lumDiff * 0.5);
        totalError += error * semanticWeight;
        totalWeight += semanticWeight;
      }
    });

    return totalWeight > 0 ? totalError / totalWeight : 999;
  };

  // Intelligent pruning heuristics
  const pruneCandidates = (strategies: string[], harmonyRules: string[]) => {
    // Analyze seed hue distribution to predict likely harmonies
    const hues = currentSeeds.map(s => s.hsl.h).sort((a, b) => a - b);
    const hueSpread = Math.max(...hues) - Math.min(...hues);
    
    let prioritizedStrategies = [...strategies];
    let prioritizedHarmonies = [...harmonyRules];
    
    // Prioritize strategies based on saturation levels
    const avgSaturation = currentSeeds.reduce((sum, s) => sum + s.hsl.s, 0) / currentSeeds.length;
    if (avgSaturation > 70) {
      // High saturation: prioritize vibrant strategies
      prioritizedStrategies = ['Vibrant', 'Neon Glow', 'Hyper', 'Acid Shift', ...strategies.filter(s => !['Vibrant', 'Neon Glow', 'Hyper', 'Acid Shift'].includes(s))];
    } else if (avgSaturation < 30) {
      // Low saturation: prioritize muted strategies
      prioritizedStrategies = ['Tones', 'Pastel', 'Clay', 'Tints & Shades', ...strategies.filter(s => !['Tones', 'Pastel', 'Clay', 'Tints & Shades'].includes(s))];
    }
    
    // Prioritize harmonies based on hue spread
    if (hueSpread < 60) {
      prioritizedHarmonies = ['Monochromatic', 'Analogous', 'Analogous 5', ...harmonyRules.filter(h => !['Monochromatic', 'Analogous', 'Analogous 5'].includes(h))];
    } else if (hueSpread > 180) {
      prioritizedHarmonies = ['Complementary', 'Triadic', 'Tetradic', 'Square', ...harmonyRules.filter(h => !['Complementary', 'Triadic', 'Tetradic', 'Square'].includes(h))];
    }
    
    return { strategies: prioritizedStrategies, harmonies: prioritizedHarmonies };
  };

  const { strategies: prioritizedStrategies, harmonies: prioritizedHarmonies } = pruneCandidates(strategies, harmonyRules);

  // PASS 1: Coarse search with chunking
  interface Candidate {
    hRule: string;
    strat: string;
    sVal: number;
    error: number;
  }
  
  let candidates: Candidate[] = [];
  let processed = 0;
  const totalCoarse = prioritizedStrategies.length * prioritizedHarmonies.length * 13; // 0-180 in steps of 15
  
  // Process in chunks to allow progress updates
  for (let sIndex = 0; sIndex < prioritizedStrategies.length; sIndex++) {
    const strat = prioritizedStrategies[sIndex];
    
    for (let hIndex = 0; hIndex < prioritizedHarmonies.length; hIndex++) {
      const hRule = prioritizedHarmonies[hIndex];
      
      for (let sVal = 0; sVal <= 180; sVal += 15) {
        const testSeeds = generateOpencodeSeeds({ h: baseHue, s: avgS, l: avgL }, hRule as HarmonyRule, sVal, 50, strat as VariantStrategy);
        const avgError = calculateSeedError(testSeeds);
        
        let ruleBias = 0;
        switch (hRule) {
          case 'Analogous': ruleBias = -5; break;
          case 'Complementary': ruleBias = -3; break;
          case 'Monochromatic': ruleBias = -2; break;
          default: ruleBias = 0;
        }

        candidates.push({ hRule, strat, sVal, error: avgError + ruleBias });
        processed++;
        
        // Send progress update every 50 iterations
        if (processed % 50 === 0) {
          (self as any).postMessage({
            type: 'PROGRESS',
            payload: {
              current: processed,
              total: totalCoarse,
              phase: 'coarse'
            }
          } as ProgressMessage);
          
          // Allow UI to breathe
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
  }

  // Sort and take top 5
  candidates.sort((a, b) => a.error - b.error);
  const topCandidates = candidates.slice(0, 5);

  // PASS 2: Fine-grained search with chunking
  let bestResult = topCandidates[0];
  let minFullError = Infinity;
  let processedFine = 0;
  const totalFine = topCandidates.length * 13; // Approximate fine search iterations

  for (const cand of topCandidates) {
    const startS = Math.max(0, cand.sVal - 15);
    const endS = Math.min(180, cand.sVal + 15);

    for (let sVal = startS; sVal <= endS; sVal += 2.5) {
      const testSeeds = generateOpencodeSeeds({ h: baseHue, s: avgS, l: avgL }, cand.hRule as HarmonyRule, sVal, 50, cand.strat as VariantStrategy);
      
      // Generate full variants for primary and neutral to verify "feel" of strategy
      let variantError = 0;
      const seedsToVerify = testSeeds.filter(s => ["primary", "neutral"].includes(s.name));
      
      seedsToVerify.forEach(seed => {
        const testVars = generateVariants(seed.hsl, 12, activeMode === "light" ? lightContrast : darkContrast, cand.strat as VariantStrategy, colorSpace, outputSpace, 50);
        
        // Simplified variant comparison - only check key variants instead of all 12
        const keyIndices = [0, 6, 11]; // Lightest, middle, darkest
        keyIndices.forEach(i => {
          if (testVars[i]) {
            variantError += Math.abs(testVars[i].hsl.l - avgL) * 1.5;
            variantError += Math.abs(testVars[i].hsl.s - avgS) * 0.5;
          }
        });
      });

      const seedErr = calculateSeedError(testSeeds);
      const totalFullError = seedErr + (variantError / 9); // Normalize by key variants count

      if (totalFullError < minFullError) {
        minFullError = totalFullError;
        bestResult = { ...cand, sVal };
      }
      
      processedFine++;
      
      // Send progress update
      if (processedFine % 10 === 0) {
        (self as any).postMessage({
          type: 'PROGRESS',
          payload: {
            current: processedFine,
            total: totalFine,
            phase: 'fine'
          }
        } as ProgressMessage);
        
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  // Send final result
  (self as any).postMessage({
    type: 'RESULT',
    payload: {
      bestHarmony: bestResult.hRule,
      bestSpread: bestResult.sVal,
      bestStrategy: bestResult.strat
    }
  } as ResultMessage);
}
