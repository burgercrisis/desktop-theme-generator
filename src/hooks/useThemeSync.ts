import { useState, useEffect, useRef } from "react"
import { SeedColor, OpencodeThemeColors } from "../types"
import { hexToHsl } from "../utils/colorUtils"
import { exportToOpencode9SeedJSON, writeOpencode9ThemeFile } from "../utils/exportUtils"

interface UseThemeSyncProps {
  themeName: string
  setThemeName: (name: string) => void
  lightSeeds9: SeedColor[]
  darkSeeds9: SeedColor[]
  themeColors: OpencodeThemeColors
  manualOverrides: Record<string, Record<string, string>>
  setManualOverrides: (overrides: any) => void
  setSeedOverrides: (overrides: any) => void
  useOpencodeMode: boolean
  setSeedsInitialized: (initialized: boolean) => void
  isManualChangeRef: React.MutableRefObject<boolean>
}

export const useThemeSync = ({
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
}: UseThemeSyncProps) => {
  const [writeStatus, setWriteStatus] = useState<"idle" | "writing" | "success" | "error">("idle")
  const [writeError, setWriteError] = useState<string | null>(null)
  const [fileLoaded, setFileLoaded] = useState(false)
  
  const lastWrittenRef = useRef<string>("")
  const isWritingRef = useRef<boolean>(false)

  // Load theme from /api/read-theme if it exists
  useEffect(() => {
    const loadCustomTheme = async () => {
      try {
        const response = await fetch("/api/read-theme");
        if (response.ok) {
          const themeData = await response.json();
          console.log("🎨 Loaded theme from /api/read-theme:", themeData);
          
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

          setSeedsInitialized(true);
          setFileLoaded(true);

          // After states are set, capture the serialized content to prevent immediate re-sync
          // This must happen in the next tick so the useMemo's have recalculated from the new state
          setTimeout(() => {
            const seedNames = ["primary", "neutral", "interactive", "success", "warning", "error", "info", "diffAdd", "diffDelete"];
            
            const stableLightSeeds = themeData.light?.seeds 
              ? seedNames.map(name => ({ name, hex: themeData.light.seeds[name] || "#000000", hsl: hexToHsl(themeData.light.seeds[name] || "#000000") }))
              : lightSeeds9;
              
            const stableDarkSeeds = themeData.dark?.seeds 
              ? seedNames.map(name => ({ name, hex: themeData.dark.seeds[name] || "#000000", hsl: hexToHsl(themeData.dark.seeds[name] || "#000000") }))
              : darkSeeds9;

            const currentContent = exportToOpencode9SeedJSON(
              themeData.name || themeName,
              stableLightSeeds,
              stableDarkSeeds,
              {
                light: themeData.light?.overrides || {},
                dark: themeData.dark?.overrides || {}
              }
            );
            lastWrittenRef.current = currentContent;
            console.log("💾 lastWrittenRef initialized from file load (Stable Order).");
          }, 0);
        } else {
          // If no file, consider it "loaded" (empty) so sync can start
          setFileLoaded(true);
        }
      } catch (err) {
        console.warn("⚠️ Could not load theme from API:", err);
        setFileLoaded(true);
      }
    };
    
    loadCustomTheme();
  }, []); // Run ONCE on mount

  // Write to Opencode when manualOverrides, seeds, colors, or strategy change
  useEffect(() => {
    // "Instant" feel: 200ms debounce
    const timer = setTimeout(() => {
      if (isWritingRef.current || !useOpencodeMode || !fileLoaded) return

      const currentContent = exportToOpencode9SeedJSON(
        themeName, 
        lightSeeds9, 
        darkSeeds9,
        manualOverrides
      )
      
      // CRITICAL: If content is same as what we know is on disk, STOP.
      if (currentContent === lastWrittenRef.current) {
        return
      }

      // ONLY SYNC IF A MANUAL CHANGE OCCURRED
      if (!isManualChangeRef.current) {
        console.log("💾 AUTO_SYNC: Skipping write - Content differs but no manual change detected (probably background recalculation).")
        return
      }

      setWriteStatus("writing")
      isWritingRef.current = true
      
      console.log("💾 AUTO_SYNC: Writing manual changes to file...")
      
      writeOpencode9ThemeFile(
        themeName, 
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
            isManualChangeRef.current = false; // RESET FLAG AFTER SUCCESSFUL SYNC
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
  }, [themeName, themeColors, lightSeeds9, darkSeeds9, manualOverrides, useOpencodeMode, fileLoaded])

  return {
    writeStatus,
    writeError,
    fileLoaded
  }
}
