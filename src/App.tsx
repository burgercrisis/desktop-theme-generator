import React, { useState, useMemo, useCallback, useDeferredValue, useEffect } from "react"
import ColorWheel from "./components/ColorWheel"
import ThemePreview from "./components/ThemePreview"
import { getContrastScore, hexToHsl, getClosestPassingColor, getClosestHuePassingColor, getThresholdLabel } from "./utils/colorUtils"
import { getCachedContrastScore, clearContrastCache } from "./utils/cachedContrast"
import {
  generateHarmony,
} from "./utils/engine/harmonies"
import {
  generateOpencodeThemeColors,
  generateOpencodeSeeds,
  harmonyOptions,
  variantStrategyOptions,
  thematicPresets,
} from "./utils/harmonies"
import { generateVariants } from "./utils/engine/variants"
import {
  exportToCSS,
  exportToJSON,
  exportToTailwind,
  exportToSCSS,
  exportToOpencode9SeedJSON,
  downloadFile,
  exportFormats,
  writeOpencode9ThemeFile,
} from "./utils/exportUtils"
import { 
  HSL, 
  HarmonyRule, 
  VariantStrategy, 
  DesktopTheme, 
  OpencodeThemeColors, 
  SeedColor, 
  InternalThemeColors,
  ColorSpace,
  OutputSpace,
  ColorStop
} from "./types"
import { opencodePresets, getPresetOverrides } from "./utils/themePresets"
import "./App.css" // Standard App styles

const getInitialState = (key: string, defaultValue: any) => {
  const saved = localStorage.getItem(key)
  if (!saved) return defaultValue
  try {
    const parsed = JSON.parse(saved)
    
    // Migration for nested overrides
    if (key === "manualOverrides" || key === "seedOverrides") {
      if (parsed && typeof parsed === "object" && !parsed.light && !parsed.dark) {
        return { light: parsed, dark: {} }
      }
    }
    
    return parsed
  } catch (e) {
    return defaultValue
  }
}

