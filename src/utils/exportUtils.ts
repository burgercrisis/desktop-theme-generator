import { DesktopTheme, OpencodeThemeColors, SeedColor } from "../types"

export interface OpencodeThemeJSON {
  $schema: string
  name: string
  id: string
  light: {
    seeds: Record<string, string>
    overrides: Record<string, string>
  }
  dark: {
    seeds: Record<string, string>
    overrides: Record<string, string>
  }
}

export const exportFormats = [
  { id: "css", name: "CSS Variables", ext: ".css", mime: "text/css" },
  { id: "json", name: "JSON", ext: ".json", mime: "application/json" },
  { id: "tailwind", name: "Tailwind Config", ext: ".js", mime: "text/javascript" },
  { id: "scss", name: "SCSS Variables", ext: ".scss", mime: "text/x-scss" },
  { id: "opencode9", name: "Opencode (9-Seed)", ext: ".json", mime: "application/json" },
]

export const exportToCSS = (theme: DesktopTheme): string => {
  let css = ":root {\n"
  for (const [key, value] of Object.entries(theme.colors)) {
    if (typeof value === "string" && !key.startsWith("[")) {
      const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
      css += `  --${kebab}: ${value};\n`
    }
  }
  css += "}"
  return css
}

export const exportToJSON = (theme: DesktopTheme): string => {
  return JSON.stringify(theme, null, 2)
}

export const exportToSCSS = (theme: DesktopTheme): string => {
  let scss = ""
  for (const [key, value] of Object.entries(theme.colors)) {
    if (typeof value === "string" && !key.startsWith("[")) {
      const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
      scss += `$${kebab}: ${value};\n`
    }
  }
  return scss
}

export const exportToTailwind = (theme: DesktopTheme): string => {
  const tailwindColors: Record<string, string> = {}
  for (const [key, value] of Object.entries(theme.colors)) {
    if (typeof value === "string" && !key.startsWith("[")) {
      const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
      tailwindColors[kebab] = value
    }
  }
  return `module.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(tailwindColors, null, 6)}\n    }\n  }\n}`
}

export const exportToOpencode9SeedJSON = (
  name: string,
  lightColors: OpencodeThemeColors,
  darkColors: OpencodeThemeColors,
  lightSeeds: SeedColor[],
  darkSeeds: SeedColor[],
  manualOverrides: Record<string, Record<string, string>> = { light: {}, dark: {} }
): string => {
  console.group(`🎨 Opencode 9-Seed Export: ${name}`)
  
  const getSeedMap = (seeds: SeedColor[], mode: string) => {
    const seedMap: Record<string, string> = {}
    
    // Required keys for Opencode ThemeSeedColors
    const requiredSeeds = [
      'neutral', 'primary', 'success', 'warning', 'error', 
      'info', 'interactive', 'diffAdd', 'diffDelete'
    ]

    console.log(`🌱 Generating seeds for ${mode} mode...`)
    seeds.forEach(s => {
      const targetName = s.name as string
      if (targetName === 'critical') {
        seedMap['diffDelete'] = s.hex
        if (!seedMap['error']) seedMap['error'] = s.hex
      } else if (targetName === 'accent') {
        seedMap['diffAdd'] = s.hex
      } else {
        seedMap[targetName] = s.hex
      }
    })

    // Ensure all required seeds have a value (fallback to neutral if missing)
    const neutralHex = seedMap['neutral'] || '#888888'
    requiredSeeds.forEach(key => {
      if (!seedMap[key]) {
        seedMap[key] = neutralHex
        console.warn(`⚠️ Seed "${key}" missing for ${mode}, falling back to neutral: ${neutralHex}`)
      }
    })

    console.table(Object.entries(seedMap).map(([name, hex]) => ({ Seed: name, Hex: hex })))
    return seedMap
  }

  const lightSeedMap = getSeedMap(lightSeeds, 'light')
  const darkSeedMap = getSeedMap(darkSeeds, 'dark')

  // Include all calculated engine colors as the baseline, then apply manual overrides
  const lightOverrides: Record<string, string> = { ...lightColors, ...(manualOverrides.light || {}) }
  const darkOverrides: Record<string, string> = { ...darkColors, ...(manualOverrides.dark || {}) }

  const lightOverrideCount = Object.keys(manualOverrides.light || {}).length
  const darkOverrideCount = Object.keys(manualOverrides.dark || {}).length
  
  if (lightOverrideCount > 0) console.log(`🔧 Applied ${lightOverrideCount} manual overrides for light mode`)
  if (darkOverrideCount > 0) console.log(`🔧 Applied ${darkOverrideCount} manual overrides for dark mode`)

  const opencodeTheme: OpencodeThemeJSON = {
    $schema: "https://raw.githubusercontent.com/opencode/opencode-desktop/main/schemas/theme.schema.json",
    name: name,
    id: name.toLowerCase().replace(/\s+/g, '-'),
    light: {
      seeds: lightSeedMap,
      overrides: lightOverrides
    },
    dark: {
      seeds: darkSeedMap,
      overrides: darkOverrides
    }
  }

  console.groupEnd()
  return JSON.stringify(opencodeTheme, null, 2)
}

