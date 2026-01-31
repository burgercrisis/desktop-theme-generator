import { DesktopTheme } from "../types"

export interface OpencodeThemeJSON {
  $schema: string
  name: string
  id: string
  light: {
    seeds: {
      neutral: string
      primary: string
      success: string
      warning: string
      error: string
      info: string
      interactive: string
      diffAdd: string
      diffDelete: string
    }
    overrides: Record<string, string>
  }
  dark: {
    seeds: {
      neutral: string
      primary: string
      success: string
      warning: string
      error: string
      info: string
      interactive: string
      diffAdd: string
      diffDelete: string
    }
    overrides: Record<string, string>
  }
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
  const jsonString = JSON.stringify(json, null, 2)

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