const App: React.FC = () => {
  const [baseColor, setBaseColor] = useState<HSL>(() => getInitialState("baseColor", { h: 280, s: 65, l: 15 }))
  const [harmony, setHarmony] = useState<HarmonyRule>(() => getInitialState("harmony", HarmonyRule.DOUBLE_SPLIT_COMPLEMENTARY))
  const [spread, setSpread] = useState(() => getInitialState("spread", 30))
  const [variantCount, setVariantCount] = useState(() => getInitialState("variantCount", 12))
  const [saturation, setSaturation] = useState(() => getInitialState("saturation", 50))
  const [lightBrightness, setLightBrightness] = useState(() => getInitialState("lightBrightness", 50))
  const [darkBrightness, setDarkBrightness] = useState(() => getInitialState("darkBrightness", 50))
  const [lightContrast, setLightContrast] = useState(() => getInitialState("lightContrast", 50))
  const [darkContrast, setDarkContrast] = useState(() => getInitialState("darkContrast", 50))
  // Active mode state
  const [activeMode, setActiveMode] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("activeMode")
    return (saved === "light" || saved === "dark") ? saved : "dark"
  })

  // Synchronize body class for theme generator's own UI
  useEffect(() => {
    if (activeMode === 'light') {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
    localStorage.setItem("activeMode", activeMode)
  }, [activeMode])

  const toggleMode = useCallback(() => {
    setActiveMode(prev => prev === "light" ? "dark" : "light")
  }, [])
  const [variantStrategy, setVariantStrategy] = useState<VariantStrategy>(() => getInitialState("variantStrategy", VariantStrategy.GLACIAL))
  const [colorSpace, setColorSpace] = useState<ColorSpace>(() => getInitialState("colorSpace", "HSL"))
  const [outputSpace, setOutputSpace] = useState<OutputSpace>(() => getInitialState("outputSpace", "sRGB"))
  const [useOpencodeMode, setUseOpencodeMode] = useState(() => getInitialState("useOpencodeMode", true))
  const [themeName, setThemeName] = useState("My Theme")
  const [activeTab, setActiveTab] = useState<"palette" | "export">("palette")

  // Matrix Router state
  const [matrixMode, setMatrixMode] = useState(() => getInitialState("matrixMode", false))
  const [manualOverrides, setManualOverrides] = useState<Record<string, Record<string, string>>>(() => getInitialState("manualOverrides", { light: {}, dark: {} }))
  const [seedOverrides, setSeedOverrides] = useState<Record<string, Record<string, string>>>(() => getInitialState("seedOverrides", { light: {}, dark: {} }))
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [writeStatus, setWriteStatus] = useState<"idle" | "writing" | "success" | "error">("idle")
  const [writeError, setWriteError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [quickPicker, setQuickPicker] = useState<{ x: number, y: number, key: string, label: string } | null>(null)
  const [seedsInitialized, setSeedsInitialized] = useState(() => getInitialState("seedsInitialized", false))

  // Manual seed initialization trigger
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
  }, [baseColor, harmony, spread, lightBrightness, darkBrightness, seedOverrides, seedsInitialized])

  // DEFERRED INPUTS: Use React 18 Deferred Value to keep sliders/wheel snappy
  // while offloading heavy palette & WCAG calculations to background priority
  const deferredBaseColor = useDeferredValue(baseColor)
  const deferredHarmony = useDeferredValue(harmony)
  const deferredSpread = useDeferredValue(spread)
  const deferredVariantCount = useDeferredValue(variantCount)
  const deferredLightBrightness = useDeferredValue(lightBrightness)
  const deferredDarkBrightness = useDeferredValue(darkBrightness)
  const deferredLightContrast = useDeferredValue(lightContrast)
  const deferredDarkContrast = useDeferredValue(darkContrast)
  const deferredVariantStrategy = useDeferredValue(variantStrategy)
  const deferredManualOverrides = useDeferredValue(manualOverrides)
  const deferredSeedOverrides = useDeferredValue(seedOverrides)

  // Persistence effect: Consolidated and DEBOUNCED to reduce localStorage I/O overhead
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const stateToSave = {
        baseColor, harmony, spread, variantCount, saturation,
        lightBrightness, darkBrightness, lightContrast, darkContrast,
        variantStrategy, colorSpace, outputSpace, useOpencodeMode,
        themeName, matrixMode, manualOverrides, seedOverrides, seedsInitialized
      }
      Object.entries(stateToSave).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch (e) {
          console.warn(`[App] Failed to save ${key} to localStorage:`, e)
        }
      })
    }, 1000) // Increase debounce to 1s to be safe

    return () => clearTimeout(timeoutId)
  }, [
    baseColor, harmony, spread, variantCount, saturation,
    lightBrightness, darkBrightness, lightContrast, darkContrast,
    variantStrategy, colorSpace, outputSpace, useOpencodeMode,
    themeName, matrixMode, manualOverrides, seedOverrides, seedsInitialized
  ])

  // Holistic palette generation using the new modular engine
  const paletteGroups = useMemo(() => {
    return generateHarmony(
      deferredBaseColor, 
      deferredHarmony, 
      deferredSpread, 
      deferredVariantCount, 
      activeMode === "light" ? deferredLightContrast : deferredDarkContrast, 
      activeMode === "light" ? deferredLightBrightness : deferredDarkBrightness,
      deferredVariantStrategy,
      colorSpace,
      outputSpace
    )
  }, [deferredBaseColor, deferredHarmony, deferredSpread, deferredVariantCount, activeMode, deferredLightContrast, deferredDarkContrast, deferredLightBrightness, deferredDarkBrightness, deferredVariantStrategy, colorSpace, outputSpace])

  // Generate 9 seeds for Opencode mode (functional seeds) - Separate for Light/Dark
  const lightSeeds9 = useMemo<SeedColor[]>(() => {
    const baseSeeds = generateOpencodeSeeds(deferredBaseColor, deferredHarmony, deferredSpread, deferredLightBrightness)
    return baseSeeds.map(seed => {
      const overrideHex = deferredSeedOverrides.light?.[seed.name]
      if (overrideHex) {
        return {
          ...seed,
          hex: overrideHex,
          hsl: hexToHsl(overrideHex)
        }
      }
      return seed
    })
  }, [deferredBaseColor, deferredHarmony, deferredSpread, deferredLightBrightness, deferredSeedOverrides.light])

  const darkSeeds9 = useMemo<SeedColor[]>(() => {
    const baseSeeds = generateOpencodeSeeds(deferredBaseColor, deferredHarmony, deferredSpread, deferredDarkBrightness)
    return baseSeeds.map(seed => {
      const overrideHex = deferredSeedOverrides.dark?.[seed.name]
      if (overrideHex) {
        return {
          ...seed,
          hex: overrideHex,
          hsl: hexToHsl(overrideHex)
        }
      }
      return seed
    })
  }, [deferredBaseColor, deferredHarmony, deferredSpread, deferredDarkBrightness, deferredSeedOverrides.dark])

  // Active seeds for UI display/preview
  const seeds9 = useMemo<SeedColor[]>(() => {
    return activeMode === "light" ? lightSeeds9 : darkSeeds9
  }, [activeMode, lightSeeds9, darkSeeds9])

  // Generate variants map for Opencode mapping (Engine-powered) - Separate for Light/Dark
  const seedVariantsLight = useMemo(() => {
    const variants: Record<string, ColorStop[]> = {}
    lightSeeds9.forEach((seed) => {
      const variantsForSeed = generateVariants(
        seed.hsl,
        deferredVariantCount,
        deferredLightContrast,
        deferredVariantStrategy,
        colorSpace,
        outputSpace,
        50 // Always 50 because seed.hsl already has mode brightness baked in
      )
      variants[seed.name] = variantsForSeed
    })
    return variants
  }, [lightSeeds9, deferredVariantCount, deferredLightContrast, deferredVariantStrategy, colorSpace, outputSpace])

  const seedVariantsDark = useMemo(() => {
    const variants: Record<string, ColorStop[]> = {}
    darkSeeds9.forEach((seed) => {
      const variantsForSeed = generateVariants(
        seed.hsl,
        deferredVariantCount,
        deferredDarkContrast,
        deferredVariantStrategy,
        colorSpace,
        outputSpace,
        50 // Always 50 because seed.hsl already has mode brightness baked in
      )
      variants[seed.name] = variantsForSeed
    })
    return variants
  }, [darkSeeds9, deferredVariantCount, deferredDarkContrast, deferredVariantStrategy, colorSpace, outputSpace])

  // Generate theme colors for both modes
  const lightThemeColors = useMemo<OpencodeThemeColors>(() => {
    // Map variants to hex strings for theme color generation
    const hexVariants: Record<string, string[]> = {}
    Object.entries(seedVariantsLight).forEach(([name, stops]) => {
      hexVariants[name] = stops.map(s => s.hex)
    })
    return generateOpencodeThemeColors(lightSeeds9, hexVariants, false)
  }, [lightSeeds9, seedVariantsLight])

  const darkThemeColors = useMemo<OpencodeThemeColors>(() => {
    // Map variants to hex strings for theme color generation
    const hexVariants: Record<string, string[]> = {}
    Object.entries(seedVariantsDark).forEach(([name, stops]) => {
      hexVariants[name] = stops.map(s => s.hex)
    })
    return generateOpencodeThemeColors(darkSeeds9, hexVariants, true)
  }, [darkSeeds9, seedVariantsDark])

  // Active variants for Matrix selection
  const activeVariantsMap = useMemo(() => {
    return activeMode === "light" ? seedVariantsLight : seedVariantsDark
  }, [activeMode, seedVariantsLight, seedVariantsDark])

  // Active theme colors for UI display/preview
  const themeColors = useMemo<OpencodeThemeColors>(() => {
    const baseColors = activeMode === "light" ? lightThemeColors : darkThemeColors
    const currentOverrides = deferredManualOverrides[activeMode] || {}
    
    // Apply manual overrides
    return { ...baseColors, ...currentOverrides }
  }, [activeMode, lightThemeColors, darkThemeColors, deferredManualOverrides])

  // Helper for formatting UI labels to 'AGENT LOG' style
  const formatAgentLabel = useCallback((str: string) => {
    if (!str) return ""
    return str.replace(/-/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
  }, [])

  // WCAG Compliance Pairs - Comprehensive list for checker
  const wcagPairs = useMemo(() => {
    // Return empty array if not in matrix mode to save heavy calculation
    if (!matrixMode) return []

    clearContrastCache()
    const pairs: Array<{ 
      label: string; 
      bg: string; 
      fg: string; 
      bgKey: string; 
      fgKey: string; 
      desc: string; 
      isNonText?: boolean; 
      isBorder?: boolean; 
      isWeak?: boolean; 
      isStrong?: boolean;
      category: string; 
      type: 'shell' | 'read' | 'action' | 'diff'; 
      score: { ratio: number, hueDiff: number, level: string, pass: boolean } 
    }> = []
    const seenPairs = new Set<string>()
    
    const addPair = (category: string, label: string, bgKey: string, fgKey: string, desc: string, isNonTextParam = false) => {
      const pairId = `${category}:${bgKey}:${fgKey}`
      if (seenPairs.has(pairId)) return
      seenPairs.add(pairId)

      const bg = themeColors[bgKey as keyof OpencodeThemeColors]
      const fg = themeColors[fgKey as keyof OpencodeThemeColors]
      if (typeof bg === 'string' && typeof fg === 'string') {
        const isBorderElement = fgKey.includes('border') || 
                               fgKey.includes('ring') || 
                               fgKey.includes('divider') || 
                               fgKey.includes('rule') || 
                               fgKey.includes('separator');

        const isExplicitText = !isBorderElement && (
                               fgKey.includes('text') || 
                               fgKey.includes('foreground') || 
                               fgKey.includes('title') || 
                               fgKey.includes('label') || 
                               fgKey.includes('placeholder') || 
                               fgKey.includes('description') ||
                               fgKey.includes('syntax') ||
                               // Functional icons that actually print text (like diff +/-)
                               (fgKey.includes('icon') && (
                                 category.includes('DIFF')
                               ))
                             ) && !label.includes("SELECTION");

        const isNonText = isNonTextParam || !isExplicitText;
        const isStrong = fgKey.includes('strong');
        const isWeak = fgKey.includes('weak');

        // Use cached contrast score
        const contrastScore = getCachedContrastScore(
          bg, 
          fg, 
          isNonText,
          isBorderElement, 
          isWeak, 
          isStrong, 
          category
        );
        
        // Determine type based on category
        let type: 'shell' | 'read' | 'action' | 'diff' = 'shell';
        if (category.includes('SURFACES')) type = 'shell';
        else if (category.includes('TYPOGRAPHY')) type = 'read';
        else if (category.includes('INTERACTIVE') || category.includes('ACTIONS') || category.includes('BUTTONS')) type = 'action';
        else if (category.includes('STATUS') || category.includes('SEMANTIC')) type = 'diff';

        pairs.push({
          category,
          label,
          bg,
          fg,
          bgKey,
          fgKey,
          desc,
          isNonText,
          isBorder: isBorderElement,
          isStrong,
          isWeak,
          type,
          score: contrastScore
        })
      }
    }

      // --- LOG_01_TYPOGRAPHY ---
      // We exclude surfaces here to avoid duplicates with LOG_02_SURFACES
      const backgrounds = ["background-base", "background-strong"]
      const coreTexts = ["text-base", "text-weak", "text-strong"]
      
      backgrounds.forEach(bg => {
        coreTexts.forEach(fg => {
          addPair("LOG_01_TYPOGRAPHY", `${formatAgentLabel(fg.replace("text-", ""))}_ON_${formatAgentLabel(bg.replace("background-", ""))}`, bg, fg, `${fg} ON ${bg}`, false)
        })
      })

      // --- LOG_02_SURFACES ---
      const surfaceCategories = [
        { name: "LOG_02_SURFACES", prefix: "surface-base", items: ["base", "hover"] },
        { name: "LOG_02_SURFACES", prefix: "surface-inset", items: ["base", "strong"] },
        { name: "LOG_02_SURFACES", prefix: "surface-raised", items: ["base", "strong", "stronger-non-alpha"] },
        { name: "LOG_02_SURFACES", prefix: "surface-float", items: ["base", "strong"] },
      ]

      surfaceCategories.forEach(cat => {
        cat.items.forEach(item => {
          // Fix mapping to match schema
          let bgKey = ""
          if (item === "base" && (cat.prefix === "surface-base" || cat.prefix === "surface-weak" || cat.prefix === "surface-weaker" || cat.prefix === "surface-strong")) {
            bgKey = cat.prefix
          } else if (item === "hover" && cat.prefix === "surface-base") {
            bgKey = "surface-base-hover"
          } else if (item === "active" && cat.prefix === "surface-base") {
            bgKey = "surface-base-active"
          } else {
            bgKey = `${cat.prefix}-${item}`
          }

          addPair("LOG_02_SURFACES", formatAgentLabel(bgKey.replace("surface-", "")), "background-base", bgKey, `SURFACE ${bgKey.toUpperCase().replace(/-/g, '_')} ON BACKGROUND`, true)
          addPair("LOG_02_SURFACES", `TEXT_ON_${formatAgentLabel(bgKey.replace("surface-", ""))}`, bgKey, "text-base", `TEXT_BASE_ON_${bgKey.toUpperCase().replace(/-/g, '_')}`, false)
          addPair("LOG_02_SURFACES", `ICON_ON_${formatAgentLabel(bgKey.replace("surface-", ""))}`, bgKey, "icon-base", `ICON_BASE_ON_${bgKey.toUpperCase().replace(/-/g, '_')}`, true)
          
          // Hover comparison: Hover state vs Base state (1.1/15 requirement)
          if (bgKey.includes("-hover")) {
            const baseKey = bgKey.replace("-hover", "");
            if (themeColors[baseKey as keyof OpencodeThemeColors]) {
              addPair("LOG_02_SURFACES", `${formatAgentLabel(bgKey.replace("surface-", ""))}_VS_BASE`, baseKey, bgKey, `HOVER VS BASE STATE`, true);
            }
          }
        })
      })

      // --- LOG_03_ACTIONS ---
      const interactiveSurfaces = [
        { bg: "surface-brand-base", fg: "text-on-brand-base", label: "BRAND_BASE" },
        { bg: "surface-brand-hover", fg: "text-on-brand-base", label: "BRAND_HOVER" },
        { bg: "surface-brand-active", fg: "text-on-brand-base", label: "BRAND_ACTIVE" },
        { bg: "surface-brand-base", fg: "text-on-brand-strong", label: "BRAND_STRONG" },
        { bg: "surface-interactive-base", fg: "text-on-interactive-base", label: "INTERACTIVE_BASE" },
        { bg: "surface-interactive-hover", fg: "text-on-interactive-base", label: "INTERACTIVE_HOVER" },
        { bg: "surface-interactive-active", fg: "text-on-interactive-base", label: "INTERACTIVE_ACTIVE" },
        { bg: "surface-interactive-weak", fg: "text-on-interactive-weak", label: "INTERACTIVE_WEAK" },
        { bg: "surface-interactive-weak-hover", fg: "text-on-interactive-weak", label: "INTERACTIVE_WEAK_HOVER" }
      ]
      interactiveSurfaces.forEach(s => {
        addPair("LOG_03_ACTIONS", formatAgentLabel(s.label), s.bg, s.fg, `TEXT_ON_${s.bg.toUpperCase().replace(/-/g, '_')}`, false)
        
        // Hover/Active vs Base state comparisons
        if (s.bg.includes("-hover")) {
          const baseKey = s.bg.replace("-hover", "-base");
          if (themeColors[baseKey as keyof OpencodeThemeColors]) {
            addPair("LOG_03_ACTIONS", `${formatAgentLabel(s.label)}_VS_BASE`, baseKey, s.bg, `HOVER VS BASE STATE`, true);
          }
        } else if (s.bg.includes("-active")) {
          const baseKey = s.bg.replace("-active", "-base");
          if (themeColors[baseKey as keyof OpencodeThemeColors]) {
            addPair("LOG_03_ACTIONS", `${formatAgentLabel(s.label)}_VS_BASE`, baseKey, s.bg, `ACTIVE VS BASE STATE`, true);
          }
        }
      })
      
      addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_TEXT"), "background-base", "text-interactive-base", "INTERACTIVE_TEXT_ON_BACKGROUND", false)
      addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_ICON"), "background-base", "icon-interactive-base", "INTERACTIVE_ICON_CONTRAST", true)
      addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_BORDER"), "background-base", "border-interactive-base", "INTERACTIVE_BORDER_CONTRAST", true)
      addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_BORDER_HOVER"), "background-base", "border-interactive-hover", "INTERACTIVE_BORDER_HOVER_CONTRAST", true)
      addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_BORDER_ACTIVE"), "background-base", "border-interactive-active", "INTERACTIVE_BORDER_ACTIVE_CONTRAST", true)
      addPair("LOG_03_ACTIONS", formatAgentLabel("INTERACTIVE_BORDER_SELECTED"), "background-base", "border-interactive-selected", "INTERACTIVE_BORDER_SELECTED_CONTRAST", true)

      // --- LOG_04_BUTTONS ---
      addPair("LOG_04_BUTTONS", formatAgentLabel("SECONDARY_BASE"), "button-secondary-base", "text-base", "SECONDARY_BUTTON_TEXT", false)
      addPair("LOG_04_BUTTONS", formatAgentLabel("SECONDARY_HOVER"), "button-secondary-hover", "text-base", "SECONDARY_BUTTON_HOVER_TEXT", false)
      addPair("LOG_04_BUTTONS", formatAgentLabel("SECONDARY_HOVER_VS_BASE"), "button-secondary-base", "button-secondary-hover", "SECONDARY HOVER VS BASE", true)
      
      addPair("LOG_04_BUTTONS", formatAgentLabel("GHOST_HOVER"), "button-ghost-hover", "text-base", "GHOST_BUTTON_HOVER_TEXT", false)
      addPair("LOG_04_BUTTONS", formatAgentLabel("GHOST_HOVER_VS_BASE"), "background-base", "button-ghost-hover", "GHOST HOVER VS BASE", true)
      
      addPair("LOG_04_BUTTONS", formatAgentLabel("GHOST_HOVER2"), "button-ghost-hover2", "text-base", "GHOST_BUTTON_HOVER2_TEXT", false)
      addPair("LOG_04_BUTTONS", formatAgentLabel("GHOST_HOVER2_VS_BASE"), "background-base", "button-ghost-hover2", "GHOST HOVER2 VS BASE", true)
      
      addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_BASE"), "button-danger-base", "text-on-critical-base", "DANGER_BUTTON_TEXT", false)
      addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_HOVER"), "button-danger-hover", "text-on-critical-base", "DANGER_BUTTON_HOVER_TEXT", false)
      addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_HOVER_VS_BASE"), "button-danger-base", "button-danger-hover", "DANGER HOVER VS BASE", true)
      
      addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_ACTIVE"), "button-danger-active", "text-on-critical-base", "DANGER_BUTTON_ACTIVE_TEXT", false)
      addPair("LOG_04_BUTTONS", formatAgentLabel("DANGER_ACTIVE_VS_BASE"), "button-danger-base", "button-danger-active", "DANGER ACTIVE VS BASE", true)

      // --- LOG_05_SEMANTIC ---
      const semanticTypes = ["success", "warning", "critical", "info"]
      semanticTypes.forEach(type => {
        const states = [
          { suffix: "base", label: "BASE" },
          { suffix: "hover", label: "HOVER" },
          { suffix: "active", label: "ACTIVE" },
          { suffix: "weak", label: "WEAK" },
          { suffix: "strong", label: "STRONG" }
        ]
        states.forEach(state => {
          const bgKey = `surface-${type}-${state.suffix}`
          const fgKey = (state.suffix === 'strong' || state.suffix === 'base') 
            ? `text-on-${type}-${state.suffix === 'strong' ? 'strong' : 'base'}`
            : `text-on-${type}-base`;
          
          addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_${state.label}`), bgKey, fgKey, `${type.toUpperCase()}_${state.label}_SURFACE_CONTRAST`, false)
          
          // Verify strong text on all semantic surfaces
          addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_STRONG_ON_${state.label}`), bgKey, `text-on-${type}-strong`, `${type.toUpperCase()}_STRONG_TEXT_ON_${state.label}_SURFACE`, false)
          
          // Hover/Active vs Base state comparisons for semantic surfaces
          if (state.suffix === "hover" || state.suffix === "active") {
            const baseKey = `surface-${type}-base`;
            if (themeColors[baseKey as keyof OpencodeThemeColors]) {
              addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_${state.label}_VS_BASE`), baseKey, bgKey, `${state.label} VS BASE STATE`, true);
            }
          }
        })
        addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_ICON`), `background-base`, `icon-${type}-base`, `${type.toUpperCase()}_ICON_ON_BACKGROUND`, true)
        addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_BORDER`), `background-base`, `border-${type}-base`, `${type.toUpperCase()}_BORDER_ON_BACKGROUND`, true)
        
        // --- NEW: STRONG VARIANTS ON BACKGROUND ---
        addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_STRONG_ON_BG`), `background-base`, `text-on-${type}-strong`, `${type.toUpperCase()}_STRONG_TEXT_ON_MAIN_BG`, false)
        addPair("LOG_05_SEMANTIC", formatAgentLabel(`${type}_BASE_ON_BG`), `background-base`, `text-on-${type}-base`, `${type.toUpperCase()}_BASE_TEXT_ON_MAIN_BG`, false)
      })

      // --- LOG_06_DIFFS ---
      const diffStates = [
        { type: "add", label: "ADD" },
        { type: "delete", label: "DELETE" },
        { type: "hidden", label: "HIDDEN" }
      ]
      diffStates.forEach(diff => {
        // Base text contrast
        addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_TEXT`), `surface-diff-${diff.type}-base`, `text-diff-${diff.type}-base`, `DIFF_${diff.label}_TEXT_CONTRAST`, false)
        
        // Weak/Weaker background variations with base text
        addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_WEAK`), `surface-diff-${diff.type}-weak`, `text-diff-${diff.type}-base`, `${diff.label}_TEXT_ON_WEAK_BACKGROUND`, false)
        addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_WEAKER`), `surface-diff-${diff.type}-weaker`, `text-diff-${diff.type}-base`, `${diff.label}_TEXT_ON_WEAKER_BACKGROUND`, false)
        
        // Strong background variations with strong text
        addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_STRONG`), `surface-diff-${diff.type}-strong`, `text-diff-${diff.type}-strong`, `STRONG_${diff.label}_TEXT_CONTRAST`, false)
        
        // Stronger background (often used for intense highlighting)
        const strongerFg = diff.type === 'delete' ? 'text-on-critical-base' : (diff.type === 'add' ? 'text-on-success-base' : 'text-base')
        addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_STRONGER`), `surface-diff-${diff.type}-stronger`, strongerFg, `${diff.label}_TEXT_ON_STRONGER_BACKGROUND`, false)
        
        // Icon contrast on main background
        addPair("LOG_06_DIFFS", formatAgentLabel(`${diff.label}_ICON`), `background-base`, `icon-diff-${diff.type}-base`, `DIFF_${diff.label}_ICON_ON_BACKGROUND`, true)
      })
      addPair("LOG_06_DIFFS", formatAgentLabel("SKIP_BACKGROUND"), "background-base", "surface-diff-skip-base", "SKIP_LINE_CONTRAST", true)
      addPair("LOG_06_DIFFS", formatAgentLabel("UNCHANGED_BACKGROUND"), "background-base", "surface-diff-unchanged-base", "UNCHANGED_LINE_CONTRAST", true)
      
      // Syntax diff highlights (used in code editors for diffs)
      addPair("LOG_06_DIFFS", formatAgentLabel("SYNTAX_DIFF_ADD"), "code-background", "syntax-diff-add", "SYNTAX_DIFF_ADD_ON_CODE_BG", false)
      addPair("LOG_06_DIFFS", formatAgentLabel("SYNTAX_DIFF_DELETE"), "code-background", "syntax-diff-delete", "SYNTAX_DIFF_DELETE_ON_CODE_BG", false)

      // --- LOG_07_INPUTS ---
      addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_TEXT"), "input-base", "text-base", "TEXT_INSIDE_INPUT_FIELD", false)
      addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_BORDER"), "background-base", "border-base", "INPUT_BORDER_ON_BACKGROUND", true)
      addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_PLACEHOLDER"), "input-base", "text-weaker", "PLACEHOLDER_TEXT_CONTRAST", false)
      addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_HOVER"), "input-hover", "text-base", "TEXT_IN_HOVERED_INPUT", false)
      addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_ACTIVE"), "input-active", "text-base", "TEXT_IN_ACTIVE_INPUT", false)
      addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_DISABLED"), "background-base", "input-disabled", "DISABLED_INPUT_BACKGROUND_CONTRAST", true)
      addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_SELECTED_BORDER"), "background-base", "border-selected", "SELECTED_INPUT_BORDER_CONTRAST", true)
      addPair("LOG_07_INPUTS", formatAgentLabel("INPUT_FOCUS_RING"), "background-base", "input-focus-ring", "INPUT FOCUS RING", true)

      // --- LOG_08_TERMINAL ---
      const ansiColors = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"]
      ansiColors.forEach(color => {
        addPair("LOG_08_TERMINAL", formatAgentLabel(color), "background-base", `terminal-ansi-${color}`, `TERMINAL ${color.toUpperCase()} ON BACKGROUND`, false)
        addPair("LOG_08_TERMINAL", formatAgentLabel(`bright-${color}`), "background-base", `terminal-ansi-bright-${color}`, `TERMINAL BRIGHT ${color.toUpperCase()} ON BACKGROUND`, false)
      })
      addPair("LOG_08_TERMINAL", formatAgentLabel("TERMINAL_CURSOR"), "background-base", "terminal-cursor", "TERMINAL CURSOR CONTRAST", true)
      addPair("LOG_08_TERMINAL", formatAgentLabel("TERMINAL_SELECTION"), "terminal-selection", "text-base", "TERMINAL SELECTION CONTRAST", false)

      // --- LOG_09_COMPARISONS (1.1 vs 4.5) ---
      // This section explicitly compares decorative elements (1.1) vs functional/text elements (4.5)
      addPair("LOG_09_COMPARISONS", formatAgentLabel("TEXT_BASE_VS_ICON_BASE"), "background-base", "text-base", "TEXT (4.5:1) VS ICON (1.1:1)", false)
      addPair("LOG_09_COMPARISONS", formatAgentLabel("ICON_BASE_VS_TEXT_BASE"), "background-base", "icon-base", "ICON (1.1:1) VS TEXT (4.5:1)", true)
      
      addPair("LOG_09_COMPARISONS", formatAgentLabel("ACTIVE_INDICATOR_VS_BORDER"), "background-base", "line-indicator-active", "ACTIVE INDICATOR (4.5:1) VS BORDER (1.1:1)", true)
      addPair("LOG_09_COMPARISONS", formatAgentLabel("BORDER_VS_ACTIVE_INDICATOR"), "background-base", "border-base", "BORDER (1.1:1) VS ACTIVE INDICATOR (4.5:1)", true)
      
      addPair("LOG_09_COMPARISONS", formatAgentLabel("STATUS_ICON_VS_DECORATIVE"), "background-base", "status-icon", "STATUS ICON (4.5:1) VS DECORATIVE (1.1:1)", true)
      addPair("LOG_09_COMPARISONS", formatAgentLabel("ICON_WEAK_VS_STATUS"), "background-base", "icon-weak", "WEAK ICON (1.1:1) VS STATUS (4.5:1)", true)
      
      addPair("LOG_09_COMPARISONS", formatAgentLabel("TAB_ACTIVE_VS_INACTIVE"), "background-base", "tab-active", "ACTIVE TAB (4.5:1) VS INACTIVE (1.1:1)", true)
      addPair("LOG_09_COMPARISONS", formatAgentLabel("SURFACE_WEAK_VS_ACTIVE"), "background-base", "surface-weak", "WEAK SURFACE (1.1:1) VS ACTIVE (4.5:1)", true)

      addPair("LOG_09_COMPARISONS", formatAgentLabel("TERMINAL_CURSOR_VS_BORDER"), "background-base", "terminal-cursor", "CURSOR (4.5:1) VS BORDER (1.1:1)", true)
      addPair("LOG_09_COMPARISONS", formatAgentLabel("LOGO_VS_TEXT"), "background-base", "logo-base-strong", "LOGO (1.1:1) VS TEXT (4.5:1)", true)

      // --- LOG_09_AVATARS ---
      const avatarColors = ["pink", "mint", "orange", "purple", "cyan", "lime", "blue", "green", "yellow", "red", "gray"]
      avatarColors.forEach(color => {
        addPair("LOG_09_AVATARS", formatAgentLabel(color), `avatar-background-${color}`, `avatar-text-${color}`, `AVATAR_${color.toUpperCase()}_CONTRAST`, false)
      })

      // --- LOG_10_SYNTAX ---
      const syntaxTokensDetailed = [
        "syntax-comment", "syntax-keyword", "syntax-function", "syntax-variable", 
        "syntax-string", "syntax-number", "syntax-type", "syntax-operator", 
        "syntax-punctuation", "syntax-object", "syntax-regexp", "syntax-primitive", 
        "syntax-property", "syntax-constant", "syntax-tag", "syntax-attribute",
        "syntax-value", "syntax-namespace", "syntax-class",
        "syntax-success", "syntax-warning", "syntax-critical", "syntax-info", 
        "syntax-diff-add", "syntax-diff-delete"
      ]
      syntaxTokensDetailed.forEach(token => {
        const parts = token.split("-")
        const label = formatAgentLabel(parts.length > 2 ? `${parts[1]}_${parts[2]}` : parts[1])
        addPair("LOG_10_SYNTAX", label, "code-background", token, `SYNTAX ${label} ON EDITOR BACKGROUND`, false)
      })

      // --- LOG_11_UI_EXTRAS ---
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("LINE_INDICATOR"), "background-base", "line-indicator", "LINE INDICATOR CONTRAST", false)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("LINE_INDICATOR_ACTIVE"), "background-base", "line-indicator-active", "ACTIVE LINE INDICATOR CONTRAST", false)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("LINE_INDICATOR_HOVER"), "background-base", "line-indicator-hover", "HOVER LINE INDICATOR CONTRAST", false)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("TAB_ACTIVE"), "background-base", "tab-active", "ACTIVE TAB INDICATOR CONTRAST", true)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("TAB_INACTIVE"), "background-base", "tab-inactive", "INACTIVE TAB INDICATOR CONTRAST", true)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("TAB_HOVER"), "background-base", "tab-hover", "HOVER TAB INDICATOR CONTRAST", true)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("FOCUS_RING"), "background-base", "focus-ring", "FOCUS RING CONTRAST", true)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("SCROLLBAR"), "scrollbar-track", "scrollbar-thumb", "SCROLLBAR CONTRAST", true)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("SELECTION"), "selection-background", "selection-foreground", "SELECTION CONTRAST", true)
      addPair("LOG_11_UI_EXTRAS", formatAgentLabel("INACTIVE_SELECTION"), "selection-inactive-background", "text-base", "INACTIVE SELECTION CONTRAST", true)

      // --- LOG_12_SPLASH_LOADING ---
      // Splash screen background is usually background-base or a specific surface
      addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_BASE"), "background-base", "icon-base", "OPENCODE LOGO BASE ON BACKGROUND", true)
      addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_STRONG"), "background-base", "icon-strong-base", "OPENCODE LOGO STRONG ON BACKGROUND", true)
      addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_WEAK"), "background-base", "icon-weak-base", "OPENCODE LOGO WEAK ON BACKGROUND", true)
      addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_BASE_STRONG"), "icon-base", "icon-strong-base", "LOGO BASE VS STRONG", true)
      addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_BASE_WEAK"), "icon-base", "icon-weak-base", "LOGO BASE VS WEAK", true)
      addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOGO_STRONG_WEAK"), "icon-strong-base", "icon-weak-base", "LOGO STRONG VS WEAK", true)

      // --- LOG_13_TREE_UI ---
      addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_BG_SELECTED"), "background-base", "tree-background-selected", "TREE SELECTED BG CONTRAST", true)
      addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_BG_HOVER"), "background-base", "tree-background-hover", "TREE HOVER BG CONTRAST", true)
      addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_SELECTED_TEXT"), "tree-background-selected", "tree-foreground-selected", "TREE SELECTED TEXT CONTRAST", false)
      addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_HOVER_TEXT"), "tree-background-hover", "tree-foreground-hover", "TREE HOVER TEXT CONTRAST", false)
      addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_ICON_SELECTED"), "tree-background-selected", "tree-icon-selected", "TREE SELECTED ICON CONTRAST", true)
      addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_TEXT_ON_BASE"), "background-base", "text-base", "TREE TEXT ON MAIN BACKGROUND", false)
      addPair("LOG_13_TREE_UI", formatAgentLabel("TREE_TEXT_WEAK_ON_BASE"), "background-base", "text-weak", "TREE WEAK TEXT ON MAIN BACKGROUND", false)

      // --- LOG_14_TABS_EXTENDED ---
      addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_ACTIVE_BG"), "background-base", "tab-active-background", "ACTIVE TAB BG CONTRAST", true)
      addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_ACTIVE_TEXT"), "tab-active-background", "tab-active-foreground", "ACTIVE TAB TEXT CONTRAST", false)
      addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_ACTIVE_BORDER"), "background-base", "tab-active-border", "ACTIVE TAB BORDER/INDICATOR", true)
      addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_INACTIVE_BG"), "background-base", "tab-inactive-background", "INACTIVE TAB BG CONTRAST", true)
      addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_INACTIVE_TEXT"), "tab-inactive-background", "tab-inactive-foreground", "INACTIVE TAB TEXT CONTRAST", false)
      addPair("LOG_14_TABS_EXTENDED", formatAgentLabel("TAB_HOVER_TEXT"), "background-base", "text-strong", "TAB HOVER TEXT CONTRAST", false)

      // --- LOG_15_BREADCRUMBS ---
      addPair("LOG_15_BREADCRUMBS", formatAgentLabel("BREADCRUMB_TEXT"), "background-base", "breadcrumb-foreground", "BREADCRUMB TEXT ON BG", false)
      addPair("LOG_15_BREADCRUMBS", formatAgentLabel("BREADCRUMB_HOVER"), "background-base", "breadcrumb-foreground-hover", "BREADCRUMB HOVER TEXT ON BG", false)
      addPair("LOG_15_BREADCRUMBS", formatAgentLabel("BREADCRUMB_SEP"), "background-base", "breadcrumb-separator", "BREADCRUMB SEPARATOR CONTRAST", true)
      addPair("LOG_15_BREADCRUMBS", formatAgentLabel("BREADCRUMB_BG"), "background-base", "breadcrumb-background", "BREADCRUMB BG CONTRAST", true)

      // --- LOG_16_BORDERS_FUNCTIONAL ---
      const functionalBorders = ["interactive", "success", "warning", "critical", "info"]
      functionalBorders.forEach(type => {
        addPair("LOG_16_BORDERS_FUNCTIONAL", formatAgentLabel(`${type}_BORDER_BASE`), "background-base", `border-${type}-base`, `${type.toUpperCase()} BORDER ON BG`, true)
        addPair("LOG_16_BORDERS_FUNCTIONAL", formatAgentLabel(`${type}_BORDER_HOVER`), "background-base", `border-${type}-hover`, `${type.toUpperCase()} BORDER HOVER ON BG`, true)
        addPair("LOG_16_BORDERS_FUNCTIONAL", formatAgentLabel(`${type}_BORDER_SELECT`), "background-base", `border-${type}-selected`, `${type.toUpperCase()} BORDER SELECTED ON BG`, true)
      })

      // --- LOG_17_MARKDOWN_DETAILED ---
      const markdownElements = [
        { key: "markdown-text", label: "TEXT" },
        { key: "markdown-heading", label: "HEADING" },
        { key: "markdown-link", label: "LINK" },
        { key: "markdown-link-text", label: "LINK_TEXT" },
        { key: "markdown-code", label: "CODE_INLINE" },
        { key: "markdown-block-quote", label: "BLOCKQUOTE" },
        { key: "markdown-emph", label: "EMPHASIS" },
        { key: "markdown-strong", label: "STRONG" },
        { key: "markdown-list-item", label: "LIST_ITEM" },
        { key: "markdown-list-enumeration", label: "LIST_ENUM" },
        { key: "markdown-image", label: "IMAGE" },
        { key: "markdown-image-text", label: "IMAGE_TEXT" }
      ]
      markdownElements.forEach(el => {
        addPair("LOG_17_MARKDOWN_DETAILED", formatAgentLabel(el.label), "background-base", el.key, `MARKDOWN ${el.label} ON BACKGROUND`, false)
      })
      addPair("LOG_17_MARKDOWN_DETAILED", formatAgentLabel("CODE_BLOCK_BG"), "background-base", "markdown-code-block", "MARKDOWN CODE BLOCK CONTRAST", true)
      addPair("LOG_17_MARKDOWN_DETAILED", formatAgentLabel("HR_LINE"), "background-base", "markdown-horizontal-rule", "MARKDOWN HORIZONTAL RULE", true)
      
      addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOADING_SPINNER"), "background-base", "icon-interactive-base", "LOADING SPINNER CONTRAST", true)
      addPair("LOG_12_SPLASH_LOADING", formatAgentLabel("LOADING_TEXT"), "background-base", "text-weak", "LOADING TEXT CONTRAST", false)

      // --- LOG_18_EDITOR_ADDITIONAL ---
      addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("CODE_FOREGROUND"), "code-background", "code-foreground", "EDITOR DEFAULT TEXT CONTRAST", false)
      addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("LINE_INDICATOR"), "background-base", "line-indicator", "LINE INDICATOR CONTRAST", false)
      addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("LINE_INDICATOR_ACTIVE"), "background-base", "line-indicator-active", "ACTIVE LINE INDICATOR CONTRAST", false)
      addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("TAB_ACTIVE"), "background-base", "tab-active", "ACTIVE TAB CONTRAST", true)
      addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("TAB_INACTIVE"), "background-base", "tab-inactive", "INACTIVE TAB CONTRAST", true)
      addPair("LOG_18_EDITOR_ADDITIONAL", formatAgentLabel("TAB_HOVER"), "background-base", "tab-hover", "HOVER TAB CONTRAST", true)

      // --- LOG_19_BORDERS ---
      const borderTokens = [
        "border-base", "border-hover", "border-active", "border-selected",
        "border-weak-base", "border-weak-hover", "border-weak-active",
        "border-weaker-base", "border-weaker-hover", "border-weaker-active",
        "border-strong-base", "border-strong-hover", "border-strong-active",
        "border-interactive-base", "border-success-base", "border-warning-base", "border-critical-base", "border-info-base"
      ]
      borderTokens.forEach(token => {
        addPair("LOG_19_BORDERS", formatAgentLabel(token.replace("border-", "")), "background-base", token, `BORDER ${token.toUpperCase().replace(/-/g, '_')} ON BACKGROUND`, true)
      })

      // --- LOG_30_ICONS_DETAILED ---
      const iconVariants = ["base", "hover", "active", "selected"]
      const iconStrengths = ["", "weak-", "weaker-", "strong-"]
      iconStrengths.forEach(strength => {
        iconVariants.forEach(variant => {
          const token = `icon-${strength}${variant}`
          addPair("LOG_30_ICONS_DETAILED", formatAgentLabel(token), "background-base", token, `ICON ${token.toUpperCase()} ON BACKGROUND`, true)
        })
      })

      // --- LOG_20_SELECTIONS ---
      addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_TEXT"), "selection-background", "selection-foreground", "SELECTION TEXT CONTRAST", true)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("BASE_TEXT_ON_SELECTION"), "selection-background", "text-base", "BASE TEXT ON SELECTION BACKGROUND", true)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("INACTIVE_SELECTION_TEXT"), "selection-inactive-background", "text-base", "TEXT ON INACTIVE SELECTION", true)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_VS_BG"), "background-base", "selection-background", "SELECTION BACKGROUND VS BASE", true)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("INACTIVE_SELECTION_VS_BG"), "background-base", "selection-inactive-background", "INACTIVE SELECTION VS BASE", true)
      
      // Tree/Session Specific Selections
      addPair("LOG_20_SELECTIONS", formatAgentLabel("TREE_SELECTED_TEXT"), "tree-background-selected", "tree-foreground-selected", "TREE SELECTED ITEM TEXT", false)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("TREE_HOVER_TEXT"), "tree-background-hover", "tree-foreground-hover", "TREE HOVER ITEM TEXT", false)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("TREE_SELECTED_ICON"), "tree-background-selected", "tree-icon-selected", "TREE SELECTED ITEM ICON", true)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("TREE_SELECTED_VS_BG"), "background-base", "tree-background-selected", "TREE SELECTION VS BACKGROUND", true)
      
      // Detailed text on tree selection (for session items)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("TREE_SELECTED_TEXT_BASE"), "tree-background-selected", "text-base", "BASE TEXT ON TREE SELECTION", false)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("TREE_SELECTED_TEXT_WEAK"), "tree-background-selected", "text-weak", "WEAK TEXT ON TREE SELECTION", false)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("TREE_SELECTED_DIFF_ADD"), "tree-background-selected", "text-diff-add-base", "DIFF ADD TEXT ON TREE SELECTION", false)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("TREE_SELECTED_DIFF_DELETE"), "tree-background-selected", "text-diff-delete-base", "DIFF DELETE TEXT ON TREE SELECTION", false)
      
      // Detailed text on general selection
      addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_TEXT_BASE"), "selection-background", "text-base", "BASE TEXT ON SELECTION", false)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_TEXT_WEAK"), "selection-background", "text-weak", "WEAK TEXT ON SELECTION", false)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_DIFF_ADD"), "selection-background", "text-diff-add-base", "DIFF ADD TEXT ON SELECTION", false)
      addPair("LOG_20_SELECTIONS", formatAgentLabel("SELECTION_DIFF_DELETE"), "selection-background", "text-diff-delete-base", "DIFF DELETE TEXT ON SELECTION", false)

      // --- LOG_21_SEMANTIC_SURFACES ---
      const surfaceSemanticTypes = ["brand", "interactive", "success", "warning", "critical", "info"]
      surfaceSemanticTypes.forEach(type => {
        // Text on base semantic surface
        const bg = `surface-${type}-base`
        const fg = `text-on-${type}-base`
        addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_ON_BASE`), bg, fg, `TEXT ON ${type.toUpperCase()} BASE`, false)
        
        // Text variants on base semantic surface
        if (themeColors[`text-on-${type}-weak` as keyof OpencodeThemeColors]) {
          addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_WEAK_ON_BASE`), bg, `text-on-${type}-weak`, `WEAK TEXT ON ${type.toUpperCase()} BASE`, false)
        }
        if (themeColors[`text-on-${type}-strong` as keyof OpencodeThemeColors]) {
          addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_STRONG_ON_BASE`), bg, `text-on-${type}-strong`, `STRONG TEXT ON ${type.toUpperCase()} BASE`, false)
        }

        // Hover/Active surface contrast with base text
        addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_ON_HOVER`), `surface-${type}-hover`, fg, `TEXT ON ${type.toUpperCase()} HOVER`, false)
        if (themeColors[`surface-${type}-active` as keyof OpencodeThemeColors]) {
          addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_TEXT_ON_ACTIVE`), `surface-${type}-active`, fg, `TEXT ON ${type.toUpperCase()} ACTIVE`, false)
        }

        // Weak surface variant (often used for background tint) with base text
        if (themeColors[`surface-${type}-weak` as keyof OpencodeThemeColors]) {
          addPair("LOG_21_SEMANTIC_SURFACES", formatAgentLabel(`${type}_BASE_TEXT_ON_WEAK`), `surface-${type}-weak`, "text-base", `BASE TEXT ON WEAK ${type.toUpperCase()}`, false)
        }
      })

      // --- LOG_22_INVERTED_TEXT ---
      addPair("LOG_22_INVERTED_TEXT", formatAgentLabel("INVERT_TEXT_ON_STRONG"), "surface-strong", "text-invert-base", "INVERTED TEXT ON STRONG SURFACE", false)
      addPair("LOG_22_INVERTED_TEXT", formatAgentLabel("INVERT_TEXT_ON_BRAND"), "surface-brand-base", "text-invert-base", "INVERTED TEXT ON BRAND SURFACE", false)
      addPair("LOG_22_INVERTED_TEXT", formatAgentLabel("INVERT_ICON_ON_STRONG"), "surface-strong", "icon-invert-base", "INVERTED ICON ON STRONG SURFACE", true)

      // --- LOG_22_COLORED_TEXT_ICON ---
      const coloredBgs = [
        { key: "brand", label: "BRAND" },
        { key: "success", label: "SUCCESS" },
        { key: "warning", label: "WARNING" },
        { key: "critical", label: "CRITICAL" },
        { key: "info", label: "INFO" }
      ]
      coloredBgs.forEach(bg => {
        // Text variants on colored backgrounds
        ["weak", "weaker"].forEach(variant => {
          const fgKey = `text-on-${bg.key}-${variant}`
          const bgKey = `surface-${bg.key}-base`
          addPair("LOG_22_COLORED_TEXT_ICON", formatAgentLabel(`${bg.label}_${variant.toUpperCase()}_TEXT`), bgKey, fgKey, `${variant.toUpperCase()} TEXT ON ${bg.label} BASE`, false)
        })
        
        // Icons on colored backgrounds
        const iconKey = `icon-on-${bg.key}-base`
        const bgKey = `surface-${bg.key}-base`
        addPair("LOG_22_COLORED_TEXT_ICON", formatAgentLabel(`${bg.label}_ICON`), bgKey, iconKey, `${bg.label} ICON ON ${bg.label} BASE`, true)
      })

      // --- LOG_23_AGENT_UI ---
      const agentIcons = ["plan", "docs", "ask", "build"]
      agentIcons.forEach(icon => {
        addPair("LOG_23_AGENT_UI", formatAgentLabel(`AGENT_${icon.toUpperCase()}_ICON`), "background-base", `icon-agent-${icon}-base`, `AGENT ${icon.toUpperCase()} ICON CONTRAST`, true)
      })

      // --- LOG_24_INTERACTIVE_STATES ---
      const interactiveTokens = [
        { key: "hover", label: "HOVER" },
        { key: "active", label: "ACTIVE" },
        { key: "selected", label: "SELECTED" }
      ]
      interactiveTokens.forEach(state => {
        addPair("LOG_24_INTERACTIVE_STATES", formatAgentLabel(`ICON_${state.label}`), "background-base", `icon-${state.key}`, `ICON ${state.label} ON BACKGROUND`, true)
        addPair("LOG_24_INTERACTIVE_STATES", formatAgentLabel(`BORDER_${state.label}`), "background-base", `border-${state.key}`, `BORDER ${state.label} ON BACKGROUND`, true)
      })

      // --- LOG_25_SEMANTIC_DETAILED ---
      const semanticStates = ["brand", "success", "warning", "critical", "info"]
      semanticStates.forEach(type => {
        const statefulIcons = ["hover", "selected"]
        statefulIcons.forEach(state => {
          const bgKey = `surface-${type}-base`
          const fgKey = `icon-on-${type}-${state}`
          addPair("LOG_25_SEMANTIC_DETAILED", formatAgentLabel(`${type}_ICON_${state}`), bgKey, fgKey, `${type.toUpperCase()} ICON ${state.toUpperCase()} ON ${type.toUpperCase()} BASE`, true)
        })
      })

      // --- LOG_26_COMPLEX_SURFACES ---
      addPair("LOG_26_COMPLEX_SURFACES", formatAgentLabel("RAISED_STRONGER_NON_ALPHA"), "background-base", "surface-raised-stronger-non-alpha", "RAISED STRONGER (NON-ALPHA) SURFACE CONTRAST", true)
      addPair("LOG_26_COMPLEX_SURFACES", formatAgentLabel("FLOAT_STRONG_ACTIVE"), "background-base", "surface-float-strong-active", "FLOAT STRONG ACTIVE SURFACE CONTRAST", true)
      addPair("LOG_26_COMPLEX_SURFACES", formatAgentLabel("INTERACTIVE_ACTIVE_SURFACE"), "background-base", "surface-base-interactive-active", "INTERACTIVE ACTIVE SURFACE CONTRAST", true)

      // --- LOG_27_INVERTED_TEXT_ICON ---
      const darkSurfaces = [
        { key: "surface-strong", label: "STRONG" },
        { key: "surface-brand-base", label: "BRAND" },
        { key: "surface-critical-base", label: "CRITICAL" }
      ]
      darkSurfaces.forEach(bg => {
        addPair("LOG_27_INVERTED_TEXT_ICON", formatAgentLabel(`INVERT_TEXT_ON_${bg.label}`), bg.key, "text-invert-base", `INVERTED TEXT ON ${bg.label}`, false)
        addPair("LOG_27_INVERTED_TEXT_ICON", formatAgentLabel(`INVERT_ICON_ON_${bg.label}`), bg.key, "icon-invert-base", `INVERTED ICON ON ${bg.label}`, true)
      })

      // --- LOG_28_INPUT_DETAILED ---
      addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_DISABLED_TEXT"), "input-disabled", "text-weaker", "DISABLED INPUT TEXT CONTRAST", false)
      addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_HOVER_BORDER"), "background-base", "border-hover", "INPUT HOVER BORDER CONTRAST", true)
      addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_ACTIVE_BORDER"), "background-base", "border-active", "INPUT ACTIVE BORDER CONTRAST", true)
      addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_HOVER_VS_BASE"), "input-base", "input-hover", "INPUT HOVER VS BASE CONTRAST", true)
      addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_ACTIVE_VS_BASE"), "input-base", "input-active", "INPUT ACTIVE VS BASE CONTRAST", true)
      addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_ACTIVE_VS_HOVER"), "input-hover", "input-active", "INPUT ACTIVE VS HOVER CONTRAST", true)
      addPair("LOG_28_INPUT_DETAILED", formatAgentLabel("INPUT_BASE_VS_BG"), "background-base", "input-base", "INPUT BASE VS BACKGROUND", true)

      // --- LOG_29_DIFF_EXTRAS ---
      addPair("LOG_29_DIFF_EXTRAS", formatAgentLabel("DIFF_MODIFIED_ICON"), "background-base", "icon-diff-modified-base", "DIFF MODIFIED ICON CONTRAST", true)
      addPair("LOG_29_DIFF_EXTRAS", formatAgentLabel("DIFF_ADD_HOVER_ICON"), "background-base", "icon-diff-add-hover", "DIFF ADD HOVER ICON CONTRAST", true)
      addPair("LOG_29_DIFF_EXTRAS", formatAgentLabel("DIFF_ADD_ACTIVE_ICON"), "background-base", "icon-diff-add-active", "DIFF ADD ACTIVE ICON CONTRAST", true)

       // --- LOG_31_AVATAR_EXPANDED ---
       const extraAvatars = ["blue", "green", "yellow", "red", "gray"]
       extraAvatars.forEach(color => {
         addPair("LOG_31_AVATAR_EXPANDED", formatAgentLabel(color), `avatar-background-${color}`, `avatar-text-${color}`, `AVATAR_${color.toUpperCase()}_CONTRAST`, false)
       })

       // --- LOG_32_MISC_BORDERS_ICONS ---
      addPair("LOG_32_MISC_BORDERS_ICONS", formatAgentLabel("BORDER_COLOR"), "background-base", "border-color", "GENERAL BORDER COLOR CONTRAST", true)
      addPair("LOG_32_MISC_BORDERS_ICONS", formatAgentLabel("BORDER_DISABLED"), "background-base", "border-disabled", "DISABLED BORDER CONTRAST", true)
      addPair("LOG_32_MISC_BORDERS_ICONS", formatAgentLabel("ICON_WEAK_HOVER"), "background-base", "icon-weak-hover", "WEAK ICON HOVER CONTRAST", true)
      addPair("LOG_32_MISC_BORDERS_ICONS", formatAgentLabel("ICON_STRONG_SELECTED"), "background-base", "icon-strong-selected", "STRONG ICON SELECTED CONTRAST", true)

      // --- LOG_33_SURFACE_TEXT_PAIRS ---
      const surfaceTypes = ["inset", "raised", "float"]
      surfaceTypes.forEach(s => {
        const bg = `surface-${s}-base`
        addPair("LOG_33_SURFACE_TEXT_PAIRS", formatAgentLabel(`${s.toUpperCase()}_TEXT_BASE`), bg, "text-base", `TEXT ON ${s.toUpperCase()} SURFACE`, false)
        addPair("LOG_33_SURFACE_TEXT_PAIRS", formatAgentLabel(`${s.toUpperCase()}_TEXT_WEAK`), bg, "text-weak", `WEAK TEXT ON ${s.toUpperCase()} SURFACE`, false)
        addPair("LOG_33_SURFACE_TEXT_PAIRS", formatAgentLabel(`${s.toUpperCase()}_TEXT_STRONG`), bg, "text-strong", `STRONG TEXT ON ${s.toUpperCase()} SURFACE`, false)
      })
      
      // Inset strong surface often used for deeper depth
      if (themeColors["surface-inset-strong" as keyof OpencodeThemeColors]) {
        addPair("LOG_33_SURFACE_TEXT_PAIRS", formatAgentLabel("INSET_STRONG_TEXT"), "surface-inset-strong", "text-base", "TEXT ON INSET STRONG SURFACE", false)
      }

      // --- LOG_34_INTERACTIVE_SURFACE_PAIRS ---
       const detailedInteractiveSurfaces = ["brand", "interactive"]
       detailedInteractiveSurfaces.forEach(s => {
         const bg = `surface-${s}-base`
         addPair("LOG_34_INTERACTIVE_SURFACE_PAIRS", formatAgentLabel(`${s.toUpperCase()}_TEXT`), bg, `text-on-${s}-base`, `${s.toUpperCase()} TEXT ON SURFACE`, false)
         addPair("LOG_34_INTERACTIVE_SURFACE_PAIRS", formatAgentLabel(`${s.toUpperCase()}_ICON`), bg, `icon-on-${s}-base`, `${s.toUpperCase()} ICON ON SURFACE`, true)
       })

       // --- LOG_35_BUTTON_TEXT ---
       addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("SECONDARY_BUTTON_TEXT"), "button-secondary-base", "text-base", "SECONDARY BUTTON TEXT", false)
       addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("DANGER_BUTTON_TEXT"), "button-danger-base", "text-on-critical-base", "DANGER BUTTON TEXT", false)
       addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("GHOST_BUTTON_TEXT"), "background-base", "text-base", "GHOST BUTTON TEXT (NORMAL)", false)
       addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("GHOST_BUTTON_HOVER_TEXT"), "button-ghost-hover", "text-base", "GHOST BUTTON TEXT (HOVER)", false)
       addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("SECONDARY_BUTTON_HOVER_VS_BASE"), "button-secondary-base", "button-secondary-hover", "SECONDARY BUTTON HOVER VS BASE", true)
       addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("DANGER_BUTTON_HOVER_VS_BASE"), "button-danger-base", "button-danger-hover", "DANGER BUTTON HOVER VS BASE", true)
       addPair("LOG_35_BUTTON_TEXT", formatAgentLabel("GHOST_BUTTON_HOVER_VS_BG"), "background-base", "button-ghost-hover", "GHOST BUTTON HOVER VS BACKGROUND", true)

    return pairs
  }, [themeColors, matrixMode, formatAgentLabel])

  const deferredWcagPairs = useDeferredValue(wcagPairs)

  // Desktop theme object for export/preview
  const theme = useMemo<DesktopTheme>(() => {
    // For general preview, we use the active mode's variants
    const currentVariants = activeMode === "light" ? seedVariantsLight : seedVariantsDark
    const flatVariants = Object.values(currentVariants).flat()

    return {
      name: themeName,
      colors: themeColors as InternalThemeColors,
      palette: flatVariants,
    }
  }, [themeName, themeColors, activeMode, seedVariantsLight, seedVariantsDark])

  // Trigger initial seeds ONLY ONCE if not already initialized
  useEffect(() => {
    if (!seedsInitialized) {
      initializeSeeds();
    }
  }, [seedsInitialized, initializeSeeds]);

