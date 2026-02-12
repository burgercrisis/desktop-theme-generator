import { useMemo, useCallback, useState } from "react"
import { HSL, HarmonyRule, VariantStrategy, ColorSpace, OutputSpace, SeedColor, PaletteGroup, OpencodeThemeColors, ColorStop } from "../types"
import { hexToHsl } from "../utils/colorUtils"
import { generateHarmony } from "../utils/engine/harmonies"
import { generateOpencodeSeeds, generateOpencodeThemeColors, harmonyOptions, variantStrategyOptions, thematicPresets } from "../utils/harmonies"
import { generateVariants } from "../utils/engine/variants"
import { opencodePresets, getPresetOverrides } from "../utils/themePresets"

interface UseThemeEngineProps {
  baseColor: HSL
  setBaseColor: React.Dispatch<React.SetStateAction<HSL>>
  harmony: HarmonyRule
  setHarmony: React.Dispatch<React.SetStateAction<HarmonyRule>>
  spread: number
  setSpread: React.Dispatch<React.SetStateAction<number>>
  variantCount: number
  setVariantCount: React.Dispatch<React.SetStateAction<number>>
  setSaturation: React.Dispatch<React.SetStateAction<number>>
  lightBrightness: number
  setLightBrightness: React.Dispatch<React.SetStateAction<number>>
  darkBrightness: number
  setDarkBrightness: React.Dispatch<React.SetStateAction<number>>
  lightContrast: number
  setLightContrast: React.Dispatch<React.SetStateAction<number>>
  darkContrast: number
  setDarkContrast: React.Dispatch<React.SetStateAction<number>>
  variantStrategy: VariantStrategy
  setVariantStrategy: React.Dispatch<React.SetStateAction<VariantStrategy>>
  colorSpace: ColorSpace
  outputSpace: OutputSpace
  useOpencodeMode: boolean
  activeMode: "light" | "dark"
  manualOverrides: Record<string, Record<string, string>>
  seedOverrides: Record<string, Record<string, string>>
  seedsInitialized: boolean
  setSeedOverrides: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>
  setSeedsInitialized: React.Dispatch<React.SetStateAction<boolean>>
  isManualChangeRef: React.MutableRefObject<boolean>
  setManualOverrides: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>
  setActivePreset: React.Dispatch<React.SetStateAction<string | null>>
}