/**
 * Write custom theme file to Opencode as JSON (9-Seed Mode)
 */
export const writeOpencode9ThemeFile = async (
  name: string,
  lightColors: OpencodeThemeColors,
  darkColors: OpencodeThemeColors,
  lightSeeds: SeedColor[],
  darkSeeds: SeedColor[],
  overrides: Record<string, Record<string, string>>
): Promise<{ success: boolean; error?: string }> => {
  const jsonContent = exportToOpencode9SeedJSON(name, lightColors, darkColors, lightSeeds, darkSeeds, overrides)
  const json = JSON.parse(jsonContent)

  console.log(`📤 Syncing theme "${name}" to Opencode API...`)

  const apiUrls = [
    "http://127.0.0.1:3032/api/write-theme",
    "/api/write-theme",
    "http://localhost:3032/api/write-theme",
  ]

  let lastError = null

  for (const apiUrl of apiUrls) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json,
          themeName: name,
        }),
      })

      if (response.ok) {
        console.log(`✅ Successfully synced to ${apiUrl}`)
        return { success: true }
      }
    } catch (error: any) {
      lastError = error
    }
  }

  console.error(`❌ Sync failed. Last error: ${lastError?.message || "Unknown error"}`)
  return { success: false, error: lastError?.message || "Failed to write theme file" }
}

/**
 * Export DesktopTheme to Opencode JSON format
 */
export const exportToOpencodeJSON = (theme: DesktopTheme): OpencodeThemeJSON => {
  return {
    $schema: "https://opencode.ai/desktop-theme.json",
    name: theme.name,
    id: "custom",
    light: {
      seeds: {
        neutral: theme.colors.foreground,
        primary: theme.colors.primary,
        success: theme.colors.success,
        warning: theme.colors.warning,
        error: theme.colors.critical,
        info: theme.colors.info,
        interactive: theme.colors.primary,
        diffAdd: theme.colors.diffAddBackground,
        diffDelete: theme.colors.diffRemoveBackground,
      },
      overrides: {},
    },
    dark: {
      seeds: {
        neutral: theme.colors.foreground,
        primary: theme.colors.primary,
        success: theme.colors.success,
        warning: theme.colors.warning,
        error: theme.colors.critical,
        info: theme.colors.info,
        interactive: theme.colors.primary,
        diffAdd: theme.colors.diffAddBackground,
        diffDelete: theme.colors.diffRemoveBackground,
      },
      overrides: {},
    },
  }
}

/**
 * Write custom theme file to Opencode as JSON
 */
export const writeCustomThemeFile = async (
  theme: DesktopTheme,
): Promise<{ success: boolean; error?: string }> => {
  const json = exportToOpencodeJSON(theme)

  const apiUrls = [
    "/api/write-theme",
    "http://localhost:3032/api/write-theme",
    "http://127.0.0.1:3032/api/write-theme",
  ]

  let lastError = null

  for (const apiUrl of apiUrls) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json,
          themeName: theme.name,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[writeCustomThemeFile] Success:", result)
        return { success: true }
      }
    } catch (error: any) {
      lastError = error
    }
  }

  return { success: false, error: lastError?.message || "Failed to write theme file" }
}

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
