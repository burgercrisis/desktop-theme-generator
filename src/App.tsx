import React, { useState, useMemo, useCallback } from "react"
import ColorWheel from "./components/ColorWheel"
import ThemePreview from "./components/ThemePreview"
import { getContrastScore, getContrastRatio, getWCAGLevel } from "./utils/colorUtils"
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
  SeedName, 
  InternalThemeColors,
  ColorSpace,
  OutputSpace
} from "./types"
import "./App.css"

const getInitialState = (key: string, defaultValue: any) => {
  const saved = localStorage.getItem(key)
  if (!saved) return defaultValue
  try {
    return JSON.parse(saved)
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
  const [, setCopiedHex] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"palette" | "export">("palette")

  // Matrix Router state
  const [matrixMode, setMatrixMode] = useState(() => getInitialState("matrixMode", false))
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>(() => getInitialState("manualOverrides", {}))
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
    return generateOpencodeSeeds(baseColor, harmony, spread, lightBrightness)
  }, [baseColor, harmony, spread, lightBrightness])

  const darkSeeds9 = useMemo<SeedColor[]>(() => {
    return generateOpencodeSeeds(baseColor, harmony, spread, darkBrightness)
  }, [baseColor, harmony, spread, darkBrightness])

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
        50 // We already applied brightness to the seed, so variants are centered around the brightened seed
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
        50 // We already applied brightness to the seed
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
    
    // Apply manual overrides
    const hasOverrides = Object.keys(manualOverrides).length > 0
    if (hasOverrides) {
      return { ...baseColors, ...manualOverrides }
    }
    
    return baseColors
  }, [activeMode, lightThemeColors, darkThemeColors, manualOverrides])

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
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1500)
  }, [])

  const applyOpencodePreset = useCallback((presetId: string) => {
    const overrides = getPresetOverrides(presetId)
    setManualOverrides(overrides)
    setActivePreset(presetId)
  }, [])

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
                    {Object.keys(manualOverrides).length} override(s) active
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
                    <button
                      onClick={() => {
                        setActivePreset(null)
                        setManualOverrides({})
                      }}
                      disabled={Object.keys(manualOverrides).length === 0}
                      className="text-xs px-3 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* WCAG Compliance Summary */}
                  <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
                        WCAG 2.1 Compliance
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(() => {
                        const pairs = [
                          { label: "Main Text", bg: themeColors["background-base"], fg: themeColors["text-base"] },
                          { label: "Brand Text", bg: themeColors["surface-brand-base"], fg: themeColors["text-on-brand-base"] },
                          { label: "Surface Text", bg: themeColors["surface-base"], fg: themeColors["text-base"] },
                          { label: "Success Text", bg: themeColors["surface-success-base"], fg: themeColors["text-on-success-base"] },
                        ]
                        return pairs.map(pair => {
                          const score = getContrastScore(pair.bg, pair.fg)
                          return (
                            <div key={pair.label} className="flex items-center justify-between bg-white/5 p-1.5 rounded">
                              <span className="text-[10px] opacity-60">{pair.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono">{score.ratio}:1</span>
                                <span className={`text-[9px] px-1 rounded ${
                                  score.level === 'AAA' ? "bg-green-500/30 text-green-300" :
                                  score.level === 'AA' ? "bg-blue-500/30 text-blue-300" :
                                  score.level === 'AA Large' ? "bg-yellow-500/30 text-yellow-300" :
                                  "bg-red-500/30 text-red-300"
                                }`}>
                                  {score.level}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Full Palette Overview */}
                  <div className="flex flex-col gap-2 mb-6">
                    <span className="text-xs uppercase tracking-wider opacity-50 font-semibold">
                      Full Theme Palette
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {Object.entries(activeVariantsMap).map(([seedName, variants]) => (
                        <div key={seedName} className="flex items-center gap-2">
                          <span className="text-[10px] w-16 opacity-60 capitalize">{seedName}</span>
                          <div className="flex gap-1">
                            {variants.map((variant, vIdx) => (
                              <div
                                key={`${seedName}-${vIdx}`}
                                className={`w-8 h-8 rounded border flex items-center justify-center transition-transform hover:scale-110`}
                                style={{
                                  backgroundColor: variant.hex,
                                  borderColor: "rgba(255,255,255,0.2)",
                                }}
                                title={`${seedName} variant ${vIdx}: ${variant.hex}`}
                              >
                                {variant.isBase && (
                                  <span className="text-[8px] font-bold" style={{ color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                                    ●
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Matrix Grid */}
                  <div className="space-y-1 max-h-[600px] overflow-y-auto">
                    {MATRIX_PROPERTIES.map((property) => {
                      const currentColor = themeColors[property as keyof OpencodeThemeColors]
                      const isOverridden = property in manualOverrides

                      return (
                        <div key={property} className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updated = { ...manualOverrides }
                              delete updated[property]
                              setManualOverrides(updated)
                              setActivePreset(null)
                            }}
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
                                      onClick={() => {
                                        const newOverrides = { ...manualOverrides, [property]: variant.hex }
                                        setManualOverrides(newOverrides)
                                        setActivePreset(null)
                                      }}
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