export const useThemeEngine = ({
  baseColor, setBaseColor,
  harmony, setHarmony,
  spread, setSpread,
  variantCount, setVariantCount,
  setSaturation,
  lightBrightness, setLightBrightness,
  darkBrightness, setDarkBrightness,
  lightContrast, setLightContrast,
  darkContrast, setDarkContrast,
  variantStrategy, setVariantStrategy,
  colorSpace,
  outputSpace,
  useOpencodeMode,
  activeMode,
  manualOverrides,
  seedOverrides,
  seedsInitialized,
  setSeedOverrides,
  setSeedsInitialized,
  isManualChangeRef,
  setManualOverrides,
  setActivePreset,
}: UseThemeEngineProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const initializeSeeds = useCallback((force = false) => {
    if (seedsInitialized && !force) return

    const lightSeeds = generateOpencodeSeeds(baseColor, harmony, spread, lightBrightness)
    const darkSeeds = generateOpencodeSeeds(baseColor, harmony, spread, darkBrightness)

    const newSeedOverrides = {
      light: { ...seedOverrides.light },
      dark: { ...seedOverrides.dark }
    }

    lightSeeds.forEach(seed => {
      newSeedOverrides.light[seed.name] = seed.hex
    })
    darkSeeds.forEach(seed => {
      newSeedOverrides.dark[seed.name] = seed.hex
    })

    setSeedOverrides(newSeedOverrides)
    setSeedsInitialized(true)
  }, [baseColor, harmony, spread, lightBrightness, darkBrightness, seedOverrides, seedsInitialized, setSeedOverrides, setSeedsInitialized])

  const onEngineParamChange = useCallback((setter: (val: any) => void, val: any) => {
    setter(val);
    isManualChangeRef.current = true;
    if (useOpencodeMode && (Object.keys(seedOverrides.light).length > 0 || Object.keys(seedOverrides.dark).length > 0)) {
      setSeedOverrides({ light: {}, dark: {} });
      setSeedsInitialized(false);
    }
  }, [useOpencodeMode, seedOverrides, setSeedOverrides, setSeedsInitialized, isManualChangeRef]);

  const handleSeedOverride = useCallback((seedName: string, hex: string) => {
    console.log(`🌱 Seed Override: Setting ${seedName} to ${hex} for ${activeMode} mode`)
    isManualChangeRef.current = true;
    setSeedOverrides(prev => ({
      ...prev,
      [activeMode]: {
        ...(prev[activeMode] || {}),
        [seedName]: hex
      }
    }))
  }, [activeMode, setSeedOverrides, isManualChangeRef])

  const handleSeedReset = useCallback((seedName: string) => {
    console.log(`♻️ Seed Reset: Clearing override for ${seedName} in ${activeMode} mode`)
    isManualChangeRef.current = true;
    setSeedOverrides(prev => {
      const updated = { ...prev, [activeMode]: { ...(prev[activeMode] || {}) } }
      delete updated[activeMode][seedName]
      return updated
    })
  }, [activeMode, setSeedOverrides, isManualChangeRef])

  const handleColorChange = useCallback((hsl: HSL) => {
    onEngineParamChange(setBaseColor, hsl)
    onEngineParamChange(setSaturation, Math.round(hsl.s))
  }, [onEngineParamChange, setBaseColor, setSaturation])

  const applyOpencodePreset = useCallback((presetId: string) => {
    const overrides = getPresetOverrides(presetId)
    const preset = opencodePresets[presetId]
    
    isManualChangeRef.current = true;
    setManualOverrides(prev => ({
      ...prev,
      [activeMode]: overrides
    }))
    
    if (preset?.baseColor) setBaseColor(preset.baseColor)
    if (preset?.harmony) setHarmony(preset.harmony)
    if (preset?.variantStrategy) setVariantStrategy(preset.variantStrategy)
    
    setActivePreset(presetId)
  }, [activeMode, setManualOverrides, setBaseColor, setHarmony, setVariantStrategy, setActivePreset])

  const randomizeAll = useCallback(() => {
    isManualChangeRef.current = true;
    if (useOpencodeMode) {
      setSeedOverrides({ light: {}, dark: {} });
      setSeedsInitialized(false);
    }
    const h = Math.floor(Math.random() * 360)
    const s = 40 + Math.floor(Math.random() * 60)
    const l = 40 + Math.floor(Math.random() * 30)
    
    setBaseColor({ h, s, l })
    setSaturation(s)
    
    const randomHarmony = harmonyOptions[Math.floor(Math.random() * harmonyOptions.length)].value
    const randomStrategy = variantStrategyOptions[Math.floor(Math.random() * variantStrategyOptions.length)].value
    
    setHarmony(randomHarmony)
    setVariantStrategy(randomStrategy)
    setVariantCount(12)
    setSpread(15 + Math.floor(Math.random() * 45))
    setLightContrast(20 + Math.floor(Math.random() * 70))
    setDarkContrast(20 + Math.floor(Math.random() * 70))
    setLightBrightness(30 + Math.floor(Math.random() * 40))
    setDarkBrightness(30 + Math.floor(Math.random() * 40))
  }, [useOpencodeMode, setSeedOverrides, setSeedsInitialized, setBaseColor, setSaturation, setHarmony, setVariantStrategy, setVariantCount, setSpread, setLightContrast, setDarkContrast, setLightBrightness, setDarkBrightness, isManualChangeRef])

  const invertBase = useCallback(() => {
    isManualChangeRef.current = true;
    if (useOpencodeMode) {
      setSeedOverrides({ light: {}, dark: {} });
      setSeedsInitialized(false);
    }
    setBaseColor((prev) => {
      const newColor = {
        h: (prev.h + 180) % 360,
        s: prev.s,
        l: 100 - prev.l,
      }
      setSaturation(Math.round(newColor.s))
      return newColor
    })
  }, [useOpencodeMode, setSeedOverrides, setSeedsInitialized, setBaseColor, setSaturation, isManualChangeRef])

  const chaosMode = useCallback(() => {
    isManualChangeRef.current = true;
    if (useOpencodeMode) {
      setSeedOverrides({ light: {}, dark: {} });
      setSeedsInitialized(false);
    }
    const h = Math.floor(Math.random() * 360)
    const s = Math.random() > 0.5 ? 80 + Math.random() * 20 : Math.random() * 30
    const l = Math.random() > 0.5 ? 70 + Math.random() * 30 : Math.random() * 30
    
    setBaseColor({ h, s, l })
    setSaturation(Math.round(s))
    
    const randomHarmony = harmonyOptions[Math.floor(Math.random() * harmonyOptions.length)].value
    const randomStrategy = variantStrategyOptions[Math.floor(Math.random() * variantStrategyOptions.length)].value
    
    setHarmony(randomHarmony)
    setVariantStrategy(randomStrategy)
    setVariantCount(Math.floor(Math.random() * 12) + 1)
    setSpread(Math.floor(Math.random() * 180))
  }, [useOpencodeMode, setSeedOverrides, setSeedsInitialized, setBaseColor, setSaturation, setHarmony, setVariantStrategy, setVariantCount, setSpread, isManualChangeRef])

  const applyThemePreset = useCallback((presetName: keyof typeof thematicPresets) => {
    const preset = thematicPresets[presetName]
    const h = Math.round(preset.h[0] + Math.random() * (preset.h[1] - preset.h[0]))
    const s = Math.round(preset.s[0] + Math.random() * (preset.s[1] - preset.s[0]))
    const l = Math.round(preset.l[0] + Math.random() * (preset.l[1] - preset.l[0]))
    
    setBaseColor({ h, s, l })
    setSaturation(s)
    setHarmony(preset.harmony)
    setVariantStrategy(preset.strategy)
  }, [setBaseColor, setSaturation, setHarmony, setVariantStrategy])

  const lightSeeds9 = useMemo<SeedColor[]>(() => {
    const seedNames = ["primary", "neutral", "interactive", "success", "warning", "error", "info", "diffAdd", "diffDelete"];
    if (useOpencodeMode && seedsInitialized && seedOverrides.light && Object.keys(seedOverrides.light).length > 0) {
      return seedNames.map(name => {
        const hex = seedOverrides.light[name];
        if (hex) return { name, hex, hsl: hexToHsl(hex) };
        const baseSeeds = generateOpencodeSeeds(baseColor, harmony, spread, lightBrightness, variantStrategy);
        return baseSeeds.find(s => s.name === name) || baseSeeds[0];
      });
    }
    const baseSeeds = generateOpencodeSeeds(baseColor, harmony, spread, lightBrightness, variantStrategy)
    return baseSeeds.map(seed => {
      const overrideHex = seedOverrides.light?.[seed.name]
      if (overrideHex) return { ...seed, hex: overrideHex, hsl: hexToHsl(overrideHex) }
      return seed
    })
  }, [useOpencodeMode, seedsInitialized, baseColor, harmony, spread, lightBrightness, seedOverrides.light])

  const darkSeeds9 = useMemo<SeedColor[]>(() => {
    const seedNames = ["primary", "neutral", "interactive", "success", "warning", "error", "info", "diffAdd", "diffDelete"];
    if (useOpencodeMode && seedsInitialized && seedOverrides.dark && Object.keys(seedOverrides.dark).length > 0) {
      return seedNames.map(name => {
        const hex = seedOverrides.dark[name];
        if (hex) return { name, hex, hsl: hexToHsl(hex) };
        const baseSeeds = generateOpencodeSeeds(baseColor, harmony, spread, darkBrightness, variantStrategy);
        return baseSeeds.find(s => s.name === name) || baseSeeds[0];
      });
    }
    const baseSeeds = generateOpencodeSeeds(baseColor, harmony, spread, darkBrightness, variantStrategy)
    return baseSeeds.map(seed => {
      const overrideHex = seedOverrides.dark?.[seed.name]
      if (overrideHex) return { ...seed, hex: overrideHex, hsl: hexToHsl(overrideHex) }
      return seed
    })
  }, [useOpencodeMode, seedsInitialized, baseColor, harmony, spread, darkBrightness, seedOverrides.dark])

  const seeds9 = useMemo<SeedColor[]>(() => {
    return activeMode === "light" ? lightSeeds9 : darkSeeds9
  }, [activeMode, lightSeeds9, darkSeeds9])

  const seedVariantsLight = useMemo(() => {
    const variants: Record<string, ColorStop[]> = {}
    lightSeeds9.forEach((seed) => {
      variants[seed.name] = generateVariants(seed.hsl, variantCount, lightContrast, variantStrategy, colorSpace, outputSpace, 50)
    })
    return variants
  }, [lightSeeds9, variantCount, lightContrast, variantStrategy, colorSpace, outputSpace])

  const seedVariantsDark = useMemo(() => {
    const variants: Record<string, ColorStop[]> = {}
    darkSeeds9.forEach((seed) => {
      variants[seed.name] = generateVariants(seed.hsl, variantCount, darkContrast, variantStrategy, colorSpace, outputSpace, 50)
    })
    return variants
  }, [darkSeeds9, variantCount, darkContrast, variantStrategy, colorSpace, outputSpace])

  const lightThemeColors = useMemo<OpencodeThemeColors>(() => {
    const hexVariants: Record<string, string[]> = {}
    Object.entries(seedVariantsLight).forEach(([name, stops]) => { hexVariants[name] = stops.map(s => s.hex) })
    return generateOpencodeThemeColors(lightSeeds9, hexVariants, false)
  }, [lightSeeds9, seedVariantsLight])

  const darkThemeColors = useMemo<OpencodeThemeColors>(() => {
    const hexVariants: Record<string, string[]> = {}
    Object.entries(seedVariantsDark).forEach(([name, stops]) => { hexVariants[name] = stops.map(s => s.hex) })
    return generateOpencodeThemeColors(darkSeeds9, hexVariants, true)
  }, [darkSeeds9, seedVariantsDark])

  const activeVariantsMap = useMemo(() => {
    return activeMode === "light" ? seedVariantsLight : seedVariantsDark
  }, [activeMode, seedVariantsLight, seedVariantsDark])

  const handleAnalyzeSeeds = useCallback(async (currentSeeds: SeedColor[]) => {
    setIsAnalyzing(true);
    
    // Allow UI to render the loading state
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // 1. Analyze BRIGHTNESS (Average lightness of core seeds)
      const coreSeeds = ["primary", "neutral"];
      let totalL = 0;
      let countL = 0;
      coreSeeds.forEach(name => {
        const s = currentSeeds.find(s => s.name === name);
        if (s) {
          totalL += s.hsl.l;
          countL++;
        }
      });
      const avgL = countL > 0 ? totalL / countL : 50;
      if (activeMode === "light") {
        setLightBrightness(Math.round(avgL));
      } else {
        setDarkBrightness(Math.round(avgL));
      }

      // 2. Analyze SATURATION
      let totalS = 0;
      currentSeeds.forEach(s => totalS += s.hsl.s);
      const avgS = totalS / currentSeeds.length;
      setSaturation(Math.round(avgS));

      // 3. Analyze CONTRAST (Lightness spread)
      // We look for the maximum lightness difference between any two seeds
      // Typically neutral and primary, or a background/text pair if we had one
      let minL = 100;
      let maxL = 0;
      currentSeeds.forEach(s => {
        if (s.hsl.l < minL) minL = s.hsl.l;
        if (s.hsl.l > maxL) maxL = s.hsl.l;
      });
      
      const lDiff = maxL - minL;
      // In Opencode, contrast of 50 usually means a ~20-30% spread. 
      // 100 means ~40-50% spread. 
      const guessedContrast = Math.min(100, Math.max(0, lDiff * 2.2));
      
      if (activeMode === "light") setLightContrast(Math.round(guessedContrast));
      else setDarkContrast(Math.round(guessedContrast));

      // 4. Analyze HARMONY, SPREAD, and STRATEGY
      const baseHue = currentSeeds.find(s => s.name === "primary")?.hsl.h || 0;
      setBaseColor(prev => ({ ...prev, h: baseHue }));

      const harmonyRules = Object.values(HarmonyRule);
      const strategies = Object.values(VariantStrategy);

      // Helper for weighted error calculation (Comparing Seeds)
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

      // PASS 1: Coarse search for (Harmony, Strategy, Spread)
      // We collect the top 5 candidates to verify them more deeply in Pass 2
      interface Candidate {
        hRule: HarmonyRule;
        strat: VariantStrategy;
        sVal: number;
        error: number;
      }
      let candidates: Candidate[] = [];

      for (const strat of strategies) {
        for (const hRule of harmonyRules) {
          for (let sVal = 0; sVal <= 180; sVal += 15) { // Coarser pass to keep performance high
            const testSeeds = generateOpencodeSeeds({ h: baseHue, s: avgS, l: avgL }, hRule, sVal, 50, strat);
            const avgError = calculateSeedError(testSeeds);
            
            let ruleBias = 0;
            switch (hRule) {
              case HarmonyRule.ANALOGOUS: ruleBias = -5; break;
              case HarmonyRule.COMPLEMENTARY: ruleBias = -3; break;
              case HarmonyRule.MONOCHROMATIC: ruleBias = -2; break;
              default: ruleBias = 0;
            }

            candidates.push({ hRule, strat, sVal, error: avgError + ruleBias });
          }
        }
      }

      // Sort and take top 5
      candidates.sort((a, b) => a.error - b.error);
      const topCandidates = candidates.slice(0, 5);

      // PASS 2: Fine-grained search and Variant Verification
      // Now we check the top candidates by comparing their full color ramps
      let bestResult = topCandidates[0];
      let minFullError = Infinity;

      for (const cand of topCandidates) {
        // Refine spread for this candidate
        const startS = Math.max(0, cand.sVal - 15);
        const endS = Math.min(180, cand.sVal + 15);

        for (let sVal = startS; sVal <= endS; sVal += 2.5) {
          const testSeeds = generateOpencodeSeeds({ h: baseHue, s: avgS, l: avgL }, cand.hRule, sVal, 50, cand.strat);
          
          // Generate full variants for primary and neutral to verify the "feel" of the strategy
          let variantError = 0;
          const seedsToVerify = testSeeds.filter(s => ["primary", "neutral"].includes(s.name));
          
          seedsToVerify.forEach(seed => {
            const testVars = generateVariants(seed.hsl, 12, (activeMode === "light" ? lightContrast : darkContrast), cand.strat, colorSpace, outputSpace, 50);
            const currentVars = activeVariantsMap[seed.name] || [];
            
            const compareCount = Math.min(testVars.length, currentVars.length);
            for (let i = 0; i < compareCount; i++) {
              variantError += Math.abs(testVars[i].hsl.l - currentVars[i].hsl.l) * 1.5;
              variantError += Math.abs(testVars[i].hsl.s - currentVars[i].hsl.s) * 0.5;
            }
          });

          const seedErr = calculateSeedError(testSeeds);
          const totalFullError = seedErr + (variantError / 24); // Normalize variant error

          if (totalFullError < minFullError) {
            minFullError = totalFullError;
            bestResult = { ...cand, sVal };
          }
        }
      }

      setHarmony(bestResult.hRule);
      setSpread(bestResult.sVal);
      setVariantStrategy(bestResult.strat);
      setVariantCount(12);

      console.log(`[Analysis] Final Result: Harmony=${bestResult.hRule}, Strategy=${bestResult.strat}, Spread=${bestResult.sVal.toFixed(1)}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [seedsInitialized, activeMode, harmony, spread, variantStrategy, lightContrast, darkContrast, activeVariantsMap, colorSpace, outputSpace, setIsAnalyzing, setLightBrightness, setDarkBrightness, setSaturation, setLightContrast, setDarkContrast, setBaseColor, setHarmony, setSpread, setVariantCount, setVariantStrategy]);

  const themeColors = useMemo<OpencodeThemeColors>(() => {
    const baseColors = activeMode === "light" ? lightThemeColors : darkThemeColors
    const currentOverrides = manualOverrides[activeMode] || {}
    
    // Filter out "unassigned" overrides to allow fallback to baseColors
    const filteredOverrides = Object.entries(currentOverrides).reduce((acc, [key, value]) => {
      if (value && value !== "unassigned") {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)

    return { ...baseColors, ...filteredOverrides }
  }, [activeMode, lightThemeColors, darkThemeColors, manualOverrides])

  const paletteGroups = useMemo(() => {
    if (useOpencodeMode && seedsInitialized) {
      return seeds9.map(s => ({
        base: { name: s.name, hex: s.hex, hsl: s.hsl, displayString: s.hex },
        variants: []
      })) as PaletteGroup[]
    }
    return generateHarmony(baseColor, harmony, spread, variantCount, activeMode === "light" ? lightContrast : darkContrast, activeMode === "light" ? lightBrightness : darkBrightness, variantStrategy, colorSpace, outputSpace)
  }, [baseColor, harmony, spread, variantCount, activeMode, lightContrast, darkContrast, lightBrightness, darkBrightness, variantStrategy, colorSpace, outputSpace, useOpencodeMode, seedsInitialized, seeds9])

  return {
    initializeSeeds,
    onEngineParamChange,
    seeds9,
    lightSeeds9,
    darkSeeds9,
    seedVariantsLight,
    seedVariantsDark,
    activeVariantsMap,
    themeColors,
    paletteGroups,
    handleAnalyzeSeeds,
    randomizeAll,
    invertBase,
    chaosMode,
    applyThemePreset,
    applyOpencodePreset,
    handleColorChange,
    handleSeedOverride,
    handleSeedReset,
    isAnalyzing,
  }
}
