import React, { useState, useMemo, useCallback, useDeferredValue, useEffect } from "react"
import ColorWheel from "./components/ColorWheel"
import ThemePreview from "./components/ThemePreview"
import { MatrixTokenRow } from "./components/MatrixTokenRow"
import { MATRIX_PROPERTIES } from "./config/matrixProperties"
import { useThemeState } from "./hooks/useThemeState"
import { useThemeEngine } from "./hooks/useThemeEngine"
import { useWcagAudit } from "./hooks/useWcagAudit"
import { useThemeSync } from "./hooks/useThemeSync"
import { getClosestPassingColor, getThresholdLabel, getClosestHuePassingColor } from "./utils/colorUtils"
import {
  harmonyOptions,
  variantStrategyOptions,
  thematicPresets,
} from "./utils/harmonies"
import { opencodePresets, OpencodePreset } from "./utils/themePresets"
import {
  exportToCSS,
  exportToJSON,
  exportToTailwind,
  exportToSCSS,
  exportToOpencode9SeedJSON,
  downloadFile,
  exportFormats,
} from "./utils/exportUtils"
import { 
  DesktopTheme, 
  InternalThemeColors,
  OpencodeThemeColors,
  HarmonyRule,
  VariantStrategy,
  HSL,
  ColorSpace,
  OutputSpace,
  SeedColor,
  ColorStop,
} from "./types"
import "./App.css"