// Matrix Router properties (Categorized for easier browsing)
const MATRIX_PROPERTIES = [
  { category: "BACKGROUND", keys: ["background-base", "background-weak", "background-strong", "background-stronger"] },
  { category: "SURFACE_BASE", keys: ["surface-base", "surface-base-hover", "surface-base-active", "surface-base-interactive-active", "surface-weak", "surface-weaker", "surface-strong"] },
  { category: "SURFACE_INSET", keys: ["surface-inset-base", "surface-inset-base-hover", "surface-inset-base-active", "surface-inset-strong", "surface-inset-strong-hover"] },
  { category: "SURFACE_RAISED", keys: ["surface-raised-base", "surface-raised-base-hover", "surface-raised-base-active", "surface-raised-strong", "surface-raised-strong-hover", "surface-raised-stronger", "surface-raised-stronger-hover", "surface-raised-stronger-non-alpha"] },
  { category: "SURFACE_FLOAT", keys: ["surface-float-base", "surface-float-base-hover", "surface-float-base-active", "surface-float-strong", "surface-float-strong-hover", "surface-float-strong-active"] },
  { category: "SURFACE_FUNCTIONAL", keys: ["surface-brand-base", "surface-brand-hover", "surface-brand-active", "surface-interactive-base", "surface-interactive-hover", "surface-interactive-active", "surface-interactive-weak", "surface-interactive-weak-hover", "surface-success-base", "surface-success-hover", "surface-success-active", "surface-success-weak", "surface-success-strong", "surface-warning-base", "surface-warning-hover", "surface-warning-active", "surface-warning-weak", "surface-warning-strong", "surface-critical-base", "surface-critical-hover", "surface-critical-active", "surface-critical-weak", "surface-critical-strong", "surface-info-base", "surface-info-hover", "surface-info-active", "surface-info-weak", "surface-info-strong"] },
  { category: "SURFACE_DIFF", keys: ["surface-diff-unchanged-base", "surface-diff-skip-base", "surface-diff-add-base", "surface-diff-add-weak", "surface-diff-add-weaker", "surface-diff-add-strong", "surface-diff-add-stronger", "surface-diff-delete-base", "surface-diff-delete-weak", "surface-diff-delete-weaker", "surface-diff-delete-strong", "surface-diff-delete-stronger", "surface-diff-hidden-base", "surface-diff-hidden-weak", "surface-diff-hidden-weaker", "surface-diff-hidden-strong", "surface-diff-hidden-stronger"] },
  { category: "TEXT_CORE", keys: ["text-base", "text-weak", "text-weaker", "text-strong", "text-stronger", "text-invert-base", "text-invert-weak", "text-invert-weaker", "text-invert-strong"] },
  { category: "TEXT_FUNCTIONAL", keys: ["text-on-brand-base", "text-on-brand-weak", "text-on-brand-weaker", "text-on-brand-strong", "text-interactive-base", "text-on-interactive-base", "text-on-interactive-weak", "text-on-success-base", "text-on-success-weak", "text-on-success-strong", "text-on-warning-base", "text-on-warning-weak", "text-on-warning-strong", "text-on-critical-base", "text-on-critical-weak", "text-on-critical-strong", "text-on-info-base", "text-on-info-weak", "text-on-info-strong", "text-diff-add-base", "text-diff-add-strong", "text-diff-delete-base", "text-diff-delete-strong"] },
  { category: "INPUT", keys: ["input-base", "input-hover", "input-active", "input-disabled"] },
  { category: "BUTTON", keys: ["button-secondary-base", "button-secondary-hover", "button-ghost-hover", "button-ghost-hover2", "button-danger-base", "button-danger-hover", "button-danger-active"] },
  { category: "BORDER_CORE", keys: ["border-base", "border-hover", "border-active", "border-selected", "border-disabled", "border-focus", "border-color"] },
  { category: "BORDER_WEAK", keys: ["border-weak-base", "border-weak-hover", "border-weak-active", "border-weak-selected", "border-weak-disabled", "border-weak-focus"] },
  { category: "BORDER_WEAKER", keys: ["border-weaker-base", "border-weaker-hover", "border-weaker-active", "border-weaker-selected", "border-weaker-disabled", "border-weaker-focus"] },
  { category: "BORDER_STRONG", keys: ["border-strong-base", "border-strong-hover", "border-strong-active", "border-strong-selected", "border-strong-disabled", "border-strong-focus"] },
  { category: "BORDER_FUNCTIONAL", keys: ["border-interactive-base", "border-interactive-hover", "border-interactive-active", "border-interactive-selected", "border-success-base", "border-success-hover", "border-success-selected", "border-warning-base", "border-warning-hover", "border-warning-selected", "border-critical-base", "border-critical-hover", "border-critical-selected", "border-info-base", "border-info-hover", "border-info-selected"] },
  { category: "ICON_CORE", keys: ["icon-base", "icon-hover", "icon-active", "icon-selected", "icon-disabled", "icon-focus", "icon-invert-base"] },
  { category: "ICON_WEAK", keys: ["icon-weak-base", "icon-weak-hover", "icon-weak-active", "icon-weak-selected", "icon-weak-disabled", "icon-weak-focus"] },
  { category: "ICON_STRONG", keys: ["icon-strong-base", "icon-strong-hover", "icon-strong-active", "icon-strong-selected", "icon-strong-disabled", "icon-strong-focus"] },
  { category: "ICON_FUNCTIONAL", keys: ["icon-brand-base", "icon-interactive-base", "icon-success-base", "icon-warning-base", "icon-critical-base", "icon-info-base", "icon-diff-add-base", "icon-diff-add-hover", "icon-diff-add-active", "icon-diff-delete-base", "icon-diff-delete-hover", "icon-diff-modified-base"] },
  { category: "ICON_ON_COLOR", keys: ["icon-on-brand-base", "icon-on-brand-hover", "icon-on-brand-selected", "icon-on-interactive-base", "icon-on-success-base", "icon-on-success-hover", "icon-on-success-selected", "icon-on-warning-base", "icon-on-warning-hover", "icon-on-warning-selected", "icon-on-critical-base", "icon-on-critical-hover", "icon-on-critical-selected", "icon-on-info-base", "icon-on-info-hover", "icon-on-info-selected"] },
  { category: "ICON_AGENT", keys: ["icon-agent-plan-base", "icon-agent-docs-base", "icon-agent-ask-base", "icon-agent-build-base"] },
  { category: "TERMINAL_ANSI", keys: ["terminal-ansi-black", "terminal-ansi-red", "terminal-ansi-green", "terminal-ansi-yellow", "terminal-ansi-blue", "terminal-ansi-magenta", "terminal-ansi-cyan", "terminal-ansi-white", "terminal-ansi-bright-black", "terminal-ansi-bright-red", "terminal-ansi-bright-green", "terminal-ansi-bright-yellow", "terminal-ansi-bright-blue", "terminal-ansi-bright-magenta", "terminal-ansi-bright-cyan", "terminal-ansi-bright-white"] },
  { category: "SYNTAX_CORE", keys: ["syntax-comment", "syntax-keyword", "syntax-function", "syntax-variable", "syntax-string", "syntax-number", "syntax-type", "syntax-operator", "syntax-punctuation", "syntax-object", "syntax-regexp", "syntax-primitive", "syntax-property", "syntax-constant"] },
  { category: "SYNTAX_WEB", keys: ["syntax-tag", "syntax-attribute", "syntax-value", "syntax-namespace", "syntax-class"] },
  { category: "SYNTAX_SEMANTIC", keys: ["syntax-success", "syntax-warning", "syntax-critical", "syntax-info", "syntax-diff-add", "syntax-diff-delete"] },
  { category: "MARKDOWN", keys: ["markdown-text", "markdown-heading", "markdown-link", "markdown-link-text", "markdown-code", "markdown-block-quote", "markdown-emph", "markdown-strong", "markdown-horizontal-rule", "markdown-list-item", "markdown-list-enumeration", "markdown-image", "markdown-image-text", "markdown-code-block"] },
  { category: "TREE_UI", keys: ["tree-background-selected", "tree-background-hover", "tree-foreground-selected", "tree-foreground-hover", "tree-icon-selected"] },
  { category: "BREADCRUMBS", keys: ["breadcrumb-background", "breadcrumb-foreground", "breadcrumb-foreground-hover", "breadcrumb-separator"] },
  { category: "EDITOR_UI", keys: ["code-background", "code-foreground", "line-indicator", "line-indicator-active", "line-indicator-hover", "tab-active", "tab-inactive", "tab-hover", "tab-active-background", "tab-active-foreground", "tab-active-border", "tab-inactive-background", "tab-inactive-foreground"] },
  { category: "AVATAR", keys: ["avatar-background", "avatar-foreground", "avatar-background-pink", "avatar-background-mint", "avatar-background-orange", "avatar-background-purple", "avatar-background-cyan", "avatar-background-lime", "avatar-text-pink", "avatar-text-mint", "avatar-text-orange", "avatar-text-purple", "avatar-text-cyan", "avatar-text-lime"] },
  { category: "SCROLLBAR", keys: ["scrollbar-thumb", "scrollbar-track"] },
  { category: "MISC", keys: ["focus-ring", "shadow", "overlay", "selection-background", "selection-foreground", "selection-inactive-background"] }
]

