import { Plugin } from "vite"
import * as fs from "fs"
import * as path from "path"

const THEME_WRITE_ENDPOINT = "/api/write-theme"
const THEME_CSS_WRITE_ENDPOINT = "/api/write-theme-css"

export interface ThemeWriteOptions {
  // Target directories for theme files (absolute paths)
  themeDirs: string[]
  // Custom theme filename
  filename: string
}

export const themeWritePlugin = (options: ThemeWriteOptions): Plugin => {
  const { themeDirs, filename } = options

  return {
    name: "vite-plugin-theme-write",

    configureServer(server) {
      // Use a custom middleware that runs before Vite's internal ones
      server.middlewares.use((req: any, res: any, next: any) => {
        const fullUrl = req.url || ""
        const url = fullUrl.split("?")[0]

        // 1. Handle /api/test
        if (url === "/api/test" || url === "/api/test/") {
          if (req.method === "GET") {
            res.writeHead(200, {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            })
            res.end(JSON.stringify({ success: true, message: "API is working!" }))
            return
          }
        }

        // 2. Handle /api/write-theme-css
        if (url === THEME_CSS_WRITE_ENDPOINT || url === THEME_CSS_WRITE_ENDPOINT + "/") {
          if (req.method === "OPTIONS") {
            res.writeHead(204, {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Max-Age": "86400",
            })
            res.end()
            return
          }

          if (req.method === "POST") {
            let body = ""
            req.on("data", (chunk: any) => { body += chunk.toString() })
            req.on("end", () => {
              try {
                for (const themeDir of themeDirs) {
                  if (!fs.existsSync(themeDir)) fs.mkdirSync(themeDir, { recursive: true })
                  fs.writeFileSync(path.join(themeDir, filename), body)
                }
                res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
                res.end(JSON.stringify({ success: true, count: themeDirs.length }))
              } catch (err: any) {
                res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
                res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          }
        }

        // 3. Handle /api/write-theme (JSON)
        if (url === THEME_WRITE_ENDPOINT || url === THEME_WRITE_ENDPOINT + "/") {
          if (req.method === "OPTIONS") {
            res.writeHead(204, {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Max-Age": "86400",
            })
            res.end()
            return
          }

          if (req.method === "POST") {
            let body = ""
            req.on("data", (chunk: any) => { body += chunk.toString() })
            req.on("end", () => {
              try {
                const data = JSON.parse(body)
                const { json } = data
                for (const themeDir of themeDirs) {
                  if (!fs.existsSync(themeDir)) fs.mkdirSync(themeDir, { recursive: true })
                  fs.writeFileSync(path.join(themeDir, filename), JSON.stringify(json, null, 2))
                }
                res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
                res.end(JSON.stringify({ success: true, count: themeDirs.length }))
              } catch (err: any) {
                res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
                res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          }
        }

        next()
      })
    },
  }
}

// Helper function to get theme file path
export const getThemeFilePath = (themeDir: string, filename: string): string => {
  return path.join(themeDir, filename)
}

// Helper function to read current theme file
export const readThemeFile = (themeDir: string, filename: string): string | null => {
  const filePath = path.join(themeDir, filename)
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf-8")
  }
  return null
}

// Helper function to check if theme directory is writable
export const isThemeDirWritable = (themeDir: string): boolean => {
  try {
    if (!fs.existsSync(themeDir)) {
      // Try to create directory
      fs.mkdirSync(themeDir, { recursive: true })
    }
    // Try to write a test file
    const testFile = path.join(themeDir, ".write-test")
    fs.writeFileSync(testFile, "test")
    fs.unlinkSync(testFile)
    return true
  } catch {
    return false
  }
}