const App: React.FC = () => {
  const themeState = useThemeState();
  const {
    baseColor, setBaseColor,
    harmony, setHarmony,
    spread, setSpread,
    variantCount, setVariantCount,
    saturation, setSaturation,
    lightBrightness, setLightBrightness,
    darkBrightness, setDarkBrightness,
    lightContrast, setLightContrast,
    darkContrast, setDarkContrast,
    activeMode,
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
    isManualChangeRef
  } = themeState;

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

  const {
    initializeSeeds,
    onEngineParamChange,
    seeds9,
    lightSeeds9,
    darkSeeds9,
    activeVariantsMap,
    themeColors,
    baseThemeColors,
    paletteGroups,
    seedVariantsLight,
    seedVariantsDark,
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
  } = useThemeEngine({
    baseColor: deferredBaseColor,
    setBaseColor,
    harmony: deferredHarmony,
    setHarmony,
    spread: deferredSpread,
    setSpread,
    variantCount: deferredVariantCount,
    setVariantCount,
    setSaturation,
    lightBrightness: deferredLightBrightness,
    setLightBrightness,
    darkBrightness: deferredDarkBrightness,
    setDarkBrightness,
    lightContrast: deferredLightContrast,
    setLightContrast,
    darkContrast: deferredDarkContrast,
    setDarkContrast,
    variantStrategy: deferredVariantStrategy,
    setVariantStrategy,
    colorSpace,
    outputSpace,
    useOpencodeMode,
    activeMode,
    manualOverrides: deferredManualOverrides,
    setManualOverrides,
    seedOverrides,
    setSeedOverrides,
    seedsInitialized,
    setSeedsInitialized,
    isManualChangeRef,
    setActivePreset,
  });

  const {
    handleManualOverride,
    handleManualReset,
    handleClearAll,
    handleResetMode,
    handleQuickOverride,
  } = themeState;

  const { wcagPairs, formatAgentLabel, passCount, failCount } = useWcagAudit({ themeColors });
  const deferredWcagPairs = useDeferredValue(wcagPairs);

  const { writeStatus, writeError, fileLoaded } = useThemeSync({
    themeName,
    setThemeName,
    lightSeeds9,
    darkSeeds9,
    themeColors,
    manualOverrides,
    setManualOverrides,
    setSeedOverrides,
    useOpencodeMode,
    setSeedsInitialized,
    isManualChangeRef,
  });

  const [quickPicker, setQuickPicker] = useState<{ x: number, y: number, key: string, label: string } | null>(null)
  
  // Desktop theme object for export/preview
  const theme = useMemo<DesktopTheme>(() => {
    return {
      name: themeName,
      colors: themeColors as InternalThemeColors,
      palette: Object.values(activeVariantsMap).flat(),
    }
  }, [themeName, themeColors, activeVariantsMap])

  const handleCopy = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex)
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
        const content = exportToOpencode9SeedJSON(themeName, lightSeeds9, darkSeeds9, manualOverrides)
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
    [theme, themeName, lightSeeds9, darkSeeds9, manualOverrides],
  )

  // Trigger initial seeds ONLY ONCE if not already initialized AND file sync has finished its first load
  useEffect(() => {
    if (fileLoaded && !seedsInitialized) {
      initializeSeeds();
    }
  }, [fileLoaded, seedsInitialized, initializeSeeds]);


  const handleInitialize = useCallback(() => {
    initializeSeeds();
    setMatrixMode(true);
    setMatrixView("audit");
    setActiveTab("palette");
  }, [initializeSeeds, setMatrixMode, setMatrixView, setActiveTab]);

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

      {/* Discovery View - Full Screen Modal Style Removed as per user request */}


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
          {failCount > 0 && (
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all animate-pulse cursor-pointer ${
                activeMode === 'light' 
                  ? 'bg-red-50 border-red-200 text-red-600' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
              onClick={() => {
                setMatrixMode(true);
                setActiveTab("palette");
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{failCount} CONTRAST_FAILS</span>
            </div>
          )}
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
                    onClick={() => handleAnalyzeSeeds(seeds9)}
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
                    onClick={handleInitialize}
                    className={`text-[9px] font-black px-3 py-1 rounded transition-all uppercase tracking-widest border ${
                      matrixMode && matrixView === "audit"
                        ? "bg-purple-500/20 text-purple-600 border-purple-500/40" 
                        : activeMode === 'light'
                          ? "bg-gray-100 text-gray-400 border-gray-200 hover:border-purple-300"
                          : "bg-black/40 text-purple-900 border-purple-900/20 hover:border-purple-800"
                    }`}
                  >
                    {matrixMode && matrixView === "audit" ? "AUDIT_ACTIVE" : "INITIALIZE"}
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

                  <div className="flex p-1 border rounded-md mb-4 transition-colors">
                    <button
                      onClick={() => setMatrixView("audit")}
                      className={`flex-1 px-4 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded ${
                        matrixView === "audit" 
                          ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]" 
                          : activeMode === 'light' ? "text-purple-500/60 hover:text-purple-600" : "text-purple-500/60 hover:text-purple-400"
                      }`}
                    >
                      WCAG_AUDIT
                    </button>
                    <button
                      onClick={() => setMatrixView("mappings")}
                      className={`flex-1 px-4 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded ${
                        matrixView === "mappings" 
                          ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]" 
                          : activeMode === 'light' ? "text-cyan-600/60 hover:text-cyan-600" : "text-cyan-400/60 hover:text-cyan-400"
                      }`}
                    >
                      MAPPINGS
                    </button>
                  </div>

                  {matrixView === "audit" && (
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
                        {Array.from(new Set(deferredWcagPairs.map(p => p.category))).map(category => (
                          <div key={category} className={`border-b last:border-b-0 transition-colors ${activeMode === 'light' ? 'border-gray-100' : 'border-[#1a1a2e]'}`}>
                            <div className={`px-3 py-1.5 flex items-center justify-between sticky top-0 z-10 transition-colors ${activeMode === 'light' ? 'bg-gray-50/95 border-b border-gray-100' : 'bg-[#161625] border-b border-[#1a1a2e]'}`}>
                              <h3 className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${activeMode === 'light' ? 'text-purple-900' : 'text-purple-400/80'}`}>
                                <span className="opacity-40">#</span> {category}
                              </h3>
                              <span className={`text-[8px] font-mono transition-colors ${activeMode === 'light' ? 'text-purple-600/50' : 'text-purple-500/50'}`}>
                                {deferredWcagPairs.filter(p => p.category === category).length} ENTRIES
                              </span>
                            </div>
                            
                            <div className={`divide-y transition-colors ${activeMode === 'light' ? 'divide-gray-50' : 'divide-[#1a1a2e]'}`}>
                              {deferredWcagPairs.filter(p => p.category === category).map(pair => {
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
                                                  const fixed = getClosestPassingColor(pair.fg, pair.bg, pair.isNonText, pair.isBorder, pair.isWeak, pair.isStrong, pair.category);
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
                                                  const fixed = getClosestPassingColor(pair.bg, pair.fg, pair.isNonText, pair.isBorder, pair.isWeak, pair.isStrong, pair.category);
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
                                                  const fixed = getClosestHuePassingColor(pair.fg, pair.bg, pair.isNonText, pair.isBorder, pair.isWeak, pair.isStrong, pair.category);
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
                                                  const fixed = getClosestHuePassingColor(pair.bg, pair.fg, pair.isNonText, pair.isBorder, pair.isWeak, pair.isStrong, pair.category);
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
                )}

                  {matrixView === "mappings" && (
                    <div className={`mb-4 rounded-lg border overflow-hidden transition-colors ${activeMode === 'light' ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#0d0d17] border-[#2d2d4d]'}`}>
                      <div className={`flex items-center justify-between px-3 py-2 border-b transition-colors ${activeMode === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#1a1a2e] border-[#2d2d4d]'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${activeMode === 'light' ? 'text-cyan-900' : 'text-cyan-300'}`}>
                            COLOR_DERIVATION_INVENTORY
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono transition-colors ${activeMode === 'light' ? 'text-cyan-600/70' : 'text-cyan-400/70'}`}>
                          {Object.keys(themeColors).length} TOKENS_MAPPED
                        </span>
                      </div>
                      <div className={`max-h-[500px] overflow-y-auto custom-scrollbar transition-colors ${activeMode === 'light' ? 'bg-white' : 'bg-[#0d0d17]'}`}>
                        <table className="w-full text-left border-collapse">
                          <thead className={`sticky top-0 z-10 transition-colors ${activeMode === 'light' ? 'bg-gray-50' : 'bg-[#161625]'}`}>
                            <tr>
                              <th className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>TOKEN</th>
                              <th className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>SOURCE</th>
                              <th className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>VALUE</th>
                              <th className={`px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${activeMode === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>SEED_FALLBACK</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y transition-colors ${activeMode === 'light' ? 'divide-gray-50' : 'divide-[#1a1a2e]'}`}>
                            {Object.entries(themeColors).map(([key, value]) => {
                              const override = manualOverrides[activeMode]?.[key];
                              const isOverride = override && override !== "unassigned";
                              const fallback = baseThemeColors[key as keyof OpencodeThemeColors];
                              const isFallbackActive = !isOverride;

                              return (
                                <tr key={key} className="hover:bg-purple-500/5 transition-colors group">
                                  <td className="px-3 py-2">
                                    <span className={`text-[10px] font-mono transition-colors ${activeMode === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                                      {key}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded transition-colors ${
                                      isOverride 
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    }`}>
                                      {isOverride ? 'MANUAL_OVERRIDE' : 'SEEDED_FALLBACK'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-sm border border-white/10" style={{ backgroundColor: value }} />
                                      <span className={`text-[10px] font-mono transition-colors ${isOverride ? 'text-purple-400' : (activeMode === 'light' ? 'text-gray-600' : 'text-gray-400')}`}>
                                        {value.toUpperCase()}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                      <div className="w-3 h-3 rounded-sm border border-white/10" style={{ backgroundColor: fallback }} />
                                      <span className={`text-[10px] font-mono transition-colors ${isFallbackActive ? 'text-cyan-400 font-bold' : (activeMode === 'light' ? 'text-gray-400' : 'text-gray-500')}`}>
                                        {fallback?.toUpperCase()}
                                      </span>
                                      {isFallbackActive && <span className="text-[8px] font-black text-cyan-500/60">ACTIVE</span>}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

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
                      onChange={(e) => onEngineParamChange(setHarmony, e.target.value as HarmonyRule)}
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
                      onChange={(e) => onEngineParamChange(setVariantStrategy, e.target.value as VariantStrategy)}
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
                          if (activeMode === "light") onEngineParamChange(setLightBrightness, val, false)
                          else onEngineParamChange(setDarkBrightness, val, false)
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
                          if (activeMode === "light") onEngineParamChange(setLightContrast, val, false)
                          else onEngineParamChange(setDarkContrast, val, false)
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
                          onEngineParamChange(setSaturation, val, false)
                          onEngineParamChange(setBaseColor, (prev: HSL) => ({ ...prev, s: val }), false)
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
                        onChange={(e) => onEngineParamChange(setSpread, parseInt(e.target.value))}
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
                        onChange={(e) => onEngineParamChange(setVariantCount, parseInt(e.target.value), false)}
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
                      {Object.values(opencodePresets).map((preset: OpencodePreset) => (
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
                              {variants.map((stop: ColorStop, vIdx: number) => (
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
                          onClick={() => {
                            handleQuickOverride(quickPicker.key, v.hex)
                            setQuickPicker(null)
                          }}
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
                    onChange={(e) => {
                      handleQuickOverride(quickPicker.key, e.target.value)
                      setQuickPicker(null)
                    }}
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
