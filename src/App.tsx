import React, { useState, useMemo, useCallback } from "react"
import ColorWheel from "./components/ColorWheel"
import ThemePreview from "./components/ThemePreview"
import { getContrastScore, getContrastRatio, getWCAGLevel, hexToHsl } from "./utils/colorUtils"
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
import { opencodePresets, getPresetOverrides } from "./utils/themePresets"
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
  ColorStop,
  SeedName
} from "./types"
import "./App.css"

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
  const [baseColor, setBaseColor] = useState<HSL>(() => getInitialState("baseColor", { h: 210, s: 50, l: 50 }))
  const [harmony, setHarmony] = useState<HarmonyRule>(() => getInitialState("harmony", HarmonyRule.ANALOGOUS))
  const [spread, setSpread] = useState(() => getInitialState("spread", 30))
  const [variantCount, setVariantCount] = useState(() => getInitialState("variantCount", 2))
  const [saturation, setSaturation] = useState(() => getInitialState("saturation", 50))
  const [lightBrightness, setLightBrightness] = useState(() => getInitialState("lightBrightness", 50))
  const [darkBrightness, setDarkBrightness] = useState(() => getInitialState("darkBrightness", 50))
  const [lightContrast, setLightContrast] = useState(() => getInitialState("lightContrast", 50))
  const [darkContrast, setDarkContrast] = useState(() => getInitialState("darkContrast", 50))
  const [activeMode, setActiveMode] = useState<"light" | "dark">("dark")
  const [variantStrategy, setVariantStrategy] = useState<VariantStrategy>(() => getInitialState("variantStrategy", VariantStrategy.TINTS_SHADES))
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

  // Persistence effects
  React.useEffect(() => localStorage.setItem("baseColor", JSON.stringify(baseColor)), [baseColor])
  React.useEffect(() => localStorage.setItem("harmony", JSON.stringify(harmony)), [harmony])
  React.useEffect(() => localStorage.setItem("spread", JSON.stringify(spread)), [spread])
  React.useEffect(() => localStorage.setItem("variantCount", JSON.stringify(variantCount)), [variantCount])
  React.useEffect(() => localStorage.setItem("saturation", JSON.stringify(saturation)), [saturation])
  React.useEffect(() => localStorage.setItem("lightBrightness", JSON.stringify(lightBrightness)), [lightBrightness])
  React.useEffect(() => localStorage.setItem("darkBrightness", JSON.stringify(darkBrightness)), [darkBrightness])
  React.useEffect(() => localStorage.setItem("lightContrast", JSON.stringify(lightContrast)), [lightContrast])
  React.useEffect(() => localStorage.setItem("darkContrast", JSON.stringify(darkContrast)), [darkContrast])
  React.useEffect(() => localStorage.setItem("variantStrategy", JSON.stringify(variantStrategy)), [variantStrategy])
  React.useEffect(() => localStorage.setItem("colorSpace", JSON.stringify(colorSpace)), [colorSpace])
  React.useEffect(() => localStorage.setItem("outputSpace", JSON.stringify(outputSpace)), [outputSpace])
  React.useEffect(() => localStorage.setItem("useOpencodeMode", JSON.stringify(useOpencodeMode)), [useOpencodeMode])
  React.useEffect(() => localStorage.setItem("themeName", JSON.stringify(themeName)), [themeName])
  React.useEffect(() => localStorage.setItem("matrixMode", JSON.stringify(matrixMode)), [matrixMode])
  React.useEffect(() => localStorage.setItem("manualOverrides", JSON.stringify(manualOverrides)), [manualOverrides])
  React.useEffect(() => localStorage.setItem("seedOverrides", JSON.stringify(seedOverrides)), [seedOverrides])

  // Holistic palette generation using the new modular engine
  const paletteGroups = useMemo(() => {
    return generateHarmony(
      baseColor, 
      harmony, 
      spread, 
      variantCount, 
      activeMode === "light" ? lightContrast : darkContrast, 
      activeMode === "light" ? lightBrightness : darkBrightness,
      variantStrategy,
      colorSpace,
      outputSpace
    )
  }, [baseColor, harmony, spread, variantCount, activeMode, lightContrast, darkContrast, lightBrightness, darkBrightness, variantStrategy, colorSpace, outputSpace])

  // Generate 9 seeds for Opencode mode (functional seeds) - Separate for Light/Dark
  const lightSeeds9 = useMemo<SeedColor[]>(() => {
    const baseSeeds = generateOpencodeSeeds(baseColor, harmony, spread, lightBrightness)
    return baseSeeds.map(seed => {
      const overrideHex = seedOverrides.light?.[seed.name]
      if (overrideHex) {
        return {
          ...seed,
          hex: overrideHex,
          hsl: hexToHsl(overrideHex)
        }
      }
      return seed
    })
  }, [baseColor, harmony, spread, lightBrightness, seedOverrides.light])

  const darkSeeds9 = useMemo<SeedColor[]>(() => {
    const baseSeeds = generateOpencodeSeeds(baseColor, harmony, spread, darkBrightness)
    return baseSeeds.map(seed => {
      const overrideHex = seedOverrides.dark?.[seed.name]
      if (overrideHex) {
        return {
          ...seed,
          hex: overrideHex,
          hsl: hexToHsl(overrideHex)
        }
      }
      return seed
    })
  }, [baseColor, harmony, spread, darkBrightness, seedOverrides.dark])

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
        variantCount,
        lightContrast,
        variantStrategy,
        colorSpace,
        outputSpace,
        50 // Always 50 because seed.hsl already has mode brightness baked in
      )
      variants[seed.name] = variantsForSeed
    })
    return variants
  }, [lightSeeds9, variantCount, lightContrast, variantStrategy, colorSpace, outputSpace])

  const seedVariantsDark = useMemo(() => {
    const variants: Record<string, ColorStop[]> = {}
    darkSeeds9.forEach((seed) => {
      const variantsForSeed = generateVariants(
        seed.hsl,
        variantCount,
        darkContrast,
        variantStrategy,
        colorSpace,
        outputSpace,
        50 // Always 50 because seed.hsl already has mode brightness baked in
      )
      variants[seed.name] = variantsForSeed
    })
    return variants
  }, [darkSeeds9, variantCount, darkContrast, variantStrategy, colorSpace, outputSpace])

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
    const currentOverrides = manualOverrides[activeMode] || {}
    
    // Apply manual overrides
    const hasOverrides = Object.keys(currentOverrides).length > 0
    if (hasOverrides) {
      return { ...baseColors, ...currentOverrides }
    }
    
    return baseColors
  }, [activeMode, lightThemeColors, darkThemeColors, manualOverrides])

  // WCAG Compliance Pairs - Comprehensive list for checker
  const wcagPairs = useMemo(() => {
    const pairs: Array<{ label: string; bg: string; fg: string; bgKey: string; fgKey: string; desc: string; isNonText?: boolean; category: string }> = []
    
    const addPair = (category: string, label: string, bgKey: string, fgKey: string, desc: string, isNonText = false) => {
      const bg = themeColors[bgKey as keyof OpencodeThemeColors] as string
      const fg = themeColors[fgKey as keyof OpencodeThemeColors] as string
      if (bg && fg) {
        pairs.push({ category, label, bg, fg, bgKey, fgKey, desc, isNonText })
      }
    }

    // --- CORE TYPOGRAPHY ---
    const backgrounds = ["background-base", "background-weak", "background-strong", "background-stronger"]
    const coreTexts = ["text-base", "text-weak", "text-weaker", "text-strong"]
    
    backgrounds.forEach(bg => {
      coreTexts.forEach(fg => {
        addPair("Core Typography", `${fg.split('-')[1]} on ${bg.split('-')[1]}`, bg, fg, `${fg} on ${bg}`)
      })
    })

    // --- SURFACES ---
    const mainSurfaces = ["surface-base", "surface-raised-base", "surface-float-base", "surface-weak", "surface-strong"]
    mainSurfaces.forEach(bg => {
      addPair("Surfaces", `Base text on ${bg.split('-')[1]}`, bg, "text-base", `text-base on ${bg}`)
    })

    // --- BRAND & INTERACTIVE ---
    addPair("Brand & Action", "On Brand", "surface-brand-base", "text-on-brand-base", "Text on Brand Surface")
    addPair("Brand & Action", "On Brand Hover", "surface-brand-hover", "text-on-brand-base", "Text on Brand Hover")
    addPair("Brand & Action", "On Interactive", "surface-interactive-base", "text-on-interactive-base", "Text on Interactive Surface")
    addPair("Brand & Action", "On Interactive Weak", "surface-interactive-weak", "text-on-interactive-weak", "Text on Interactive Weak Surface")
    addPair("Brand & Action", "Interactive Text", "background-base", "text-interactive-base", "Interactive Text on Background")

    // --- SEMANTIC STATES ---
    addPair("Semantic", "Success", "surface-success-base", "text-on-success-base", "Success state contrast")
    addPair("Semantic", "Warning", "surface-warning-base", "text-on-warning-base", "Warning state contrast")
    addPair("Semantic", "Critical", "surface-critical-base", "text-on-critical-base", "Critical state contrast")
    addPair("Semantic", "Info", "surface-info-base", "text-on-info-base", "Info state contrast")

    // --- UI COMPONENTS (NON-TEXT 3:1) ---
    addPair("UI Components", "Base Border", "background-base", "border-base", "Border on background", true)
    addPair("UI Components", "Strong Border", "background-base", "border-strong-base", "Strong border on background", true)
    addPair("UI Components", "Interactive Border", "background-base", "border-interactive-base", "Interactive border contrast", true)
    addPair("UI Components", "Base Icon", "background-base", "icon-base", "Icon on background", true)
    addPair("UI Components", "Interactive Icon", "background-base", "icon-interactive-base", "Interactive icon contrast", true)

    // --- DIFF STATES ---
    addPair("Diff", "Add Text", "surface-diff-add-base", "text-diff-add-base", "Diff Add text contrast")
    addPair("Diff", "Delete Text", "surface-diff-delete-base", "text-diff-delete-base", "Diff Delete text contrast")

    return pairs
  }, [themeColors])

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

  // Matrix Router properties - Opencode UI tokens
  const MATRIX_PROPERTIES = [
    // Backgrounds
    "background-base",
    "background-weak",
    "background-strong",
    "background-stronger",

    // Surfaces
    "surface-base",
    "surface-base-hover",
    "surface-base-active",
    "surface-base-interactive-active",
    "surface-inset-base",
    "surface-inset-base-hover",
    "surface-inset-strong",
    "surface-inset-strong-hover",
    "surface-raised-base",
    "surface-float-base",
    "surface-float-base-hover",
    "surface-raised-base-hover",
    "surface-raised-base-active",
    "surface-raised-strong",
    "surface-raised-strong-hover",
    "surface-raised-stronger",
    "surface-raised-stronger-hover",
    "surface-weak",
    "surface-weaker",
    "surface-strong",
    "surface-brand-base",
    "surface-brand-hover",
    "surface-interactive-base",
    "surface-interactive-hover",
    "surface-interactive-weak",
    "surface-interactive-weak-hover",
    "surface-success-base",
    "surface-success-weak",
    "surface-success-strong",
    "surface-warning-base",
    "surface-warning-weak",
    "surface-warning-strong",
    "surface-critical-base",
    "surface-critical-weak",
    "surface-critical-strong",
    "surface-info-base",
    "surface-info-weak",
    "surface-info-strong",

    // Diff Surfaces
    "surface-diff-unchanged-base",
    "surface-diff-skip-base",
    "surface-diff-add-base",
    "surface-diff-add-weak",
    "surface-diff-add-weaker",
    "surface-diff-add-strong",
    "surface-diff-add-stronger",
    "surface-diff-delete-base",
    "surface-diff-delete-weak",
    "surface-diff-delete-weaker",
    "surface-diff-delete-strong",
    "surface-diff-delete-stronger",

    // Text
    "text-base",
    "text-weak",
    "text-weaker",
    "text-strong",
    "text-invert-base",
    "text-invert-weak",
    "text-invert-weaker",
    "text-invert-strong",
    "text-interactive-base",
    "text-on-brand-base",
    "text-on-interactive-base",
    "text-on-interactive-weak",
    "text-on-success-base",
    "text-on-critical-base",
    "text-on-critical-weak",
    "text-on-critical-strong",
    "text-on-warning-base",
    "text-on-info-base",
    "text-diff-add-base",
    "text-diff-delete-base",
    "text-diff-delete-strong",
    "text-diff-add-strong",

    // Borders
    "border-base",
    "border-hover",
    "border-active",
    "border-selected",
    "border-disabled",
    "border-focus",
    "border-weak-base",
    "border-strong-base",
    "border-interactive-base",
    "border-interactive-hover",
    "border-interactive-active",
    "border-interactive-selected",
    "border-success-base",
    "border-warning-base",
    "border-critical-base",
    "border-info-base",

    // Icons
    "icon-base",
    "icon-hover",
    "icon-active",
    "icon-selected",
    "icon-disabled",
    "icon-focus",
    "icon-weak-base",
    "icon-strong-base",
    "icon-interactive-base",
    "icon-success-base",
    "icon-warning-base",
    "icon-critical-base",
    "icon-info-base",

    // Inputs
    "input-base",
    "input-hover",
    "input-active",

    // Other
    "focus-ring",
    "scrollbar-thumb",
    "scrollbar-track",
    "shadow",
    "overlay",
  ]

  // Handlers for Matrix Router
  const handleSeedOverride = useCallback((seedName: string, hex: string) => {
    setSeedOverrides(prev => ({
      ...prev,
      [activeMode]: {
        ...(prev[activeMode] || {}),
        [seedName]: hex
      }
    }))
  }, [activeMode])

  const handleSeedReset = useCallback((seedName: string) => {
    setSeedOverrides(prev => {
      const updated = { ...prev, [activeMode]: { ...(prev[activeMode] || {}) } }
      delete updated[activeMode][seedName]
      return updated
    })
  }, [activeMode])

  const handleManualOverride = useCallback((property: string, hex: string) => {
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
    // Also reset any preset flags if needed
  }, [])

  const handleResetMode = useCallback(() => {
    setActivePreset(null)
    setManualOverrides(prev => ({ ...prev, [activeMode]: {} }))
    setSeedOverrides(prev => ({ ...prev, [activeMode]: {} }))
  }, [activeMode])

  // Write to Opencode when manualOverrides, seeds, colors, or strategy change
  const lastWrittenRef = React.useRef<string>(localStorage.getItem("lastSyncedContent") || "")
  const isWritingRef = React.useRef<boolean>(false)

  // Use a simpler dependency array for the effect to avoid unnecessary triggers
  const themeDataString = useMemo(() => {
    return JSON.stringify({
      themeName,
      lightThemeColors,
      darkThemeColors,
      lightSeeds9,
      darkSeeds9,
      manualOverrides
    });
  }, [themeName, lightThemeColors, darkThemeColors, lightSeeds9, darkSeeds9, manualOverrides]);

  React.useEffect(() => {
    // "Instant" feel: 200ms debounce
    const timer = setTimeout(() => {
      if (isWritingRef.current || !useOpencodeMode) return

      const data = JSON.parse(themeDataString);
      const currentContent = exportToOpencode9SeedJSON(
        data.themeName, 
        data.lightThemeColors,
        data.darkThemeColors,
        data.lightSeeds9, 
        data.darkSeeds9,
        data.manualOverrides
      )
      
      // CRITICAL: If content is same as what we know is on disk, STOP.
      if (currentContent === lastWrittenRef.current) {
        return
      }

      setWriteStatus("writing")
      isWritingRef.current = true
      
      writeOpencode9ThemeFile(
        data.themeName, 
        data.lightThemeColors,
        data.darkThemeColors,
        data.lightSeeds9, 
        data.darkSeeds9,
        data.manualOverrides
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
  }, [themeDataString, useOpencodeMode])

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
        const currentManualOverrides = manualOverrides[activeMode] || {}
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
    setVariantCount(1 + Math.floor(Math.random() * 4))
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
    setVariantCount(Math.floor(Math.random() * 5) + 1)
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

  return (
    <div className="min-h-screen text-gray-100" style={{ backgroundColor: "#0d0d0d" }}>
      <header className="px-6 py-3 border-b flex items-center justify-between" style={{ backgroundColor: "#141414", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold" style={{ backgroundColor: theme.colors["surface-brand-base"] || "#6366f1" }}>
            <span style={{ color: "#ffffff" }}>O</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight" style={{ color: theme.colors["text-base"] || "#ffffff" }}>
              Desktop Theme Generator
            </h1>
            <p className="text-[11px]" style={{ color: theme.colors["text-weak"] || "#ffffff", opacity: 0.5 }}>
              Generate beautiful desktop themes with the color wheel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            <input
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            className="px-3 py-1.5 text-sm rounded border outline-none w-40"
            style={{
              backgroundColor: "transparent",
              borderColor: "rgba(255,255,255,0.1)",
              color: theme.colors["text-base"] || "#ffffff",
            }}
            placeholder="Theme name"
          />
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setActiveTab("palette")}
              className="px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === "palette" ? (theme.colors["surface-brand-base"] || "#6366f1") : "transparent",
                color: activeTab === "palette" ? "#ffffff" : (theme.colors["text-base"] || "#ffffff"),
              }}
            >
              Palette
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className="px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === "export" ? (theme.colors["surface-brand-base"] || "#6366f1") : "transparent",
                color: activeTab === "export" ? "#ffffff" : (theme.colors["text-base"] || "#ffffff"),
              }}
            >
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            {/* Color Wheel */}
            <div className="bg-[#1a1a1a] rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-sm font-medium" style={{ color: theme.colors["text-base"] || "#ffffff" }}>Color Wheel</h2>
              </div>
              <ColorWheel hsl={baseColor} paletteGroups={paletteGroups} onChange={handleColorChange} />
            </div>

            {/* Matrix Router */}
            <div className="bg-[#1a1a1a] rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-sm font-medium" style={{ color: theme.colors["text-base"] || "#ffffff" }}>Matrix Router</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMatrixMode(!matrixMode)}
                    style={{
                      backgroundColor: matrixMode ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.05)",
                      color: matrixMode ? "#6366f1" : "rgba(255,255,255,0.6)",
                    }}
                    className="text-xs px-3 py-1 rounded transition-colors"
                  >
                    {matrixMode ? "◉ Active" : "○ Enable"}
                  </button>
                </div>
              </div>

              {matrixMode && (
                <div className="p-4">
                  {/* Override count and status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                        {Object.keys(manualOverrides[activeMode] || {}).length + Object.keys(seedOverrides[activeMode] || {}).length} override(s) active
                      </span>
                      {writeStatus === "writing" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                          Writing...
                        </span>
                      )}
                      {writeStatus === "success" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                          ✓ Saved to custom-theme.json
                        </span>
                      )}
                      {writeStatus === "error" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400" title={writeError || "Unknown error"}>
                          ⚠ Save Failed
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
                          className="text-xs px-3 py-1 rounded bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 disabled:opacity-30"
                          title={`Reset only ${activeMode} overrides`}
                        >
                          Reset {activeMode === "light" ? "Light" : "Dark"}
                        </button>
                        <button
                          onClick={handleClearAll}
                          disabled={
                            Object.keys(manualOverrides.light).length === 0 && 
                            Object.keys(manualOverrides.dark).length === 0 && 
                            Object.keys(seedOverrides.light).length === 0 && 
                            Object.keys(seedOverrides.dark).length === 0
                          }
                          className="text-xs px-3 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30"
                          title="Clear all overrides for BOTH modes"
                        >
                          Clear All
                        </button>
                      </div>
                  </div>

                  {/* WCAG Compliance Summary */}
                  <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
                          WCAG 2.1 Compliance Details
                        </span>
                        <span className="text-[10px] opacity-50">Comprehensive check of {wcagPairs.length} color pairs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-[9px] opacity-70">Pass</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span className="text-[9px] opacity-70">Fail</span>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="space-y-4">
                        {Array.from(new Set(wcagPairs.map(p => p.category))).map(category => (
                          <div key={category} className="space-y-2">
                            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-1 border-b border-indigo-500/20 pb-1 mb-2">{category}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {wcagPairs.filter(p => p.category === category).map(pair => {
                                const score = getContrastScore(pair.bg, pair.fg)
                                const threshold = pair.isNonText ? 3 : 4.5
                                const isFailing = score.ratio < threshold
                                
                                // Custom level display for non-text
                                let levelDisplay = score.level
                                if (pair.isNonText) {
                                  levelDisplay = score.ratio >= 3 ? "Pass (UI)" : "Fail"
                                }

                                return (
                                  <div key={`${pair.bgKey}-${pair.fgKey}`} className="flex flex-col gap-1 bg-white/5 p-2 rounded border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex flex-col overflow-hidden">
                                        <span className="text-[10px] font-bold truncate" style={{ color: pair.fg }}>{pair.label}</span>
                                        <span className="text-[8px] opacity-40 font-medium truncate">{pair.fgKey} on {pair.bgKey}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[10px] font-mono font-bold">{score.ratio}:1</span>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                                          levelDisplay === 'AAA' ? "bg-green-500/30 text-green-300" :
                                          (levelDisplay === 'AA' || levelDisplay === 'Pass (UI)') ? "bg-blue-500/30 text-blue-300" :
                                          levelDisplay === 'AA Large' ? "bg-yellow-500/30 text-yellow-300" :
                                          "bg-red-500/30 text-red-300"
                                        }`}>
                                          {levelDisplay}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-0.5">
                                          <div className="w-2.5 h-2.5 rounded-sm border border-white/10" style={{ backgroundColor: pair.bg }} />
                                          <div className="w-2.5 h-2.5 rounded-sm border border-white/10" style={{ backgroundColor: pair.fg }} />
                                        </div>
                                        <span className="text-[8px] opacity-30 font-mono truncate max-w-[60px]">{pair.bg} vs {pair.fg}</span>
                                      </div>
                                      {isFailing && (
                                        <span className="text-[8px] text-red-400 font-medium">
                                          {threshold}:1 req.
                                        </span>
                                      )}
                                    </div>
                                    <div className="h-0.5 w-full bg-black/20 rounded-full overflow-hidden mt-0.5">
                                      <div 
                                        className={`h-full transition-all duration-500 ${isFailing ? 'bg-red-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(100, (score.ratio / 10) * 100)}%` }}
                                      />
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

                  {/* Full Palette Overview */}
                  <div className="flex flex-col gap-2 mb-6">
                    <span className="text-xs uppercase tracking-wider opacity-50 font-semibold">
                      Full Theme Palette
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {Object.entries(activeVariantsMap).map(([seedName, variants]) => {
                        const isSeedOverridden = seedName in (seedOverrides[activeMode] || {});
                        return (
                          <div key={seedName} className="flex items-center gap-2">
                            <div className="flex items-center gap-1 w-16 shrink-0">
                              <button
                                onClick={() => handleSeedReset(seedName)}
                                className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors ${
                                  isSeedOverridden
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "bg-gray-800 text-gray-600 hover:bg-gray-700"
                                }`}
                                title={isSeedOverridden ? "Reset seed to generated value" : "Seed is auto-generated"}
                              >
                                <span className="text-[8px] leading-none">{isSeedOverridden ? "✕" : "○"}</span>
                              </button>
                              <span className="text-[10px] opacity-60 capitalize truncate">{seedName}</span>
                            </div>
                            <div className="flex gap-1">
                              {variants.map((variant, vIdx) => {
                                // Use a small epsilon for color matching to avoid rounding issues
                                const isCurrentSeed = seeds9.find(s => s.name === seedName)?.hex.toLowerCase() === variant.hex.toLowerCase();
                                return (
                                  <div
                                    key={`${seedName}-${vIdx}`}
                                    onClick={() => handleSeedOverride(seedName, variant.hex)}
                                    className={`w-8 h-8 rounded border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                                      isCurrentSeed ? "ring-2 ring-white z-10 scale-105" : "opacity-80 hover:opacity-100"
                                    }`}
                                    style={{
                                      backgroundColor: variant.hex,
                                      borderColor: "rgba(255,255,255,0.2)",
                                    }}
                                    title={`Set ${seedName} seed to: ${variant.hex}`}
                                  >
                                    {variant.isBase && (
                                      <span className="text-[8px] font-bold" style={{ color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                                        ●
                                      </span>
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

                  {/* Matrix Grid */}
                  <div className="space-y-1 max-h-[600px] overflow-y-auto">
                    {MATRIX_PROPERTIES.map((property) => {
                      const currentColor = themeColors[property as keyof OpencodeThemeColors]
                      const currentModeOverrides = manualOverrides[activeMode] || {}
                      const isOverridden = property in currentModeOverrides

                      return (
                        <div key={property} className="flex items-center gap-2">
                          <button
                            onClick={() => handleManualReset(property)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                              isOverridden
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "bg-gray-800 text-gray-600 hover:bg-gray-700"
                            }`}
                          >
                            {isOverridden ? "✕" : "○"}
                          </button>

                          <span className="text-xs capitalize w-36 truncate" style={{ color: "rgba(255,255,255,0.7)" }} title={property}>
                            {property}
                          </span>

                          {/* Calculated Preview */}
                          <div 
                            className="w-8 h-6 rounded border border-white/10 shrink-0"
                            style={{ backgroundColor: currentColor }}
                            title={`Calculated: ${currentColor}`}
                          />

                          <div className="flex flex-wrap gap-1 ml-2 max-w-[400px]">
                            {Object.entries(activeVariantsMap).map(([seedName, variants]) => (
                              <div key={`${property}-${seedName}`} className="flex gap-0.5 p-0.5 rounded bg-white/5">
                                {variants.map((variant, idx) => {
                                  const isSelected = currentColor === variant.hex
                                  const whiteContrast = getContrastRatio(variant.hex, "#ffffff")
                                  const blackContrast = getContrastRatio(variant.hex, "#000000")
                                  const bestContrast = Math.max(whiteContrast, blackContrast)
                                  const wcagLevel = getWCAGLevel(bestContrast)
                                  const contrastColor = whiteContrast > blackContrast ? "#ffffff" : "#000000"

                                  return (
                                    <button
                                      key={`${property}-${seedName}-${idx}`}
                                      onClick={() => handleManualOverride(property, variant.hex)}
                                      className={`w-5 h-4 rounded-sm transition-all relative flex items-center justify-center ${
                                        isSelected ? "ring-1 ring-white ring-offset-1 ring-offset-[#1a1a1a] scale-110 z-10" : "hover:scale-105"
                                      }`}
                                      style={{ backgroundColor: variant.hex }}
                                      title={`${seedName} variant ${idx}: ${variant.hex} (${bestContrast.toFixed(1)}:1 ${wcagLevel})`}
                                    >
                                      {variant.isBase && (
                                        <div className="w-0.5 h-0.5 rounded-full bg-white opacity-40" />
                                      )}
                                      {isSelected && (
                                        <div 
                                          className="w-1.5 h-1.5 rounded-full" 
                                          style={{ backgroundColor: contrastColor }}
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
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="bg-[#1a1a1a] rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-sm font-medium" style={{ color: theme.colors["text-base"] || "#ffffff" }}>Configuration</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between p-2 rounded bg-indigo-500/10 border border-indigo-500/20 mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-indigo-300">Opencode 9-Seed Mode</span>
                    <span className="text-[10px] opacity-60">Generate 9 semantic seeds for Opencode UI</span>
                  </div>
                  <button
                    onClick={() => setUseOpencodeMode(!useOpencodeMode)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${useOpencodeMode ? 'bg-indigo-500' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${useOpencodeMode ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wide opacity-50 block mb-1.5">Color Space</label>
                    <select
                      value={colorSpace}
                      onChange={(e) => setColorSpace(e.target.value as ColorSpace)}
                      className="w-full px-2.5 py-1.5 text-sm rounded border outline-none"
                      style={{
                        backgroundColor: "transparent",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: theme.colors["text-base"] || "#ffffff",
                      }}
                    >
                      {['HSL', 'CAM02', 'HSLuv', 'LCh D50', 'LCh D65', 'OkLCh', 'IPT', 'LCh(uv)'].map((opt) => (
                        <option key={opt} value={opt} className="bg-[#1a1a1a]">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide opacity-50 block mb-1.5">Output Space</label>
                    <select
                      value={outputSpace}
                      onChange={(e) => setOutputSpace(e.target.value as OutputSpace)}
                      className="w-full px-2.5 py-1.5 text-sm rounded border outline-none"
                      style={{
                        backgroundColor: "transparent",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: theme.colors["text-base"] || "#ffffff",
                      }}
                    >
                      {['sRGB', 'P3', 'AdobeRGB', 'Rec.2020', 'HSL', 'HSV'].map((opt) => (
                        <option key={opt} value={opt} className="bg-[#1a1a1a]">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wide opacity-50 block mb-1.5">Harmony Rule</label>
                    <select
                      value={harmony}
                      onChange={(e) => setHarmony(e.target.value as HarmonyRule)}
                      className="w-full px-2.5 py-1.5 text-sm rounded border outline-none"
                      style={{
                        backgroundColor: "transparent",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: theme.colors["text-base"] || "#ffffff",
                      }}
                    >
                      {harmonyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wide opacity-50 block mb-1.5">Variant Strategy</label>
                    <select
                      value={variantStrategy}
                      onChange={(e) => setVariantStrategy(e.target.value as VariantStrategy)}
                      className="w-full px-2.5 py-1.5 text-sm rounded border outline-none"
                      style={{
                        backgroundColor: "transparent",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: theme.colors["text-base"] || "#ffffff",
                      }}
                    >
                      {variantStrategyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="p-3 rounded-lg bg-gray-800/30 border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => setActiveMode("dark")}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                          activeMode === "dark" 
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40" 
                          : "bg-gray-800 text-gray-500 border border-transparent hover:bg-gray-700"
                        }`}
                      >
                        🌙 Dark Mode
                      </button>
                      <button
                        onClick={() => setActiveMode("light")}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
                          activeMode === "light" 
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40" 
                          : "bg-gray-800 text-gray-500 border border-transparent hover:bg-gray-700"
                        }`}
                      >
                        ☀️ Light Mode
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] uppercase tracking-wide opacity-50">
                          {activeMode === "light" ? "Light" : "Dark"} Brightness
                        </label>
                        <span className="text-xs font-mono opacity-60">
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
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] uppercase tracking-wide opacity-50">
                          {activeMode === "light" ? "Light" : "Dark"} Contrast
                        </label>
                        <span className="text-xs font-mono opacity-60">
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
                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] uppercase tracking-wide opacity-50">Global Saturation</label>
                      <span className="text-xs font-mono opacity-60">{saturation}%</span>
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
                      className="w-full"
                      style={{ accentColor: theme.colors["surface-brand-base"] }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] uppercase tracking-wide opacity-50">Spread / Angle</label>
                      <span className="text-xs font-mono opacity-60">{spread}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="180"
                      value={spread}
                      onChange={(e) => setSpread(parseInt(e.target.value))}
                      className="w-full"
                      style={{ accentColor: theme.colors["surface-interactive-base"] }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] uppercase tracking-wide opacity-50">Variants</label>
                      <span className="text-xs font-mono opacity-60">{variantCount * 2 + 1} colors</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={variantCount}
                      onChange={(e) => setVariantCount(parseInt(e.target.value))}
                      className="w-full"
                      style={{ accentColor: theme.colors["surface-success-base"] }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Randomizers */}
            <div className="bg-[#1a1a1a] rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-sm font-medium" style={{ color: theme.colors["text-base"] || "#ffffff" }}>Randomizers</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    onClick={randomizeAll}
                    className="px-3 py-2 rounded text-sm font-medium transition-colors border"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    Randomize All
                  </button>
                  <button
                    onClick={invertBase}
                    className="px-3 py-2 rounded text-sm font-medium transition-colors border"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    Invert Base
                  </button>
                  <button
                    onClick={chaosMode}
                    className="px-3 py-2 rounded text-sm font-medium transition-colors border"
                    style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", borderColor: "rgba(99, 102, 241, 0.2)" }}
                  >
                    Chaos Mode
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => applyThemePreset("cyberpunk")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}
                  >
                    Cyberpunk
                  </button>
                  <button
                    onClick={() => applyThemePreset("cinematic")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(20, 184, 166, 0.1)", color: "#14b8a6" }}
                  >
                    Cinematic
                  </button>
                  <button
                    onClick={() => applyThemePreset("pastel")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}
                  >
                    Pastel
                  </button>
                  <button
                    onClick={() => applyThemePreset("retro")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(251, 146, 60, 0.1)", color: "#fb923c" }}
                  >
                    Retro
                  </button>
                  <button
                    onClick={() => applyThemePreset("vivid")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(6, 182, 212, 0.1)", color: "#06b6d4" }}
                  >
                    Vivid
                  </button>
                  <button
                    onClick={() => applyThemePreset("earthy")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}
                  >
                    Earthy
                  </button>
                  <button
                    onClick={() => applyThemePreset("popArt")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", color: "#eab308" }}
                  >
                    Pop Art
                  </button>
                  <button
                    onClick={() => applyThemePreset("midnight")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}
                  >
                    Midnight
                  </button>
                  <button
                    onClick={() => applyThemePreset("psychedelic")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(232, 121, 249, 0.1)", color: "#e879f9" }}
                  >
                    Psychedelic
                  </button>
                  <button
                    onClick={() => applyThemePreset("warm")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(249, 115, 22, 0.1)", color: "#f97316" }}
                  >
                    Warm
                  </button>
                  <button
                    onClick={() => applyThemePreset("cool")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(96, 165, 250, 0.1)", color: "#60a5fa" }}
                  >
                    Cool
                  </button>
                  <button
                    onClick={() => applyThemePreset("neon")}
                    className="px-2 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: "rgba(52, 211, 153, 0.1)", color: "#34d399" }}
                  >
                    Neon
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {activeTab === "palette" ? (
              <>
                <ThemePreview theme={themeColors} />

                {/* Opencode Theme Presets */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Opencode Desktop Presets</h2>
                    {activePreset && (
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                        {opencodePresets[activePreset as keyof typeof opencodePresets].name} active
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(opencodePresets).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => applyOpencodePreset(preset.id)}
                          className={`p-3 rounded-lg text-left transition-colors border ${
                            activePreset === preset.id
                              ? "bg-indigo-500/20 border-indigo-500/50"
                              : "bg-gray-800/50 border-gray-700 hover:bg-gray-700"
                          }`}
                          style={{
                            borderColor: activePreset === preset.id ? "#6366f1" : "rgba(255,255,255,0.1)",
                          }}
                        >
                          <div className="text-xs font-medium">{preset.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{preset.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <h2 className="text-sm font-semibold">9-Seed Palette</h2>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      {seeds9.map((seed: SeedColor, idx: number) => {
                        const currentSeedVariants = activeMode === "light" ? seedVariantsLight : seedVariantsDark
                        const variants = currentSeedVariants[seed.name] || []
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded-full border border-gray-600"
                                style={{ backgroundColor: seed.hex }}
                              />
                              <span className="text-xs font-medium capitalize">{seed.name}</span>
                              <span className="text-[10px] text-gray-500">{seed.hex}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {variants.slice(0, 5).map((stop, vIdx) => (
                                <button
                                  key={vIdx}
                                  onClick={() => handleCopy(stop.hex)}
                                  className="w-6 h-6 rounded transition-transform hover:scale-110"
                                  style={{ backgroundColor: stop.hex }}
                                  title={stop.hex}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <h2 className="text-sm font-semibold">Theme Colors</h2>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {Object.entries(themeColors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800">
                        <div
                          className="w-10 h-10 rounded-lg border border-gray-600 flex-shrink-0"
                          style={{ backgroundColor: value as string }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium capitalize">{key}</div>
                          <div className="text-[10px] text-gray-400 font-mono truncate">{value as string}</div>
                        </div>
                        <button onClick={() => handleCopy(value as string)} className="p-1.5 hover:bg-gray-700 rounded transition-colors">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <h2 className="text-sm font-semibold">Export Theme</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {exportFormats.map((format: any) => (
                      <button
                        key={format.id}
                        onClick={() => handleExport(format.id)}
                        className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors border border-gray-700"
                      >
                        <div className="text-xs font-mono text-gray-500 mb-1">{format.ext}</div>
                        <div className="text-sm font-medium">{format.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