const MatrixTokenRow = React.memo(({ 
  property, 
  currentColor, 
  activeMode, 
  isOverridden, 
  handleManualReset, 
  handleManualOverride, 
  setQuickPicker, 
  formatAgentLabel, 
  activeVariantsMap,
  themeColors
}: any) => {
  // Find background for this token to calculate "Fix"
  const bgKey = property.includes('icon-on') ? 'surface-brand-base' : 'background-base';
  const background = themeColors[bgKey] || themeColors['background-base'];
  
  // Detect flags for getClosestPassingColor
  const isExplicitText = property.includes('text') || 
                         property.includes('foreground') || 
                         property.includes('syntax') || 
                         property.includes('markdown') || 
                         property.includes('ansi') || 
                         property.includes('label') || 
                         property.includes('heading') || 
                         property.includes('link') || 
                         property.includes('comment') || 
                         property.includes('keyword') || 
                         property.includes('variable') || 
                         property.includes('string') || 
                         property.includes('number') || 
                         property.includes('type') || 
                         property.includes('operator') || 
                         property.includes('punctuation') ||
                         property.includes('constant') ||
                         property.includes('property') ||
                         property.includes('regexp') ||
                         property.includes('primitive') ||
                         property.includes('object') ||
                         property.includes('tag') ||
                         property.includes('attribute') ||
                         property.includes('value') ||
                         property.includes('namespace') ||
                         property.includes('class') ||
                         property.includes('emph') || 
                         (property.includes('strong') && !property.includes('surface')) ||
                         property.includes('line-indicator') ||
                         property.includes('separator') ||
                         property.includes('DIFF_DELETE_TEXT') ||
                         property.includes('DIFF_ADD_TEXT') ||
                         property.includes('DIFF_HIDDEN_TEXT') ||
                         property.includes('delete') ||
                         property.includes('add') ||
                         property.includes('modified') ||
                         property.includes('hidden');

  const isBorder = !isExplicitText && (property.includes('border') || property.includes('rule') || property.includes('separator'));
  
  // CRITICAL: Any property containing 'surface' or 'background' is Non-Text and Weak (Target 1.1:1)
  const isSurfaceOrBg = property.includes('surface') || property.includes('background');
  const isNonText = isSurfaceOrBg || (!isExplicitText && (property.includes('icon') || isBorder || property.includes('indicator')));
  const isWeak = isSurfaceOrBg || property.includes('weak') || property.includes('weaker') || (isNonText && (property.includes('hover') || property.includes('selected') || property.includes('inactive')));
  
  // Apply "strong" logic to Matrix rows too
  // CRITICAL: Surfaces are NEVER strong
  const isStrong = !isWeak && !isSurfaceOrBg && (
    property.includes('strong') || 
    property.includes('brand') ||
    property.includes('success') || 
    property.includes('warning') || 
    property.includes('critical') || 
    property.includes('info') ||
    property.includes('add') || 
    property.includes('delete') || 
    property.includes('modified') ||
    property.includes('terminal-cursor') ||
    property.includes('line-indicator-active') ||
    property.includes('tab-active') ||
    property.includes('breadcrumb-item-active') ||
    property.includes('nav-item-active') ||
    property.includes('button-icon') ||
    property.includes('input-icon') ||
    property.includes('status-icon') ||
    property.includes('badge-icon') ||
    property.includes('avatar-icon')
  );

  const contrast = getContrastScore(background, currentColor, isNonText, isBorder, isWeak, isStrong);
  const isFailing = !contrast.pass;

  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-purple-500/5 transition-colors group">
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => handleManualReset(property)}
          className={`w-5 h-5 shrink-0 rounded flex items-center justify-center transition-all border ${
            isOverridden
              ? "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
              : activeMode === 'light'
                ? "bg-gray-100 text-purple-400 border-gray-200 hover:text-purple-600 hover:border-purple-300"
                : "bg-[#1a1a2e] text-purple-500/40 border-[#2d2d4d] hover:text-purple-400"
          }`}
          title={isOverridden ? "RESET_TOKEN" : "AUTO_INHERIT"}
        >
          <span className="text-[10px] font-bold">{isOverridden ? "×" : "·"}</span>
        </button>
        {isFailing && (
          <button
            onClick={() => {
              const fixed = getClosestPassingColor(background, currentColor, isNonText, isBorder, isWeak, isStrong);
              handleManualOverride(property, fixed);
            }}
            className={`text-[7px] font-black px-1 py-0.5 rounded-[2px] transition-all ${
              activeMode === 'light'
                ? 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/40'
            }`}
            title={`FIX_CONTRAST (Current: ${contrast.ratio.toFixed(2)}:1)`}
          >
            FIX
          </button>
        )}
      </div>

      <div className="flex flex-col min-w-[120px] flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-mono transition-colors truncate uppercase tracking-tighter ${activeMode === 'light' ? 'text-gray-500 group-hover:text-purple-700' : 'text-gray-400 group-hover:text-purple-200'}`} title={property}>
            {formatAgentLabel(property)}
          </span>
          <div className="flex items-center gap-1 opacity-60 text-[6px] font-mono">
            {isNonText && <span className="bg-blue-500/10 text-blue-400 px-0.5 rounded">NT</span>}
            {isBorder && <span className="bg-cyan-500/10 text-cyan-400 px-0.5 rounded">BD</span>}
            {isWeak && <span className="bg-yellow-500/10 text-yellow-400 px-0.5 rounded">WK</span>}
            {isStrong && <span className="bg-orange-500/10 text-orange-400 px-0.5 rounded">ST</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div 
            className={`w-3 h-3 rounded-[2px] border shrink-0 cursor-pointer hover:scale-110 transition-transform ${activeMode === 'light' ? 'border-gray-200' : 'border-white/10'}`}
            style={{ backgroundColor: currentColor }}
            onClick={(e) => setQuickPicker({ x: e.clientX, y: e.clientY, key: property, label: property })}
            title="QUICK_PICKER"
          />
          <span className={`text-[8px] font-mono transition-colors uppercase ${activeMode === 'light' ? 'text-gray-400 group-hover:text-gray-600' : 'text-gray-600 group-hover:text-gray-500'}`}>{currentColor}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 max-w-none justify-end overflow-x-auto custom-scrollbar">
        {Object.entries(activeVariantsMap).map(([seedName, variants]: [string, any]) => (
          <div key={`${property}-${seedName}`} className={`flex gap-0.5 p-0.5 rounded border ${activeMode === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-purple-500/5 border-purple-500/10'}`}>
            {variants.map((variant: any, idx: number) => {
              const isSelected = currentColor?.toLowerCase() === variant.hex.toLowerCase()

              return (
                <button
                  key={`${property}-${seedName}-${idx}`}
                  onClick={() => handleManualOverride(property, variant.hex)}
                  className={`w-1.5 h-2.5 rounded-[0.5px] transition-all relative flex items-center justify-center ${
                    isSelected 
                      ? `ring-1 ring-purple-400 ring-offset-1 ${activeMode === 'light' ? 'ring-offset-white' : 'ring-offset-[#0d0d17]'} z-10 scale-110` 
                      : "hover:scale-110 opacity-40 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: variant.hex }}
                  title={`${seedName}_V${idx}: ${variant.hex}`}
                >
                  {isSelected && (
                    <div 
                      className="w-0.5 h-0.5 rounded-full bg-white/60" 
                    />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
})


  // Handlers for Matrix Router
  const handleSeedOverride = useCallback((seedName: string, hex: string) => {
    console.log(`🌱 Seed Override: Setting ${seedName} to ${hex} for ${activeMode} mode`)
    setSeedOverrides(prev => ({
      ...prev,
      [activeMode]: {
        ...(prev[activeMode] || {}),
        [seedName]: hex
      }
    }))
  }, [activeMode])

  const handleSeedReset = useCallback((seedName: string) => {
    console.log(`♻️ Seed Reset: Clearing override for ${seedName} in ${activeMode} mode`)
    setSeedOverrides(prev => {
      const updated = { ...prev, [activeMode]: { ...(prev[activeMode] || {}) } }
      delete updated[activeMode][seedName]
      return updated
    })
  }, [activeMode])

  const handleManualOverride = useCallback((property: string, hex: string) => {
    console.log(`🎨 Manual Override: Setting ${property} to ${hex} for ${activeMode} mode`)
    setManualOverrides(prev => ({
      ...prev,
      [activeMode]: {
        ...(prev[activeMode] || {}),
        [property]: hex
      }
    }))
    setActivePreset(null)
  }, [activeMode])

  const handleManualReset = useCallback((property: string) => {
    console.log(`♻️ Manual Reset: Clearing override for ${property} in ${activeMode} mode`)
    setManualOverrides(prev => {
      const updated = { ...prev, [activeMode]: { ...(prev[activeMode] || {}) } }
      delete updated[activeMode][property]
      return updated
    })
    setActivePreset(null)
  }, [activeMode])

  const handleClearAll = useCallback(() => {
    setActivePreset(null)
    setManualOverrides({ light: {}, dark: {} })
    setSeedOverrides({ light: {}, dark: {} })
  }, [])

  // Reverse-engineer parameters from current seed values
  const handleAnalyzeSeeds = useCallback(async () => {
    const currentSeeds = seeds9;
    
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
      const baseSeed = currentSeeds.find(s => s.name === "seed-base");
      const strongSeed = currentSeeds.find(s => s.name === "seed-strong");
      if (baseSeed && strongSeed) {
        const lDiff = Math.abs(baseSeed.hsl.l - strongSeed.hsl.l);
        const guessedContrast = Math.min(100, Math.max(0, lDiff * 2.5));
        if (activeMode === "light") setLightContrast(Math.round(guessedContrast));
        else setDarkContrast(Math.round(guessedContrast));
      }

      // 4. Analyze HARMONY and SPREAD
      const baseHue = currentSeeds.find(s => s.name === "primary")?.hsl.h || 0;
      setBaseColor(prev => ({ ...prev, h: baseHue }));

      let bestHarmony = harmony;
      let bestSpread = spread;
      let minTotalError = Infinity;

      const harmonyRules = Object.values(HarmonyRule);
      
      // We want to penalize ANALOGOUS if it's not a significantly better fit
      // because it's a "catch-all" that often wins by accident in low-weighting scenarios.
      
      for (const hRule of harmonyRules) {
        // Step of 1 for high precision in spread matching
        for (let sVal = 0; sVal <= 180; sVal += 1) {
          const testSeeds = generateOpencodeSeeds({ h: baseHue, s: avgS, l: avgL }, hRule, sVal, 50);
          
          let ruleHueError = 0;
          let matchCount = 0;

          // Compare all seeds that exist in both sets
          currentSeeds.forEach(target => {
            const match = testSeeds.find(ts => ts.name === target.name);
            if (match) {
              const hueDiff = Math.min(Math.abs(match.hsl.h - target.hsl.h), 360 - Math.abs(match.hsl.h - target.hsl.h));
              const satDiff = Math.abs(match.hsl.s - target.hsl.s);
              const lumDiff = Math.abs(match.hsl.l - target.hsl.l);
              
              // CRITICAL WEIGHTING:
              // Hue error is the primary identifier of a harmony rule.
              // We use a non-linear penalty for hue differences to favor exact matches.
              const hueWeight = hueDiff < 5 ? 1 : hueDiff < 15 ? 5 : 15;
              
              ruleHueError += (hueDiff * hueWeight) + (satDiff * 0.2) + (lumDiff * 0.2);
              matchCount++;
            }
          });

          const avgError = matchCount > 0 ? ruleHueError / matchCount : 999;
          
          // COMPLEXITY & BIAS PENALTIES:
          // 1. Analogous is the most common "accidental" winner, so we give it a slight penalty
          // to ensure other rules win if they are close.
          let ruleBias = 0;
          if (hRule === HarmonyRule.ANALOGOUS) ruleBias = 10;
          if (hRule === HarmonyRule.MONOCHROMATIC || hRule === HarmonyRule.SHADES) ruleBias = 5;
          
          // 2. Favor specific rules like Complementary or Triadic if they match well
          if (hRule === HarmonyRule.COMPLEMENTARY || hRule === HarmonyRule.TRIADIC || hRule === HarmonyRule.SQUARE) {
            ruleBias = -2; // Slight bonus for distinct harmonies
          }

          const finalError = avgError + ruleBias;

          if (finalError < minTotalError) {
            minTotalError = finalError;
            bestHarmony = hRule;
            bestSpread = sVal;
          }
        }
      }

      setHarmony(bestHarmony);
      setSpread(bestSpread);
      setVariantCount(12);

      // 5. Guess STRATEGY_MAP
      // Actually try to match the variants for the primary seed
      let finalStrategy = variantStrategy;
      const primarySeed = currentSeeds.find(s => s.name === "primary");
      if (primarySeed) {
        const strategies = Object.values(VariantStrategy);
        let minVarError = Infinity;

        strategies.forEach(strat => {
          const testVars = generateVariants(primarySeed.hsl, 12, (activeMode === "light" ? lightContrast : darkContrast), strat, colorSpace, outputSpace, 50);
          const currentVars = activeVariantsMap["primary"] || [];
          
          let varError = 0;
          for (let i = 0; i < Math.min(testVars.length, currentVars.length); i++) {
            varError += Math.abs(testVars[i].hsl.l - currentVars[i].hsl.l);
          }
          
          if (varError < minVarError) {
            minVarError = varError;
            finalStrategy = strat;
          }
        });
        setVariantStrategy(finalStrategy);
      }
      
      console.log(`[Analysis] Result: Harmony=${bestHarmony}, Spread=${bestSpread}, Strategy=${finalStrategy}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [seeds9, seedOverrides, activeMode, harmony, spread, variantStrategy, lightContrast, darkContrast, activeVariantsMap, colorSpace, outputSpace]);

  // Load theme from /api/read-theme if it exists
  useEffect(() => {
    const loadCustomTheme = async () => {
      try {
        const response = await fetch("/api/read-theme");
        if (response.ok) {
          const themeData = await response.json();
          console.log("🎨 Loaded theme from /api/read-theme:", themeData);
          
          // Store the content string to prevent immediate re-sync
          const contentString = JSON.stringify(themeData, null, 2);
          lastWrittenRef.current = contentString;
          localStorage.setItem("lastSyncedContent", contentString);

          // Update states
          if (themeData.light?.seeds || themeData.dark?.seeds) {
            setSeedOverrides({
              light: themeData.light?.seeds || {},
              dark: themeData.dark?.seeds || {}
            });
          }
          
          if (themeData.light?.overrides || themeData.dark?.overrides) {
            setManualOverrides({
              light: themeData.light?.overrides || {},
              dark: themeData.dark?.overrides || {}
            });
          }
          
          if (themeData.name) {
            setThemeName(themeData.name);
          }

          // Force analysis to run AFTER state updates are processed
          setTimeout(() => {
            console.log("🔍 Triggering post-load analysis...");
            handleAnalyzeSeeds();
          }, 300);
        }
      } catch (err) {
        console.warn("⚠️ Could not load theme from API:", err);
      }
    };
    
    loadCustomTheme();
  }, []); // Run ONCE on mount

  const handleResetMode = useCallback(() => {
    setActivePreset(null)
    setManualOverrides(prev => {
      const updated = { ...prev, [activeMode]: {} }
      console.log(`🧹 RESET_MODE (${activeMode}): Manual overrides cleared`)
      return updated
    })
    setSeedOverrides(prev => {
      const updated = { ...prev, [activeMode]: {} }
      console.log(`🧹 RESET_MODE (${activeMode}): Seed overrides cleared`)
      return updated
    })
  }, [activeMode])

  // Write to Opencode when manualOverrides, seeds, colors, or strategy change
  const lastWrittenRef = React.useRef<string>(localStorage.getItem("lastSyncedContent") || "")
  const isWritingRef = React.useRef<boolean>(false)

  React.useEffect(() => {
    // "Instant" feel: 200ms debounce
    const timer = setTimeout(() => {
      if (isWritingRef.current || !useOpencodeMode) return

      const currentContent = exportToOpencode9SeedJSON(
        themeName, 
        lightThemeColors,
        darkThemeColors,
        lightSeeds9, 
        darkSeeds9,
        manualOverrides
      )
      
      // CRITICAL: If content is same as what we know is on disk, STOP.
      if (currentContent === lastWrittenRef.current) {
        return
      }

      setWriteStatus("writing")
      isWritingRef.current = true
      
      writeOpencode9ThemeFile(
        themeName, 
        lightThemeColors,
        darkThemeColors,
        lightSeeds9, 
        darkSeeds9,
        manualOverrides
      )
        .then((res) => {
          if (res.success) {
            lastWrittenRef.current = currentContent
            localStorage.setItem("lastSyncedContent", currentContent)
            setWriteStatus("success")
            setWriteError(null)
          } else {
            setWriteStatus("error")
            setWriteError(res.error || "Unknown error")
          }
          setTimeout(() => setWriteStatus("idle"), 2000)
        })
        .catch((err) => {
          setWriteStatus("error")
          setWriteError(err.message || "Network error")
          setTimeout(() => setWriteStatus("idle"), 2000)
        })
        .finally(() => {
          isWritingRef.current = false
        })
    }, 200)

    return () => clearTimeout(timer)
  }, [themeName, lightThemeColors, darkThemeColors, lightSeeds9, darkSeeds9, manualOverrides, useOpencodeMode])

  const handleColorChange = useCallback((hsl: HSL) => {
    setBaseColor(hsl)
    setSaturation(Math.round(hsl.s))
  }, [])

  const handleCopy = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex)
  }, [])

  const applyOpencodePreset = useCallback((presetId: string) => {
    const overrides = getPresetOverrides(presetId)
    const preset = opencodePresets[presetId]
    
    setManualOverrides(prev => ({
      ...prev,
      [activeMode]: overrides
    }))
    
    if (preset?.baseColor) setBaseColor(preset.baseColor)
    if (preset?.harmony) setHarmony(preset.harmony)
    if (preset?.variantStrategy) setVariantStrategy(preset.variantStrategy)
    
    setActivePreset(presetId)
  }, [activeMode])

  const handleExport = useCallback(
    (format: string) => {
      const formats: Record<string, (t: DesktopTheme) => string> = {
        css: exportToCSS,
        json: exportToJSON,
        tailwind: exportToTailwind,
        scss: exportToSCSS,
      }

      if (format === "opencode9") {
        const content = exportToOpencode9SeedJSON(themeName, lightThemeColors, darkThemeColors, lightSeeds9, darkSeeds9, manualOverrides)
        const formatInfo = exportFormats.find((f: any) => f.id === format)
        downloadFile(
          content,
          `${themeName.toLowerCase().replace(/\s+/g, "-")}${formatInfo?.ext || ".json"}`,
          formatInfo?.mime || "application/json",
        )
        return
      }

      const exporter = formats[format]
      if (!exporter) return

      const content = exporter(theme)
      const formatInfo = exportFormats.find((f: any) => f.id === format)
      downloadFile(
        content,
        `${themeName.toLowerCase().replace(/\s+/g, "-")}${formatInfo?.ext || ".css"}`,
        formatInfo?.mime || "text/plain",
      )
    },
    [theme, themeName, lightThemeColors, darkThemeColors, seeds9, manualOverrides],
  )

  const handleQuickOverride = useCallback((key: string, hex: string) => {
    console.log(`🎯 Quick Override: Setting ${key} to ${hex} for ${activeMode} mode`)
    setManualOverrides(prev => ({
      ...prev,
      [activeMode]: {
        ...(prev[activeMode] || {}),
        [key]: hex
      }
    }))
    setQuickPicker(null)
  }, [activeMode])

  const randomizeAll = useCallback(() => {
    const h = Math.floor(Math.random() * 360)
    const s = 40 + Math.floor(Math.random() * 60)
    const l = 40 + Math.floor(Math.random() * 30)
    
    setBaseColor({ h, s, l })
    setSaturation(s)
    
    const randomHarmony = harmonyOptions[Math.floor(Math.random() * harmonyOptions.length)].value
    const randomStrategy = variantStrategyOptions[Math.floor(Math.random() * variantStrategyOptions.length)].value
    
    setHarmony(randomHarmony)
    setVariantStrategy(randomStrategy)
    setVariantCount(1 + Math.floor(Math.random() * 12))
    setSpread(15 + Math.floor(Math.random() * 45))
    setLightContrast(20 + Math.floor(Math.random() * 70))
    setDarkContrast(20 + Math.floor(Math.random() * 70))
    setLightBrightness(30 + Math.floor(Math.random() * 40))
    setDarkBrightness(30 + Math.floor(Math.random() * 40))
  }, [])

  const invertBase = useCallback(() => {
    setBaseColor((prev) => {
      const newColor = {
        h: (prev.h + 180) % 360,
        s: prev.s,
        l: 100 - prev.l,
      }
      setSaturation(Math.round(newColor.s))
      return newColor
    })
  }, [])

  const chaosMode = useCallback(() => {
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
  }, [])

  const applyThemePreset = useCallback((presetName: keyof typeof thematicPresets) => {
    const preset = thematicPresets[presetName]
    const h = Math.round(preset.h[0] + Math.random() * (preset.h[1] - preset.h[0]))
    const s = Math.round(preset.s[0] + Math.random() * (preset.s[1] - preset.s[0]))
    const l = Math.round(preset.l[0] + Math.random() * (preset.l[1] - preset.l[0]))
    
    setBaseColor({ h, s, l })
    setSaturation(s)
    setHarmony(preset.harmony)
    setVariantStrategy(preset.strategy)
  }, [])

  // Pre-calculate contrast scores for deferredWcagPairs
  const scoredWcagPairs = useMemo(() => {
    return deferredWcagPairs.map(pair => {
      const isNonText = pair.isNonText || false;
      const isBorder = pair.isBorder || false;
      const isWeak = pair.isWeak || false;
      const isStrong = pair.isStrong || false;

      return {
        ...pair,
        score: getContrastScore(pair.bg, pair.fg, isNonText, isBorder, isWeak, isStrong),
        isNonText,
        isBorder,
        isWeak,
        isStrong
      }
    })
  }, [deferredWcagPairs]);

  const passCount = useMemo(() => {
    return scoredWcagPairs.filter(p => p.score.pass).length;
  }, [scoredWcagPairs]);

  const failCount = useMemo(() => {
    return scoredWcagPairs.filter(p => !p.score.pass).length;
  }, [scoredWcagPairs]);

  return (
    <div className={`min-h-screen transition-colors ${activeMode === 'light' ? 'bg-gray-100' : ''}`} style={{ backgroundColor: activeMode === 'light' ? undefined : "#0d0d17" }}>
      {/* Calculating Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`p-8 rounded-lg border shadow-2xl flex flex-col items-center gap-4 transition-colors ${activeMode === 'light' ? 'bg-white border-purple-200' : 'bg-[#1a1a2e] border-purple-500/30'}`}>
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="flex flex-col items-center">
              <h2 className={`text-sm font-black uppercase tracking-[0.3em] ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-100'}`}>
                ANALYZING_SEEDS
              </h2>
              <p className={`text-[10px] font-mono mt-1 animate-pulse ${activeMode === 'light' ? 'text-purple-600/60' : 'text-purple-400/60'}`}>
                REVERSE_ENGINEERING_PARAMETERS...
              </p>
            </div>
          </div>
        </div>
      )}

      <header className={`px-6 py-2 border-b flex items-center justify-between sticky top-0 z-50 backdrop-blur-md transition-colors ${activeMode === 'light' ? 'bg-white/80 border-gray-200' : 'bg-[#1a1a2e]/80 border-[#2d2d4d]'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-9 h-9 rounded flex items-center justify-center border transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] ${activeMode === 'light' ? 'bg-gray-100 border-purple-200' : 'bg-[#2d2d4d] border-purple-500/30'}`}>
            <span className={`font-black text-xl font-mono ${activeMode === 'light' ? 'text-purple-600' : 'text-purple-400'}`}>9</span>
          </div>
          <div>
            <h1 className={`text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-100'}`}>
              OPENCODE_GEN <span className={`text-[10px] font-mono font-normal tracking-normal ${activeMode === 'light' ? 'text-purple-500/60' : 'text-purple-500/60'}`}>v2.1.0</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <p className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-700/60' : 'text-purple-400/60'}`}>
                SYSTEM_STATUS: OPERATIONAL
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
            <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-500/60' : 'text-purple-500/50'}`}>Project:</span>
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              className={`bg-transparent border-none outline-none text-[10px] font-mono w-32 focus:ring-0 transition-colors ${activeMode === 'light' ? 'text-purple-900 placeholder-purple-300' : 'text-purple-300 placeholder-purple-900'}`}
              placeholder="THEME_ID"
            />
          </div>
          <div className={`flex p-1 border rounded-md transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
            <button
              onClick={() => setActiveTab("palette")}
              className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded ${
                activeTab === "palette" 
                  ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                  : activeMode === 'light' ? "text-purple-500/60 hover:text-purple-600" : "text-purple-500/60 hover:text-purple-400"
              }`}
            >
              MATRIX_ROUTER
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded ${
                activeTab === "export" 
                  ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                  : activeMode === 'light' ? "text-purple-500/60 hover:text-purple-600" : "text-purple-500/60 hover:text-purple-400"
              }`}
            >
              EXPORT_ENGINE
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            {/* Color Wheel - TERMINAL STYLE */}
            <div className={`rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
              <div className={`px-3 py-1.5 border-b flex items-center justify-between transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-600' : 'text-purple-400/80'}`}>
                  # HARMONY_ENGINE_VISUALIZER
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full animate-pulse ${activeMode === 'light' ? 'bg-purple-400' : 'bg-purple-500/50'}`}></div>
                  <span className={`text-[8px] font-mono uppercase transition-colors ${activeMode === 'light' ? 'text-purple-400' : 'text-purple-500/40'}`}>Live_Input</span>
                </div>
              </div>
              <div className="p-1">
                <ColorWheel hsl={baseColor} paletteGroups={paletteGroups} onChange={handleColorChange} />
              </div>
            </div>

            {/* Matrix Router */}
            <div className={`rounded-lg border overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
              <div className={`px-3 py-1.5 border-b flex items-center justify-between transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-600' : 'text-purple-400/80'}`}>
                    # MATRIX_ROUTER
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => initializeSeeds(true)}
                    className={`text-[9px] font-black px-3 py-1 rounded transition-all uppercase tracking-widest border ${
                      activeMode === 'light'
                        ? "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                        : "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                    }`}
                    title="Regenerate seed colors based on current harmony and base color"
                  >
                    REGENERATE_SEEDS
                  </button>
                  <button
                    onClick={handleAnalyzeSeeds}
                    disabled={isAnalyzing}
                    className={`text-[9px] font-black px-3 py-1 rounded transition-all uppercase tracking-widest border relative ${
                      isAnalyzing
                        ? "bg-purple-600 text-white border-purple-400 animate-pulse cursor-wait"
                        : activeMode === 'light'
                          ? "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100"
                          : "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20"
                    }`}
                    title="Analyze current seed values to reverse-engineer harmony and strategy parameters"
                  >
                    {isAnalyzing ? "CALCULATING..." : "ANALYZE_SEEDS"}
                  </button>
                  <button
                    onClick={() => setMatrixMode(!matrixMode)}
                    className={`text-[9px] font-black px-3 py-1 rounded transition-all uppercase tracking-widest border ${
                      matrixMode 
                        ? "bg-purple-500/20 text-purple-600 border-purple-500/40" 
                        : activeMode === 'light'
                          ? "bg-gray-100 text-gray-400 border-gray-200 hover:border-purple-300"
                          : "bg-black/40 text-purple-900 border-purple-900/20 hover:border-purple-800"
                    }`}
                  >
                    {matrixMode ? "DISCONNECT" : "INITIALIZE"}
                  </button>
                </div>
              </div>

              {matrixMode && (
                <div className="p-4">
                  {/* Override count and status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-tight transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/40'}`}>
                        {Object.keys(manualOverrides[activeMode] || {}).length + Object.keys(seedOverrides[activeMode] || {}).length} OVERRIDE(S)_ACTIVE
                      </span>
                      {writeStatus === "writing" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-mono animate-pulse">
                          WRITING...
                        </span>
                      )}
                      {writeStatus === "success" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">
                          ✓ SYNC_SUCCESS
                        </span>
                      )}
                      {writeStatus === "error" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono" title={writeError || "Unknown error"}>
                          ⚠ SYNC_FAILED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetMode}
                        disabled={
                          Object.keys(manualOverrides[activeMode] || {}).length === 0 && 
                          Object.keys(seedOverrides[activeMode] || {}).length === 0
                        }
                        className={`text-[10px] px-3 py-1 font-mono font-bold uppercase tracking-tighter border transition-all disabled:opacity-20 ${
                          activeMode === 'light'
                            ? "border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100"
                            : "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                        }`}
                        title={`Reset only ${activeMode} overrides`}
                      >
                        RESET_{activeMode.toUpperCase()}
                      </button>
                      <button
                        onClick={handleClearAll}
                        disabled={
                          Object.keys(manualOverrides.light).length === 0 && 
                          Object.keys(manualOverrides.dark).length === 0 && 
                          Object.keys(seedOverrides.light).length === 0 && 
                          Object.keys(seedOverrides.dark).length === 0
                        }
                        className={`text-[10px] px-3 py-1 font-mono font-bold uppercase tracking-tighter border transition-all disabled:opacity-20 ${
                          activeMode === 'light'
                            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                            : "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        }`}
                        title="Clear all overrides for BOTH modes"
                      >
                        PURGE_ALL
                      </button>
                    </div>
                  </div>

                  {/* WCAG Compliance Summary - AGENT LOG STYLE */}
                  <div className={`mb-4 rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
                    <div className={`flex items-center justify-between px-3 py-2 border-b transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-300'}`}>
                          AGENT_AUDIT_LOG
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono transition-colors ${activeMode === 'light' ? 'text-green-600/70' : 'text-green-400/70'}`}>PASS:</span>
                          <span className={`text-[10px] font-mono font-bold transition-colors ${activeMode === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                            {passCount}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono transition-colors ${activeMode === 'light' ? 'text-red-600/70' : 'text-red-400/70'}`}>FAIL:</span>
                          <span className={`text-[10px] font-mono font-bold transition-colors ${activeMode === 'light' ? 'text-red-600' : 'text-red-400'}`}>
                            {failCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`max-h-[500px] overflow-y-auto custom-scrollbar transition-colors ${activeMode === 'light' ? 'bg-white' : 'bg-[#0d0d17]'}`}>
                      <div className="flex flex-col">
                        {Array.from(new Set(scoredWcagPairs.map(p => p.category))).map(category => (
                          <div key={category} className={`border-b last:border-b-0 transition-colors ${activeMode === 'light' ? 'border-gray-100' : 'border-[#1a1a2e]'}`}>
                            <div className={`px-3 py-1.5 flex items-center justify-between sticky top-0 z-10 transition-colors ${activeMode === 'light' ? 'bg-gray-50/95 border-b border-gray-100' : 'bg-[#161625] border-b border-[#1a1a2e]'}`}>
                              <h3 className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                                <span className="opacity-40">#</span> {category}
                              </h3>
                              <span className={`text-[8px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-600/50' : 'text-purple-500/50'}`}>
                                {scoredWcagPairs.filter(p => p.category === category).length} ENTRIES
                              </span>
                            </div>
                            
                            <div className={`divide-y transition-colors ${activeMode === 'light' ? 'divide-gray-50' : 'divide-[#1a1a2e]'}`}>
                              {scoredWcagPairs.filter(p => p.category === category).map(pair => {
                                const score = pair.score
                                const isFailing = !score.pass
                                const thresholdLabel = getThresholdLabel(pair.isNonText, pair.isBorder, pair.category);
                                
                                // Map type to icon
                                let typeIcon = "📄" // read
                                if (pair.type === 'shell') typeIcon = "🐚"
                                if (pair.type === 'action') typeIcon = "⚡"
                                if (pair.type === 'diff') typeIcon = "🔍"

                                return (
                                  <div 
                                    key={`${pair.category}-${pair.type}-${pair.label}-${pair.bgKey}-${pair.fgKey}`} 
                                    className={`group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-purple-500/5 ${isFailing ? 'bg-red-500/5' : ''}`}
                                  >
                                    {/* Icon Column */}
                                    <div className={`w-5 h-5 shrink-0 flex items-center justify-center rounded text-[10px] border transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200 group-hover:border-purple-300' : 'bg-[#1a1a2e] border-[#2d2d4d] group-hover:border-purple-500/30'}`}>
                                      {typeIcon}
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline justify-between gap-2">
                                        <div className="flex flex-col min-w-0">
                                          <span className={`text-[10px] font-bold truncate transition-colors ${activeMode === 'light' ? 'text-gray-700 group-hover:text-purple-900' : 'text-gray-300 group-hover:text-purple-200'}`}>
                                            {pair.label}
                                          </span>
                                          <div className="flex items-center gap-1 opacity-60 text-[7px] font-mono">
                                            {pair.isNonText && <span className="bg-blue-500/10 text-blue-400 px-0.5 rounded">NON_TEXT</span>}
                                            {pair.isBorder && <span className="bg-cyan-500/10 text-cyan-400 px-0.5 rounded">BORDER</span>}
                                            {pair.isWeak && <span className="bg-yellow-500/10 text-yellow-400 px-0.5 rounded">WEAK</span>}
                                            {pair.isStrong && <span className="bg-orange-500/10 text-orange-400 px-0.5 rounded">STRONG</span>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <div className="flex flex-col items-end">
                                            <span className={`text-[10px] font-mono font-black transition-colors ${isFailing ? 'text-red-500' : (activeMode === 'light' ? 'text-green-600' : 'text-green-400')}`}>
                                              {score.ratio.toFixed(2)}:1
                                              <span className="ml-1 opacity-40 text-[8px]">({thresholdLabel})</span>
                                            </span>
                                            {score.hueDiff > 0 && (
                                              <span className={`text-[7px] font-mono leading-none mt-0.5 transition-colors ${score.hueDiff >= 15 ? (activeMode === 'light' ? 'text-blue-600' : 'text-blue-400') : 'opacity-40'}`}>
                                                H_DIFF: {score.hueDiff}°
                                              </span>
                                            )}
                                          </div>
                                          <span className={`text-[8px] font-black px-1 rounded-[2px] ${
                                            isFailing 
                                              ? 'bg-red-500/20 text-red-500 border border-red-500/30' 
                                              : activeMode === 'light' 
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                          }`}>
                                            {isFailing ? 'FAIL' : (score.level === 'AAA' ? 'AAA' : 'PASS')}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between mt-0.5">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                          <span className={`text-[8px] font-mono truncate transition-colors ${activeMode === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>{pair.fgKey} / {pair.bgKey}</span>
                                        </div>
                                          {isFailing && (
                                            <div className="grid grid-cols-2 gap-1 shrink-0">
                                              <button
                                                onClick={() => {
                                                  const fixed = getClosestPassingColor(pair.fg, pair.bg, pair.isNonText, pair.isBorder, pair.isWeak, pair.isStrong);
                                                  handleManualOverride(pair.bgKey, fixed);
                                                }}
                                                className={`text-[7px] font-black px-1 py-0.5 rounded-[2px] transition-all flex items-center gap-1 ${
                                                  activeMode === 'light'
                                                    ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40'
                                                }`}
                                                title={`FIX_BG_LUM: ${pair.bgKey}`}
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full border border-current" style={{ backgroundColor: pair.bg }} />
                                                L_BG
                                              </button>
                                              <button
                                                onClick={() => {
                                                  const fixed = getClosestPassingColor(pair.bg, pair.fg, pair.isNonText, pair.isBorder, pair.isWeak, pair.isStrong);
                                                  handleManualOverride(pair.fgKey, fixed);
                                                }}
                                                className={`text-[7px] font-black px-1 py-0.5 rounded-[2px] transition-all flex items-center gap-1 ${
                                                  activeMode === 'light'
                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200'
                                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/40'
                                                }`}
                                                title={`FIX_FG_LUM: ${pair.fgKey}`}
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full border border-current" style={{ backgroundColor: pair.fg }} />
                                                L_FG
                                              </button>
                                              
                                              {/* Hue Fix Buttons */}
                                              <button
                                                onClick={() => {
                                                  const fixed = getClosestHuePassingColor(pair.fg, pair.bg, pair.isNonText, pair.isBorder, pair.isWeak, pair.isStrong);
                                                  handleManualOverride(pair.bgKey, fixed);
                                                }}
                                                className={`text-[7px] font-black px-1 py-0.5 rounded-[2px] transition-all flex items-center gap-1 ${
                                                  activeMode === 'light'
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/40'
                                                }`}
                                                title={`FIX_BG_HUE: ${pair.bgKey}`}
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full border border-current" style={{ backgroundColor: pair.bg }} />
                                                H_BG
                                              </button>
                                              <button
                                                onClick={() => {
                                                  const fixed = getClosestHuePassingColor(pair.bg, pair.fg, pair.isNonText, pair.isBorder, pair.isWeak, pair.isStrong);
                                                  handleManualOverride(pair.fgKey, fixed);
                                                }}
                                                className={`text-[7px] font-black px-1 py-0.5 rounded-[2px] transition-all flex items-center gap-1 ${
                                                  activeMode === 'light'
                                                    ? 'bg-cyan-100 text-cyan-700 border border-cyan-200 hover:bg-cyan-200'
                                                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/40'
                                                }`}
                                                title={`FIX_FG_HUE: ${pair.fgKey}`}
                                              >
                                                <span className="w-1.5 h-1.5 rounded-full border border-current" style={{ backgroundColor: pair.fg }} />
                                                H_FG
                                              </button>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <button 
                                              className="w-2.5 h-2.5 rounded-full border border-white/10 hover:scale-125 transition-transform cursor-pointer shadow-sm" 
                                            style={{ backgroundColor: pair.bg }} 
                                            title={`BG: ${pair.bgKey}`}
                                            onClick={(e) => setQuickPicker({ x: e.clientX, y: e.clientY, key: pair.bgKey, label: pair.bgKey })}
                                          />
                                          <button 
                                            className="w-2.5 h-2.5 rounded-full border border-white/10 hover:scale-125 transition-transform cursor-pointer shadow-sm" 
                                            style={{ backgroundColor: pair.fg }} 
                                            title={`FG: ${pair.fgKey}`}
                                            onClick={(e) => setQuickPicker({ x: e.clientX, y: e.clientY, key: pair.fgKey, label: pair.fgKey })}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Full Palette Overview - TERMINAL STYLE */}
                  <div className={`mb-4 rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
                    <div className={`px-3 py-1.5 border-b flex items-center gap-2 transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                        # SEED_PALETTE_BUFFER
                      </span>
                    </div>
                    <div className={`p-3 transition-colors ${activeMode === 'light' ? 'bg-white' : 'bg-[#0d0d17]'}`}>
                      <div className="flex flex-col gap-2">
                        {Object.entries(activeVariantsMap).map(([seedName, variants]) => {
                          const isSeedOverridden = seedName in (seedOverrides[activeMode] || {});
                          return (
                            <div key={seedName} className="flex items-center gap-2 group">
                              <div className="flex items-center gap-1.5 w-24 shrink-0">
                                <button
                                  onClick={() => handleSeedReset(seedName)}
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all border ${
                                    isSeedOverridden
                                      ? "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
                                      : activeMode === 'light'
                                        ? "bg-gray-100 text-purple-400 border-gray-200 hover:text-purple-600 hover:border-purple-300"
                                        : "bg-[#1a1a2e] text-purple-500/40 border-[#2d2d4d] hover:text-purple-400"
                                  }`}
                                  title={isSeedOverridden ? "RESET_SEED_VECTOR" : "AUTO_GENERATED"}
                                >
                                  <span className="text-[8px] leading-none font-bold">{isSeedOverridden ? "×" : "·"}</span>
                                </button>
                                <span className={`text-[9px] font-mono transition-colors uppercase tracking-tighter truncate ${activeMode === 'light' ? 'text-gray-500 group-hover:text-purple-700' : 'text-gray-400 group-hover:text-purple-300'}`}>
                                  {formatAgentLabel(seedName)}
                                </span>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {variants.map((variant, vIdx) => {
                                  const isCurrentSeed = seeds9.find(s => s.name === seedName)?.hex.toLowerCase() === variant.hex.toLowerCase();
                                  return (
                                    <div
                                      key={`${seedName}-${vIdx}`}
                                      onClick={() => handleSeedOverride(seedName, variant.hex)}
                                      className={`w-5 h-5 shrink-0 rounded-sm border flex items-center justify-center transition-all hover:scale-110 cursor-pointer ${
                                        isCurrentSeed 
                                          ? `ring-1 ring-purple-500 ring-offset-1 ${activeMode === 'light' ? 'ring-offset-white' : 'ring-offset-[#0d0d17]'} z-10 scale-105 border-white/60` 
                                          : "opacity-80 hover:opacity-100 border-white/10"
                                      }`}
                                      style={{
                                        backgroundColor: variant.hex,
                                      }}
                                      title={`MOUNT_SEED: ${variant.hex} (v${vIdx})`}
                                    >
                                      {variant.isBase && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_3px_rgba(255,255,255,0.8)]" />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Matrix Grid - TERMINAL STYLE */}
                  <div className={`rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
                    <div className={`px-3 py-1.5 border-b flex items-center justify-between transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                        # SEMANTIC_TOKEN_MATRIX
                      </span>
                      <span className={`text-[8px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-600/50' : 'text-purple-500/50'}`}>
                        {MATRIX_PROPERTIES.reduce((acc, cat) => acc + cat.keys.length, 0)} TOKENS
                      </span>
                    </div>
                    <div className={`max-h-[600px] overflow-y-auto custom-scrollbar transition-colors divide-y ${activeMode === 'light' ? 'bg-white divide-gray-50' : 'bg-[#0d0d17] divide-[#1a1a2e]'}`}>
                      {MATRIX_PROPERTIES.map((category) => (
                        <div key={category.category} className="flex flex-col">
                          <div className={`px-3 py-1 text-[8px] font-black tracking-[0.2em] transition-colors ${activeMode === 'light' ? 'bg-gray-50 text-purple-900/40' : 'bg-purple-900/10 text-purple-500/40'}`}>
                            {category.category}
                          </div>
                          {category.keys.map((property) => {
                            const currentColor = themeColors[property as keyof OpencodeThemeColors]
                            const currentModeOverrides = manualOverrides[activeMode] || {}
                            const isOverridden = property in currentModeOverrides

                            return (
                              <MatrixTokenRow
                                key={property}
                                property={property}
                                currentColor={currentColor}
                                activeMode={activeMode}
                                isOverridden={isOverridden}
                                handleManualReset={handleManualReset}
                                handleManualOverride={handleManualOverride}
                                setQuickPicker={setQuickPicker}
                                formatAgentLabel={formatAgentLabel}
                                activeVariantsMap={activeVariantsMap}
                                themeColors={themeColors}
                              />
                            )
                          })}

                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Configuration - TERMINAL STYLE */}
            <div className={`rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
              <div className={`px-3 py-1.5 border-b flex items-center justify-between transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                  # ENGINE_CONFIG_PARAMETERS
                </span>
                <div className="flex items-center gap-1">
                  <div className={`w-1 h-1 rounded-full animate-pulse ${activeMode === 'light' ? 'bg-green-500' : 'bg-green-500/50'}`}></div>
                  <span className={`text-[8px] font-mono uppercase transition-colors ${activeMode === 'light' ? 'text-green-600' : 'text-green-500/50'}`}>Sync_On</span>
                </div>
              </div>
              <div className="p-4 space-y-6">
                <div className={`flex items-center justify-between p-3 rounded border transition-colors ${activeMode === 'light' ? 'bg-purple-50 border-purple-100' : 'bg-purple-500/5 border-purple-500/10'}`}>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-300'}`}>OPENCODE_9SEED_SYSTEM</span>
                    <span className={`text-[8px] font-mono uppercase mt-0.5 transition-colors ${activeMode === 'light' ? 'text-purple-600/60' : 'text-purple-500/60'}`}>Functional Seed Architecture</span>
                  </div>
                  <button
                    onClick={() => setUseOpencodeMode(!useOpencodeMode)}
                    className={`w-10 h-5 rounded-full transition-all relative border ${useOpencodeMode ? 'bg-purple-600 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : activeMode === 'light' ? 'bg-gray-200 border-gray-300' : 'bg-black/40 border-purple-900/40'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${useOpencodeMode ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`text-[8px] font-black uppercase tracking-[0.2em] ml-1 transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>VECTOR_SPACE</label>
                    <select
                      value={colorSpace}
                      onChange={(e) => setColorSpace(e.target.value as ColorSpace)}
                      className={`w-full border text-[10px] font-mono px-3 py-2 rounded focus:ring-0 outline-none appearance-none cursor-pointer transition-colors ${
                        activeMode === 'light' 
                          ? 'bg-gray-50 border-gray-200 text-purple-900 focus:border-purple-400 hover:bg-gray-100' 
                          : 'bg-black/40 border-[#2d2d4d] text-purple-200 focus:border-purple-500/50 hover:bg-black/60'
                      }`}
                    >
                      {['HSL', 'CAM02', 'HSLuv', 'LCh D50', 'LCh D65', 'OkLCh', 'IPT', 'LCh(uv)'].map((opt) => (
                        <option key={opt} value={opt} className={activeMode === 'light' ? 'bg-white' : 'bg-[#0d0d17]'}>
                          {opt.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[8px] font-black uppercase tracking-[0.2em] ml-1 transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>OUTPUT_FORMAT</label>
                    <select
                      value={outputSpace}
                      onChange={(e) => setOutputSpace(e.target.value as OutputSpace)}
                      className={`w-full border text-[10px] font-mono px-3 py-2 rounded focus:ring-0 outline-none appearance-none cursor-pointer transition-colors ${
                        activeMode === 'light' 
                          ? 'bg-gray-50 border-gray-200 text-purple-900 focus:border-purple-400 hover:bg-gray-100' 
                          : 'bg-black/40 border-[#2d2d4d] text-purple-200 focus:border-purple-500/50 hover:bg-black/60'
                      }`}
                    >
                      {['sRGB', 'P3', 'AdobeRGB', 'Rec.2020', 'HSL', 'HSV'].map((opt) => (
                        <option key={opt} value={opt} className={activeMode === 'light' ? 'bg-white' : 'bg-[#0d0d17]'}>
                          {opt.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`text-[8px] font-black uppercase tracking-[0.2em] ml-1 transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>HARMONY_LOGIC</label>
                    <select
                      value={harmony}
                      onChange={(e) => setHarmony(e.target.value as HarmonyRule)}
                      className={`w-full border text-[10px] font-mono px-3 py-2 rounded focus:ring-0 outline-none appearance-none cursor-pointer transition-colors ${
                        activeMode === 'light' 
                          ? 'bg-gray-50 border-gray-200 text-purple-900 focus:border-purple-400 hover:bg-gray-100' 
                          : 'bg-black/40 border-[#2d2d4d] text-purple-200 focus:border-purple-500/50 hover:bg-black/60'
                      }`}
                    >
                      {harmonyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className={activeMode === 'light' ? 'bg-white' : 'bg-[#0d0d17]'}>
                          {opt.label.toUpperCase().replace(/\s+/g, '_')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[8px] font-black uppercase tracking-[0.2em] ml-1 transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>STRATEGY_MAP</label>
                    <select
                      value={variantStrategy}
                      onChange={(e) => setVariantStrategy(e.target.value as VariantStrategy)}
                      className={`w-full border text-[10px] font-mono px-3 py-2 rounded focus:ring-0 outline-none appearance-none cursor-pointer transition-colors ${
                        activeMode === 'light' 
                          ? 'bg-gray-50 border-gray-200 text-purple-900 focus:border-purple-400 hover:bg-gray-100' 
                          : 'bg-black/40 border-[#2d2d4d] text-purple-200 focus:border-purple-500/50 hover:bg-black/60'
                      }`}
                    >
                      {variantStrategyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className={activeMode === 'light' ? 'bg-white' : 'bg-[#0d0d17]'}>
                          {opt.label.toUpperCase().replace(/\s+/g, '_')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`space-y-5 pt-2 border-t transition-colors ${activeMode === 'light' ? 'border-gray-100' : 'border-[#1a1a2e]'}`}>
                  <div className={`flex items-center gap-2 p-1 border rounded-md transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black/40 border-[#2d2d4d]'}`}>
                    <button
                      onClick={toggleMode}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                        activeMode === "dark" 
                        ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                        : "text-purple-900/40 hover:text-purple-600"
                      }`}
                    >
                      MODE_DARK
                    </button>
                    <button
                      onClick={toggleMode}
                      className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
                        activeMode === "light" 
                        ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                        : "text-purple-500/40 hover:text-purple-400"
                      }`}
                    >
                      MODE_LIGHT
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-[8px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>
                          {activeMode.toUpperCase()}_BRIGHTNESS
                        </label>
                        <span className={`text-[10px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>
                          {activeMode === "light" ? lightBrightness : darkBrightness}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeMode === "light" ? lightBrightness : darkBrightness}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          if (activeMode === "light") setLightBrightness(val)
                          else setDarkBrightness(val)
                        }}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-colors ${activeMode === 'light' ? 'bg-gray-200' : 'bg-[#1a1a2e]'}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-[8px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>
                          {activeMode.toUpperCase()}_CONTRAST
                        </label>
                        <span className={`text-[10px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>
                          {activeMode === "light" ? lightContrast : darkContrast}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={activeMode === "light" ? lightContrast : darkContrast}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          if (activeMode === "light") setLightContrast(val)
                          else setDarkContrast(val)
                        }}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-colors ${activeMode === 'light' ? 'bg-gray-200' : 'bg-[#1a1a2e]'}`}
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-[8px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>GLOBAL_SATURATION</label>
                        <span className={`text-[10px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>{saturation}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={saturation}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          setSaturation(val)
                          setBaseColor(prev => ({ ...prev, s: val }))
                        }}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-colors ${activeMode === 'light' ? 'bg-gray-200' : 'bg-[#1a1a2e]'}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-[8px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>SPREAD_VECTOR</label>
                        <span className={`text-[10px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>{spread}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="180"
                        value={spread}
                        onChange={(e) => setSpread(parseInt(e.target.value))}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-colors ${activeMode === 'light' ? 'bg-gray-200' : 'bg-[#1a1a2e]'}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`text-[8px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900/40' : 'text-purple-500/60'}`}>VARIANT_DEPTH</label>
                        <span className={`text-[10px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>{variantCount * 2 + 1} NODES</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={variantCount}
                        onChange={(e) => setVariantCount(parseInt(e.target.value))}
                        className={`w-full h-1 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-colors ${activeMode === 'light' ? 'bg-gray-200' : 'bg-[#1a1a2e]'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Randomizers - TERMINAL STYLE */}
            <div className={`rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
              <div className={`px-3 py-1.5 border-b flex items-center transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                  # ENTROPY_GENERATORS
                </span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={randomizeAll}
                    className={`px-2 py-2 border rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                      activeMode === 'light' 
                        ? 'bg-gray-50 border-gray-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300' 
                        : 'bg-black/40 border-[#2d2d4d] text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30'
                    }`}
                  >
                    RANDOM_ALL
                  </button>
                  <button
                    onClick={invertBase}
                    className={`px-2 py-2 border rounded text-[9px] font-black uppercase tracking-widest transition-all ${
                      activeMode === 'light' 
                        ? 'bg-gray-50 border-gray-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300' 
                        : 'bg-black/40 border-[#2d2d4d] text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30'
                    }`}
                  >
                    INVERT_VEC
                  </button>
                  <button
                    onClick={chaosMode}
                    className={`px-2 py-2 border rounded text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(168,85,247,0.1)] ${
                      activeMode === 'light' 
                        ? 'bg-purple-600 border-purple-400 text-white hover:bg-purple-700' 
                        : 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                    }`}
                  >
                    CHAOS_INIT
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {Object.keys(thematicPresets).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyThemePreset(preset as keyof typeof thematicPresets)}
                      className={`px-1 py-1.5 border rounded text-[8px] font-mono uppercase tracking-tighter transition-all ${
                        activeMode === 'light' 
                          ? 'bg-gray-50 border-gray-100 text-purple-900/40 hover:text-purple-600 hover:border-purple-200 hover:bg-gray-100' 
                          : 'bg-black/40 border-[#2d2d4d] text-purple-500/60 hover:text-purple-300 hover:border-purple-500/40 hover:bg-black/60'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {activeTab === "palette" ? (
              <>
                <ThemePreview theme={themeColors} />

                {/* Opencode Theme Presets - TERMINAL STYLE */}
                <div className={`rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
                  <div className={`px-3 py-1.5 border-b flex items-center justify-between transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                      # THEME_ENGINE_PRESETS
                    </span>
                    {activePreset && (
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-colors ${activeMode === 'light' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'}`}>
                        MOUNTED: {opencodePresets[activePreset as keyof typeof opencodePresets].name.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(opencodePresets).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyOpencodePreset(preset.id)}
                          className={`p-3 rounded border text-left transition-all group ${
                            activePreset === preset.id
                              ? activeMode === 'light' 
                                ? "bg-purple-600 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                                : "bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                              : activeMode === 'light'
                                ? "bg-gray-50 border-gray-100 hover:border-purple-300 hover:bg-purple-50"
                                : "bg-black/40 border-[#2d2d4d] hover:border-purple-500/40 hover:bg-purple-500/5"
                          }`}
                        >
                          <div className={`text-[10px] font-black uppercase tracking-wider transition-colors ${activePreset === preset.id ? (activeMode === 'light' ? 'text-white' : 'text-purple-100') : (activeMode === 'light' ? 'text-purple-900 group-hover:text-purple-700' : 'text-purple-300 group-hover:text-purple-200')}`}>
                            {preset.name}
                          </div>
                          <div className={`text-[9px] font-mono mt-1 uppercase tracking-tighter transition-colors ${activePreset === preset.id ? (activeMode === 'light' ? 'text-purple-100/80' : 'text-purple-500/60') : (activeMode === 'light' ? 'text-purple-500/60' : 'text-purple-500/60')}`}>
                            {preset.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 9-Seed Palette - TERMINAL STYLE */}
                <div className={`rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
                  <div className={`px-3 py-1.5 border-b flex items-center justify-between transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                      # RAW_VECTOR_DATA
                    </span>
                    <span className={`text-[8px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-600/50' : 'text-purple-500/50'}`}>9 SEEDS</span>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-6">
                      {seeds9.map((seed: SeedColor, idx: number) => {
                        const currentSeedVariants = activeMode === "light" ? seedVariantsLight : seedVariantsDark
                        const variants = currentSeedVariants[seed.name] || []
                        return (
                          <div key={idx} className={`space-y-3 p-3 rounded border transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-black/20 border-[#1a1a2e]'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded-[2px] border ${activeMode === 'light' ? 'border-gray-200 shadow-sm' : 'border-white/10'}`}
                                  style={{ backgroundColor: seed.hex }}
                                />
                                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-200'}`}>{formatAgentLabel(seed.name)}</span>
                              </div>
                              <span className={`text-[9px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-400' : 'text-purple-500/60'}`}>{seed.hex.toUpperCase()}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {variants.map((stop, vIdx) => (
                                <button
                                  key={vIdx}
                                  onClick={() => handleCopy(stop.hex)}
                                  className={`w-4 h-4 rounded-[1px] transition-all hover:scale-150 border z-0 hover:z-10 ${activeMode === 'light' ? 'border-gray-200 shadow-sm' : 'border-white/5 hover:border-white/20'}`}
                                  style={{ backgroundColor: stop.hex }}
                                  title={`COPY: ${stop.hex}`}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Theme Colors - TERMINAL STYLE */}
                <div className={`rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
                  <div className={`px-3 py-1.5 border-b flex items-center justify-between transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                      # COMPILED_TOKEN_VALUES
                    </span>
                    <span className={`text-[8px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-600/50' : 'text-purple-500/50'}`}>{Object.keys(themeColors).length} TOKENS</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {Object.entries(themeColors).map(([key, value]) => (
                      <div key={key} className={`flex items-center gap-3 p-2.5 rounded border transition-colors group ${activeMode === 'light' ? 'bg-gray-50 border-gray-100 hover:border-purple-300' : 'bg-black/40 border-[#1a1a2e] hover:border-purple-500/30'}`}>
                        <div
                          className={`w-10 h-10 rounded-[2px] border shrink-0 shadow-inner ${activeMode === 'light' ? 'border-gray-200' : 'border-white/10'}`}
                          style={{ backgroundColor: value as string }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-[10px] font-black uppercase tracking-tight truncate transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-100'}`}>{formatAgentLabel(key)}</div>
                          <div className={`text-[9px] font-mono mt-0.5 transition-colors ${activeMode === 'light' ? 'text-purple-600/60' : 'text-purple-500/60'}`}>{String(value).toUpperCase()}</div>
                        </div>
                        <button 
                          onClick={() => handleCopy(value as string)} 
                          className={`p-1.5 border rounded transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 text-purple-600 hover:text-purple-900 hover:border-purple-300' : 'bg-[#1a1a2e] border-[#2d2d4d] text-purple-400 hover:text-purple-200 hover:bg-purple-500/10'}`}
                          title="COPY_HEX"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className={`rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
                <div className={`px-3 py-1.5 border-b flex items-center justify-between transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                    # EXPORT_THEME_MANIFEST
                  </span>
                  <span className={`text-[8px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-600/50' : 'text-purple-500/50'}`}>{exportFormats.length} FORMATS</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {exportFormats.map((format: any) => (
                      <button
                        key={format.id}
                        onClick={() => handleExport(format.id)}
                        className={`p-4 border rounded group transition-all text-left ${
                          activeMode === 'light' 
                            ? 'bg-gray-50 border-gray-100 hover:border-purple-300 hover:bg-purple-50' 
                            : 'bg-black/40 border-[#2d2d4d] hover:border-purple-500/40 hover:bg-purple-500/5'
                        }`}
                      >
                        <div className={`text-[8px] font-mono mb-1 uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-purple-500/60 group-hover:text-purple-700' : 'text-purple-500/60 group-hover:text-purple-400'}`}>{format.ext}</div>
                        <div className={`text-[10px] font-black uppercase tracking-wider transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-100'}`}>{format.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Quick Color Picker Portal - TERMINAL STYLE */}
      {quickPicker && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-start"
          onClick={() => setQuickPicker(null)}
        >
          <div 
            className={`absolute rounded border shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-3 flex flex-col gap-2 min-w-[460px] transition-colors ${
              activeMode === 'light' 
                ? 'bg-white border-purple-200' 
                : 'bg-[#0d0d17] border-[#2d2d4d]'
            }`}
            style={{ 
              top: Math.min(window.innerHeight - 500, Math.max(10, quickPicker.y)), 
              left: Math.min(window.innerWidth - 480, Math.max(10, quickPicker.x + 10)),
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-2 border-b transition-colors ${activeMode === 'light' ? 'border-gray-100' : 'border-[#2d2d4d]'}`}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[300px] transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-100'}`}>
                  {formatAgentLabel(quickPicker.label)}
                </span>
              </div>
              <button 
                onClick={() => setQuickPicker(null)} 
                className={`transition-colors text-xs font-bold ${activeMode === 'light' ? 'text-purple-300 hover:text-purple-600' : 'text-purple-500/50 hover:text-purple-300'}`}
              >
                ×
              </button>
            </div>
            
            <div className={`text-[8px] uppercase tracking-[0.2em] font-black mt-1 transition-colors ${activeMode === 'light' ? 'text-purple-400' : 'text-purple-500/40'}`}># ENGINE_VARIANTS</div>
            
            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(activeVariantsMap).map(([seedName, variants]: [string, any]) => (
                <div key={seedName} className="flex flex-col gap-1">
                  <div className={`text-[7px] font-bold uppercase tracking-widest opacity-40 ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-100'}`}>
                    {seedName}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {variants.map((v: any, i: number) => {
                      const isSelected = (themeColors[quickPicker.key as keyof OpencodeThemeColors] || "").toLowerCase() === v.hex.toLowerCase()
                      
                      return (
                        <button
                          key={`${v.hex}-${i}`}
                          className={`w-3.5 h-3.5 rounded-[1px] transition-all border ${
                            isSelected 
                              ? `ring-1 ring-purple-400 ring-offset-1 ${activeMode === 'light' ? 'ring-offset-white' : 'ring-offset-[#0d0d17]'} z-10 scale-125 border-white/40` 
                              : "hover:scale-125 border-white/5 hover:border-white/40"
                          }`}
                          style={{ backgroundColor: v.hex }}
                          title={`${seedName} variant ${i} (${v.hex})`}
                          onClick={() => handleQuickOverride(quickPicker.key, v.hex)}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className={`text-[8px] uppercase tracking-[0.2em] font-black mt-2 transition-colors ${activeMode === 'light' ? 'text-purple-400' : 'text-purple-500/40'}`}># MANUAL_OVERRIDE</div>
            {(() => {
              const currentColor = (themeColors[quickPicker.key as keyof OpencodeThemeColors] || "").toLowerCase()
              const isVariantMatch = Object.values(activeVariantsMap).some((variants: any) => 
                variants.some((v: any) => v.hex.toLowerCase() === currentColor)
              )
              const isManualActive = !isVariantMatch

              return (
                <div className={`flex items-center gap-2 border rounded p-1.5 transition-all ${
                  isManualActive 
                    ? `ring-1 ring-purple-400 ring-offset-1 ${activeMode === 'light' ? 'ring-offset-white border-purple-200' : 'ring-offset-[#0d0d17] border-purple-500/40 bg-purple-500/5'}` 
                    : activeMode === 'light' ? 'bg-gray-50 border-purple-100' : 'bg-black/40 border-[#2d2d4d]'
                }`}>
                  <input 
                    type="color" 
                    className="w-8 h-6 cursor-pointer rounded-[1px] bg-transparent border-none"
                    onChange={(e) => handleQuickOverride(quickPicker.key, e.target.value)}
                    defaultValue={currentColor || "#000000"}
                  />
                  <span className={`text-[10px] font-mono uppercase transition-colors ${
                    isManualActive
                      ? 'text-purple-400 font-bold'
                      : activeMode === 'light' ? 'text-purple-700' : 'text-purple-300/60'
                  }`}>
                    {currentColor.toUpperCase()}
                  </span>
                </div>
              )
            })()}
            {/* Quick Reset for this property */}
            {manualOverrides[activeMode]?.[quickPicker.key] && (
              <button
                onClick={() => {
                  handleManualReset(quickPicker.key)
                  setQuickPicker(null)
                }}
                className={`mt-2 py-1.5 text-[8px] font-black uppercase tracking-widest border transition-all ${
                  activeMode === 'light'
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                }`}
              >
                RESET_PROPERTY
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
