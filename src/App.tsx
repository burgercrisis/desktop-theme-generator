import React, { useState, useMemo, useCallback } from "react"
import ColorWheel from "./components/ColorWheel"
import ThemePreview from "./components/ThemePreview"
import {
  generateHarmony,
  generateVariants,
  generateThemeColors,
  generateOpencodeSeeds,
  generate9SeedHarmony,
  generateOpencodeThemeColors,
  harmonyOptions,
  variantStrategyOptions,
  thematicPresets,
} from "./utils/harmonies"
import {
  exportToCSS,
  exportToJSON,
  exportToTailwind,
  exportToSCSS,
  exportToOpencode9SeedJSON,
  downloadFile,
  exportFormats,
  writeCustomThemeFile,
} from "./utils/exportUtils"
import { opencodePresets, getPresetOverrides } from "./utils/themePresets"
import { HSL, HarmonyRule, VariantStrategy, DesktopTheme, SeedColor, OpencodeThemeColors } from "./types"
import { hslToHex, getContrastRatio, getWCAGLevel, getContrastScore } from "./utils/colorUtils"
import "./App.css"

const App: React.FC = () => {
  const [baseColor, setBaseColor] = useState<HSL>({ h: 220, s: 25, l: 55 })
  const [harmony, setHarmony] = useState<HarmonyRule>("Analogous (3)")
  const [spread, setSpread] = useState(30)
  const [variantCount, setVariantCount] = useState(2)
  const [contrast, setContrast] = useState(50)
  const [variantStrategy, setVariantStrategy] = useState<VariantStrategy>("Tints & Shades")
  const [themeName, setThemeName] = useState("My Theme")
  const [copiedHex, setCopiedHex] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"palette" | "export">("palette")
  const [useOpencodeMode, setUseOpencodeMode] = useState(true)

  // Matrix Router state
  const [matrixMode, setMatrixMode] = useState(false)
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({})
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [writeStatus, setWriteStatus] = useState<"idle" | "writing" | "success" | "error">("idle")

  // Generate 9 seeds for Opencode mode
  const seeds9 = useMemo(() => {
    if (useOpencodeMode) {
      return generate9SeedHarmony(baseColor, harmony, spread)
    }
    return generateOpencodeSeeds(baseColor)
  }, [baseColor, harmony, spread, useOpencodeMode])

  // Generate variants for each seed (for matrix mode)
  const seedVariants = useMemo(() => {
    const variants: Record<string, string[]> = {}
    seeds9.forEach((seed) => {
      const allVariants = generateVariants(seed.hsl, variantCount, contrast, variantStrategy)
      const sorted = [...allVariants].sort((a, b) => b.hsl.l - a.hsl.l)
      variants[seed.name] = sorted.map((v) => v.hex)
    })
    return variants
  }, [seeds9, variantCount, contrast, variantStrategy])

  // Generate Opencode theme colors
  const opencodeTheme = useMemo<OpencodeThemeColors>(() => {
    if (useOpencodeMode) {
      return generateOpencodeThemeColors(seeds9, seedVariants as any)
    }
    const oldPaletteGroups = generateHarmony(baseColor, harmony, spread)
    const oldVariants = oldPaletteGroups.map((group, idx) => {
      const prevHsl = oldPaletteGroups[idx === 0 ? oldPaletteGroups.length - 1 : idx - 1].base.hsl
      const nextHsl = oldPaletteGroups[(idx + 1) % oldPaletteGroups.length].base.hsl
      return {
        group,
        variants: generateVariants(group.base.hsl, variantCount, contrast, variantStrategy, prevHsl, nextHsl),
      }
    })
    const oldColors = generateThemeColors(oldPaletteGroups, baseColor)

    const converted: OpencodeThemeColors = {
      "background-base": oldColors.background,
      "background-weak": oldColors.backgroundWeak,
      "background-strong": oldColors.backgroundStrong,
      "background-stronger": oldColors.backgroundStronger,
      "surface-base": oldColors.surfaceBase,
      "surface-base-hover": oldColors.surfaceBaseHover,
      "surface-base-active": oldColors.surfaceBaseActive,
      "surface-raised-base": oldColors.surfaceRaised,
      "surface-raised-base-hover": oldColors.surfaceRaisedHover,
      "surface-raised-base-active": oldColors.surfaceRaisedActive,
      "surface-raised-strong": oldColors.surfaceRaisedStrong,
      "surface-weak": oldColors.surfaceWeak,
      "surface-weaker": oldColors.surfaceWeaker,
      "surface-strong": oldColors.surfaceStrong,
      "text-base": oldColors.foreground,
      "text-weak": oldColors.foregroundWeak,
      "text-weaker": oldColors.foregroundWeaker,
      "text-strong": oldColors.foregroundStrong,
      "text-on-brand-base": oldColors.textOnBrand,
      "border-base": oldColors.borderBase,
      "border-weak": oldColors.borderWeak,
      "border-strong": oldColors.borderStrong,
      "border-selected": oldColors.borderSelected,
      "icon-base": oldColors.iconBase,
      "icon-weak": oldColors.iconWeak,
      "icon-strong": oldColors.iconStrong,
      "primary-base": oldColors.primary,
      "primary-hover": oldColors.primaryHover,
      "primary-active": oldColors.primaryActive,
      "primary-text": oldColors.primaryText,
      "secondary-base": oldColors.secondary,
      "secondary-hover": oldColors.secondaryHover,
      "secondary-active": oldColors.secondaryActive,
      "secondary-text": oldColors.secondaryText,
      "accent-base": oldColors.accent,
      "accent-hover": oldColors.accentHover,
      "accent-active": oldColors.accentActive,
      "accent-text": oldColors.accentText,
      "success-base": oldColors.success,
      "success-hover": oldColors.successHover,
      "success-active": oldColors.successActive,
      "success-text": oldColors.successText,
      "warning-base": oldColors.warning,
      "warning-hover": oldColors.warningHover,
      "warning-active": oldColors.warningActive,
      "warning-text": oldColors.warningText,
      "critical-base": oldColors.critical,
      "critical-hover": oldColors.criticalHover,
      "critical-active": oldColors.criticalActive,
      "critical-text": oldColors.criticalText,
      "info-base": oldColors.info,
      "info-hover": oldColors.infoHover,
      "info-active": oldColors.infoActive,
      "info-text": oldColors.infoText,
      "interactive-base": oldColors.primary,
      "interactive-hover": oldColors.primaryHover,
      "interactive-active": oldColors.primaryActive,
      "interactive-text": oldColors.primaryText,
      "diff-add-base": oldColors.diffAddBackground,
      "diff-add-foreground": oldColors.diffAddForeground,
      "diff-delete-base": oldColors.diffRemoveBackground,
      "diff-delete-foreground": oldColors.diffRemoveForeground,
      "code-background": oldColors.codeBackground,
      "code-foreground": oldColors.codeForeground,
      "tab-active": oldColors.tabActive,
      "tab-inactive": oldColors.tabInactive,
      "tab-hover": oldColors.tabHover,
      "line-indicator": oldColors.lineIndicator,
      "line-indicator-active": oldColors.lineIndicatorActive,
      "avatar-background": oldColors.avatarBackground,
      "avatar-foreground": oldColors.avatarForeground,
      "scrollbar-thumb": oldColors.scrollbarThumb,
      "scrollbar-track": oldColors.scrollbarTrack,
      "focus-ring": oldColors.focusRing,
      "shadow": oldColors.shadow,
      "overlay": oldColors.overlay,
    }
    return converted
  }, [useOpencodeMode, seeds9, seedVariants, baseColor, harmony, spread, variantCount, contrast, variantStrategy])

  // Keep old system for backward compatibility
  const paletteGroups = useMemo(() => generateHarmony(baseColor, harmony, spread), [baseColor, harmony, spread])

  const allVariants = useMemo(() => {
    return paletteGroups.map((group, idx) => {
      const prevHsl = paletteGroups[idx === 0 ? paletteGroups.length - 1 : idx - 1].base.hsl
      const nextHsl = paletteGroups[(idx + 1) % paletteGroups.length].base.hsl
      return {
        group,
        variants: generateVariants(group.base.hsl, variantCount, contrast, variantStrategy, prevHsl, nextHsl),
      }
    })
  }, [paletteGroups, variantCount, contrast, variantStrategy])

  const theme = useMemo<DesktopTheme>(() => {
    const colors = generateThemeColors(paletteGroups, baseColor)
    const allColors = allVariants.flatMap((av) => [av.group.base, ...av.variants])

    const hasOverrides = Object.keys(manualOverrides).length > 0
    const colorsWithOverrides = hasOverrides ? { ...colors } : colors

    if (hasOverrides) {
      for (const [property, color] of Object.entries(manualOverrides)) {
        if (property in colorsWithOverrides) {
          colorsWithOverrides[property as keyof typeof colorsWithOverrides] = color
        }
      }
    }

    return {
      name: themeName,
      colors: colorsWithOverrides,
      palette: allColors,
    }
  }, [paletteGroups, allVariants, themeName, baseColor, manualOverrides])

  // Matrix Router properties - Opencode UI tokens
  const MATRIX_PROPERTIES = [
    "background-base",
    "background-weak",
    "background-strong",
    "background-stronger",
    "surface-base",
    "surface-base-hover",
    "surface-base-active",
    "surface-raised-base",
    "surface-raised-base-hover",
    "surface-raised-base-active",
    "surface-raised-strong",
    "surface-weak",
    "surface-weaker",
    "surface-strong",
    "text-base",
    "text-weak",
    "text-weaker",
    "text-strong",
    "text-on-brand-base",
    "border-base",
    "border-weak",
    "border-strong",
    "border-selected",
    "icon-base",
    "icon-weak",
    "icon-strong",
    "primary-base",
    "primary-hover",
    "primary-active",
    "primary-text",
    "secondary-base",
    "secondary-hover",
    "secondary-active",
    "secondary-text",
    "accent-base",
    "accent-hover",
    "accent-active",
    "accent-text",
    "success-base",
    "success-hover",
    "success-active",
    "success-text",
    "warning-base",
    "warning-hover",
    "warning-active",
    "warning-text",
    "critical-base",
    "critical-hover",
    "critical-active",
    "critical-text",
    "info-base",
    "info-hover",
    "info-active",
    "info-text",
    "interactive-base",
    "interactive-hover",
    "interactive-active",
    "interactive-text",
    "diff-add-base",
    "diff-add-foreground",
    "diff-delete-base",
    "diff-delete-foreground",
    "code-background",
    "code-foreground",
    "tab-active",
    "tab-inactive",
    "tab-hover",
    "line-indicator",
    "line-indicator-active",
    "avatar-background",
    "avatar-foreground",
    "scrollbar-thumb",
    "scrollbar-track",
    "focus-ring",
    "shadow",
    "overlay",
  ]

  const handleColorChange = useCallback((hsl: HSL) => {
    setBaseColor(hsl)
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
    setWriteStatus("writing")

    // Create a DesktopTheme from the current theme and apply overrides
    const themeWithOverrides: DesktopTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        ...overrides,
      },
    }

    // Write to custom-theme.json
    writeCustomThemeFile(themeWithOverrides)
      .then(() => {
        setWriteStatus("success")
        setTimeout(() => setWriteStatus("idle"), 2000)
      })
      .catch((err) => {
        console.error("Failed to write custom theme:", err)
        setWriteStatus("error")
        setTimeout(() => setWriteStatus("idle"), 2000)
      })
  }, [theme])

  const handleExport = useCallback(
    (format: string) => {
      const formats: Record<string, (t: DesktopTheme) => string> = {
        css: exportToCSS,
        json: exportToJSON,
        tailwind: exportToTailwind,
        scss: exportToSCSS,
      }

      if (format === "opencode9") {
        const content = exportToOpencode9SeedJSON(themeName, opencodeTheme, seeds9)
        const formatInfo = exportFormats.find((f) => f.id === format)
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
      const formatInfo = exportFormats.find((f) => f.id === format)
      downloadFile(
        content,
        `${themeName.toLowerCase().replace(/\s+/g, "-")}${formatInfo?.ext || ".css"}`,
        formatInfo?.mime || "text/plain",
      )
    },
    [theme, themeName, opencodeTheme, seeds9],
  )

  const randomizeAll = useCallback(() => {
    setBaseColor({
      h: Math.floor(Math.random() * 360),
      s: 40 + Math.floor(Math.random() * 60),
      l: 40 + Math.floor(Math.random() * 30),
    })
    setHarmony(harmonyOptions[Math.floor(Math.random() * harmonyOptions.length)].value)
    setVariantStrategy(variantStrategyOptions[Math.floor(Math.random() * variantStrategyOptions.length)].value)
    setVariantCount(1 + Math.floor(Math.random() * 4))
    setSpread(15 + Math.floor(Math.random() * 45))
    setContrast(20 + Math.floor(Math.random() * 70))
  }, [])

  const invertBase = useCallback(() => {
    setBaseColor((prev) => ({
      h: (prev.h + 180) % 360,
      s: prev.s,
      l: 100 - prev.l,
    }))
  }, [])

  const chaosMode = useCallback(() => {
    setBaseColor({
      h: Math.floor(Math.random() * 360),
      s: Math.random() > 0.5 ? 80 + Math.random() * 20 : Math.random() * 30,
      l: Math.random() > 0.5 ? 70 + Math.random() * 30 : Math.random() * 30,
    })
    setHarmony(harmonyOptions[Math.floor(Math.random() * harmonyOptions.length)].value)
    setVariantStrategy(variantStrategyOptions[Math.floor(Math.random() * variantStrategyOptions.length)].value)
    setVariantCount(Math.floor(Math.random() * 5) + 1)
    setSpread(Math.floor(Math.random() * 180))
  }, [])

  const applyThemePreset = useCallback((presetName: keyof typeof thematicPresets) => {
    const preset = thematicPresets[presetName]
    const h = preset.h[0] + Math.random() * (preset.h[1] - preset.h[0])
    const s = preset.s[0] + Math.random() * (preset.s[1] - preset.s[0])
    const l = preset.l[0] + Math.random() * (preset.l[1] - preset.l[0])
    setBaseColor({ h: Math.round(h), s: Math.round(s), l: Math.round(l) })
    setHarmony(preset.harmony)
    setVariantStrategy(preset.strategy)
  }, [])

  return (
    <div className="min-h-screen text-gray-100" style={{ backgroundColor: "#0d0d0d" }}>
      <header className="px-6 py-3 border-b flex items-center justify-between" style={{ backgroundColor: "#141414", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold" style={{ backgroundColor: theme.colors.primary }}>
            <span style={{ color: "#ffffff" }}>O</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight" style={{ color: theme.colors.foreground }}>
              Desktop Theme Generator
            </h1>
            <p className="text-[11px]" style={{ color: theme.colors.foreground, opacity: 0.5 }}>
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
              color: theme.colors.foreground,
            }}
            placeholder="Theme name"
          />
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setActiveTab("palette")}
              className="px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === "palette" ? theme.colors.primary : "transparent",
                color: activeTab === "palette" ? "#ffffff" : theme.colors.foreground,
              }}
            >
              Palette
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className="px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === "export" ? theme.colors.primary : "transparent",
                color: activeTab === "export" ? "#ffffff" : theme.colors.foreground,
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
                <h2 className="text-sm font-medium" style={{ color: theme.colors.foreground }}>Color Wheel</h2>
              </div>
              <ColorWheel hsl={baseColor} paletteGroups={paletteGroups} onChange={handleColorChange} />
            </div>

            {/* Matrix Router */}
            <div className="bg-[#1a1a1a] rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-sm font-medium" style={{ color: theme.colors.foreground }}>Matrix Router</h2>
                <div className="flex items-center gap-2">
                  {/* Opencode Mode Toggle */}
                  <button
                    onClick={() => setUseOpencodeMode(!useOpencodeMode)}
                    style={{
                      backgroundColor: useOpencodeMode ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.05)",
                      color: useOpencodeMode ? "#22c55e" : "rgba(255,255,255,0.6)",
                    }}
                    className="text-xs px-3 py-1 rounded transition-colors"
                  >
                    {useOpencodeMode ? "◉ 9-Seed" : "○ 7-Seed"}
                  </button>
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
                          ✓ Saved to custom-theme.css
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
                        WCAG Compliance
                      </span>
                      {(() => {
                        const textOnBg = getContrastScore(opencodeTheme["background-base"], opencodeTheme["text-base"])
                        const primaryText = getContrastScore(opencodeTheme["primary-base"], opencodeTheme["primary-text"])
                        const textOnSurface = getContrastScore(opencodeTheme["surface-base"], opencodeTheme["text-base"])
                        const allPass = textOnBg.pass && primaryText.pass && textOnSurface.pass
                        return (
                          <span className={`text-xs px-2 py-0.5 rounded ${allPass ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                            {allPass ? "✓ AA Compliant" : "⚠ Review Needed"}
                          </span>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Seeds Row */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs uppercase tracking-wider w-24" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {useOpencodeMode ? "Seeds (9)" : "Seeds (7)"}
                    </span>
                    <div className="flex gap-1">
                      {seeds9.map((seed, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded border flex flex-col items-center justify-center"
                          style={{
                            backgroundColor: seed.hex,
                            borderColor: "rgba(255,255,255,0.2)",
                          }}
                          title={`${seed.name}: ${seed.hex}`}
                        >
                          <span className="text-[8px] font-bold" style={{ color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                            {seed.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Matrix Grid */}
                  <div className="space-y-1 max-h-[600px] overflow-y-auto">
                    {MATRIX_PROPERTIES.map((property) => {
                      const currentColor = useOpencodeMode
                        ? opencodeTheme[property as keyof OpencodeThemeColors]
                        : theme.colors[property as keyof typeof theme.colors]
                      const isOverridden = property in manualOverrides

                      return (
                        <div key={property} className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updated = { ...manualOverrides }
                              delete updated[property]
                              setManualOverrides(updated)
                              setActivePreset(null)

                              // Write updated overrides
                              if (Object.keys(updated).length > 0) {
                                setWriteStatus("writing")
                                const themeWithOverrides = {
                                  ...theme,
                                  colors: { ...theme.colors, ...updated },
                                }
                                writeCustomThemeFile(themeWithOverrides)
                                  .then(() => {
                                    setWriteStatus("success")
                                    setTimeout(() => setWriteStatus("idle"), 2000)
                                  })
                                  .catch(() => {
                                    setWriteStatus("error")
                                    setTimeout(() => setWriteStatus("idle"), 2000)
                                  })
                              } else {
                                setWriteStatus("idle")
                              }
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

                          <div className="flex gap-0.5">
                            {/* Seeds column */}
                            {seeds9.map((seed, idx) => {
                              const isSelected = currentColor === seed.hex
                              const whiteContrast = getContrastRatio(seed.hex, "#ffffff")
                              const blackContrast = getContrastRatio(seed.hex, "#000000")
                              const bestContrast = Math.max(whiteContrast, blackContrast)
                              const wcagLevel = getWCAGLevel(bestContrast)

                              return (
                                <button
                                  key={`seed-${idx}`}
                                  onClick={() => {
                                    const newOverrides = { ...manualOverrides, [property]: seed.hex }
                                    setManualOverrides(newOverrides)
                                    setActivePreset(null)
                                    setWriteStatus("writing")
                                    const themeWithOverrides = {
                                      ...theme,
                                      colors: { ...theme.colors, ...newOverrides },
                                    }
                                    writeCustomThemeFile(themeWithOverrides)
                                      .then(() => {
                                        setWriteStatus("success")
                                        setTimeout(() => setWriteStatus("idle"), 2000)
                                      })
                                      .catch(() => {
                                        setWriteStatus("error")
                                        setTimeout(() => setWriteStatus("idle"), 2000)
                                      })
                                  }}
                                  className={`w-8 h-6 rounded transition-all relative ${
                                    isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-[#1a1a1a] scale-110" : "hover:scale-105"
                                  }`}
                                  style={{ backgroundColor: seed.hex }}
                                  title={`${seed.name}: ${seed.hex} (${bestContrast.toFixed(1)}:1 ${wcagLevel})`}
                                >
                                  <div
                                    className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                                      bestContrast >= 7
                                        ? "bg-green-400"
                                        : bestContrast >= 4.5
                                          ? "bg-green-400"
                                          : bestContrast >= 3
                                            ? "bg-yellow-400"
                                            : "bg-red-400"
                                    }`}
                                  />
                                </button>
                              )
                            })}
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
                <h2 className="text-sm font-medium" style={{ color: theme.colors.foreground }}>Configuration</h2>
              </div>
              <div className="p-4 space-y-4">
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
                        color: theme.colors.foreground,
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
                        color: theme.colors.foreground,
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
                      style={{ accent: theme.colors.accent }}
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
                      style={{ accent: theme.colors.secondary }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] uppercase tracking-wide opacity-50">Contrast / Range</label>
                      <span className="text-xs font-mono opacity-60">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                      className="w-full"
                      style={{ accent: theme.colors.primary }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Randomizers */}
            <div className="bg-[#1a1a1a] rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <h2 className="text-sm font-medium" style={{ color: theme.colors.foreground }}>Randomizers</h2>
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
                <ThemePreview theme={useOpencodeMode ? opencodeTheme : theme.colors} />

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
                    <h2 className="text-sm font-semibold">{useOpencodeMode ? "9-Seed Palette" : "Generated Palette"}</h2>
                  </div>
                  <div className="p-4">
                    {useOpencodeMode ? (
                      <div className="grid grid-cols-3 gap-4">
                        {seeds9.map((seed, idx) => {
                          const variants = seedVariants[seed.name] || []
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
                                {variants.slice(0, 5).map((hex, vIdx) => (
                                  <button
                                    key={vIdx}
                                    onClick={() => handleCopy(hex)}
                                    className="w-6 h-6 rounded transition-transform hover:scale-110"
                                    style={{ backgroundColor: hex }}
                                    title={hex}
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      allVariants.map((av, idx) => (
                        <div key={idx} className="mb-6 last:mb-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-600"
                              style={{ backgroundColor: av.group.base.hex }}
                            />
                            <span className="text-sm font-medium capitalize">{av.group.base.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {av.variants.map((variant, vIdx) => (
                              <button
                                key={vIdx}
                                onClick={() => handleCopy(variant.hex)}
                                className="group relative w-10 h-10 rounded-lg transition-transform hover:scale-110 hover:z-10"
                                style={{ backgroundColor: variant.hex }}
                              >
                                <span
                                  className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] bg-gray-900 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ color: variant.hex }}
                                >
                                  {variant.hex}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <h2 className="text-sm font-semibold">Theme Colors</h2>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {Object.entries(useOpencodeMode ? opencodeTheme : theme.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800">
                        <div
                          className="w-10 h-10 rounded-lg border border-gray-600 flex-shrink-0"
                          style={{ backgroundColor: value }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium capitalize">{key}</div>
                          <div className="text-[10px] text-gray-400 font-mono truncate">{value}</div>
                        </div>
                        <button onClick={() => handleCopy(value)} className="p-1.5 hover:bg-gray-700 rounded transition-colors">
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
                    {exportFormats.map((format) => (
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

            <ThemePreview theme={useOpencodeMode ? opencodeTheme : theme.colors} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
