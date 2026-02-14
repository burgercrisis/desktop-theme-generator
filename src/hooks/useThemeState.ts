import { useState, useEffect, useCallback, useRef } from "react"
import { HSL, HarmonyRule, VariantStrategy, ColorSpace, OutputSpace } from "../types"

export const getInitialState = (key: string, defaultValue: any) => {
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

export const useThemeState = () => {
  const [baseColor, setBaseColor] = useState<HSL>(() => getInitialState("baseColor", { h: 280, s: 65, l: 15 }))
  const [harmony, setHarmony] = useState<HarmonyRule>(() => getInitialState("harmony", HarmonyRule.DOUBLE_SPLIT_COMPLEMENTARY))
  const [spread, setSpread] = useState(() => getInitialState("spread", 30))
  const [variantCount, setVariantCount] = useState(() => getInitialState("variantCount", 12))
  const [saturation, setSaturation] = useState(() => getInitialState("saturation", 50))
  const [lightBrightness, setLightBrightness] = useState(() => getInitialState("lightBrightness", 50))
  const [darkBrightness, setDarkBrightness] = useState(() => getInitialState("darkBrightness", 50))
  const [lightContrast, setLightContrast] = useState(() => getInitialState("lightContrast", 50))
  const [darkContrast, setDarkContrast] = useState(() => getInitialState("darkContrast", 50))
  const [contrastIntensity, setContrastIntensity] = useState(() => getInitialState("contrastIntensity", 50))
  const [activeMode, setActiveMode] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("activeMode")
    return (saved === "light" || saved === "dark") ? saved : "dark"
  })
  const [variantStrategy, setVariantStrategy] = useState<VariantStrategy>(() => getInitialState("variantStrategy", VariantStrategy.GLACIAL))
  const [colorSpace, setColorSpace] = useState<ColorSpace>(() => getInitialState("colorSpace", "HSL"))
  const [outputSpace, setOutputSpace] = useState<OutputSpace>(() => getInitialState("outputSpace", "sRGB"))
  const [useOpencodeMode, setUseOpencodeMode] = useState(() => getInitialState("useOpencodeMode", true))
  const [themeName, setThemeName] = useState("My Theme")
  const [activeTab, setActiveTab] = useState<"palette" | "export">("palette")
  const [matrixMode, setMatrixMode] = useState(() => getInitialState("matrixMode", false))
  const [matrixView, setMatrixView] = useState<"audit" | "mappings">("audit")
  const [manualOverrides, setManualOverrides] = useState<Record<string, Record<string, string>>>(() => getInitialState("manualOverrides", { light: {}, dark: {} }))
  const [seedOverrides, setSeedOverrides] = useState<Record<string, Record<string, string>>>(() => getInitialState("seedOverrides", { light: {}, dark: {} }))
  const [seedsInitialized, setSeedsInitialized] = useState(() => getInitialState("seedsInitialized", false))
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Track manual changes to prevent auto-sync from clobbering the file on boot
  const isManualChangeRef = useRef<boolean>(false)

  const handleManualOverride = useCallback((property: string, hex: string) => {
    console.log(`🎨 Manual Override: Setting ${property} to ${hex} for ${activeMode} mode`)
    isManualChangeRef.current = true;
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
    isManualChangeRef.current = true;
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
    isManualChangeRef.current = true;
  }, [])

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
    isManualChangeRef.current = true;
  }, [activeMode])

  const handleQuickOverride = useCallback((key: string, hex: string) => {
    console.log(`🎯 Quick Override: Setting ${key} to ${hex} for ${activeMode} mode`)
    isManualChangeRef.current = true;
    setManualOverrides(prev => ({
      ...prev,
      [activeMode]: {
        ...(prev[activeMode] || {}),
        [key]: hex
      }
    }))
  }, [activeMode])

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

  // Persistence effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const stateToSave = {
        baseColor, harmony, spread, variantCount, saturation,
        lightBrightness, darkBrightness, lightContrast, darkContrast,
        contrastIntensity,
        variantStrategy, colorSpace, outputSpace, useOpencodeMode,
        themeName, matrixMode, manualOverrides, seedOverrides, seedsInitialized
      }
      Object.entries(stateToSave).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch (e) {
          console.warn(`[useThemeState] Failed to save ${key} to localStorage:`, e)
        }
      })
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [
    baseColor, harmony, spread, variantCount, saturation,
    lightBrightness, darkBrightness, lightContrast, darkContrast,
    contrastIntensity,
    variantStrategy, colorSpace, outputSpace, useOpencodeMode,
    themeName, matrixMode, manualOverrides, seedOverrides, seedsInitialized
  ])

  return {
    baseColor, setBaseColor,
    harmony, setHarmony,
    spread, setSpread,
    variantCount, setVariantCount,
    saturation, setSaturation,
    lightBrightness, setLightBrightness,
    darkBrightness, setDarkBrightness,
    lightContrast, setLightContrast,
    darkContrast, setDarkContrast,
    contrastIntensity, setContrastIntensity,
    activeMode, setActiveMode,
    toggleMode,
    variantStrategy, setVariantStrategy,
    colorSpace, setColorSpace,
    outputSpace, setOutputSpace,
    useOpencodeMode, setUseOpencodeMode,
    themeName, setThemeName,
    activeTab, setActiveTab,
    matrixMode, setMatrixMode,
    matrixView, setMatrixView,
    manualOverrides, setManualOverrides,
    seedOverrides, setSeedOverrides,
    seedsInitialized, setSeedsInitialized,
    activePreset, setActivePreset,
    isManualChangeRef,
    handleManualOverride,
    handleManualReset,
    handleClearAll,
    handleResetMode,
    handleQuickOverride
  }
}
