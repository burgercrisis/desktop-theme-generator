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
  const colors: Record<string, string> = {}
  for (const [key, value] of Object.entries(theme.colors)) {
    if (typeof value === "string" && !key.startsWith("[")) {
      const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
      colors[kebab] = value
    }
  }
  return `module.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colors, null, 6)}\n    }\n  }\n}`
}

export const exportToOpencode9SeedJSON = (name: string, colors: OpencodeThemeColors, seeds: SeedColor[]): string => {
  const seedMap: Record<string, string> = {}
  seeds.forEach(s => {
    seedMap[s.name] = s.hex
  })

  const json = {
    $schema: "https://opencode.ai/desktop-theme.json",
    name,
    id: name.toLowerCase().replace(/\s+/g, "-"),
    light: {
      seeds: seedMap,
      overrides: colors
    },
    dark: {
      seeds: seedMap,
      overrides: colors
    }
  }
  return JSON.stringify(json, null, 2)
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
