import { Plugin } from "vite"
import * as fs from "fs"
import * as path from "path"

const THEME_WRITE_ENDPOINT = "/api/write-theme"
const THEME_CSS_WRITE_ENDPOINT = "/api/write-theme-css"

export interface ThemeWriteOptions {
  // Target directory for theme files (absolute path)
  themeDir: string
  // Custom theme filename
  filename: string
}

export const themeWritePlugin = (options: ThemeWriteOptions): Plugin => {
  const { themeDir, filename } = options

  return {
    name: "vite-plugin-theme-write",

    configureServer(server: any) {
      // Simple test endpoint
      server.middlewares.use("/api/test", (req: any, res: any, next: any) => {
        if (req.method === "GET") {
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          })
          res.end(JSON.stringify({ success: true, message: "API is working!" }))
        } else {
          next()
        }
      })

      // Handle CORS preflight for CSS endpoint
      server.middlewares.use("/api/write-theme-css", (req: any, res: any, next: any) => {
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
        next()
      })

      // Handle POST requests to write CSS theme file (selective overrides)
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.method === "POST" && req.url === THEME_CSS_WRITE_ENDPOINT) {
          console.log("[Theme Write Plugin] Processing CSS theme write request")
          let body = ""
          req.on("data", (chunk: Buffer) => {
            body += chunk.toString()
          })
          req.on("end", async () => {
            try {
              // Body is CSS content, not JSON
              console.log("[Theme Write Plugin] Writing CSS theme")
              console.log("[Theme Write Plugin] Theme dir:", themeDir)
              console.log("[Theme Write Plugin] Filename:", filename)
              console.log("[Theme Write Plugin] CSS content length:", body.length)

              // Ensure theme directory exists
              const dirExists = fs.existsSync(themeDir)
              console.log("[Theme Write Plugin] Directory exists:", dirExists)

              if (!dirExists) {
                console.log("[Theme Write Plugin] Creating directory:", themeDir)
                fs.mkdirSync(themeDir, { recursive: true })
              }

              // Write CSS theme file
              const filePath = path.join(themeDir, filename)
              console.log("[Theme Write Plugin] Full file path:", filePath)
              console.log("[Theme Write Plugin] File exists before write:", fs.existsSync(filePath))

              fs.writeFileSync(filePath, body)

              console.log("[Theme Write Plugin] File written successfully")
              console.log("[Theme Write Plugin] File exists after write:", fs.existsSync(filePath))
              console.log("[Theme Write Plugin] File size:", fs.statSync(filePath).size)

              // Read back file to verify
              const writtenContent = fs.readFileSync(filePath, "utf-8")
              console.log("[Theme Write Plugin] Verification read length:", writtenContent.length)
              console.log("[Theme Write Plugin] First 100 chars:", writtenContent.substring(0, 100))

              console.log(`[Theme Write] CSS theme written to ${filePath}`)

              res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
              })
              res.end(JSON.stringify({ success: true, path: filePath }))
            } catch (error: any) {
              console.error("[Theme Write Plugin] ERROR DETAILS:")
              console.error("[Theme Write Plugin] Error message:", error.message)
              console.error("[Theme Write Plugin] Error stack:", error.stack)
              console.error("[Theme Write Plugin] Error name:", error.name)
              res.writeHead(500, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              })
              res.end(JSON.stringify({ success: false, error: error.message }))
            }
          })
        } else {
          next()
        }
      })

      // Handle POST requests to write JSON theme file (legacy)
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.method === "OPTIONS" && req.url === THEME_WRITE_ENDPOINT) {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
          })
          res.end()
          return
        }

        if (req.method === "POST" && req.url === THEME_WRITE_ENDPOINT) {
          console.log("[Theme Write Plugin] Processing JSON theme write request")
          let body = ""
          req.on("data", (chunk: Buffer) => {
            body += chunk.toString()
          })
          req.on("end", async () => {
            try {
              const data = JSON.parse(body)
              const { json, themeName } = data
              console.log("[Theme Write Plugin] Writing JSON theme:", themeName)
              console.log("[Theme Write Plugin] Theme dir:", themeDir)
              console.log("[Theme Write Plugin] Filename:", filename)

              // Ensure theme directory exists
              const dirExists = fs.existsSync(themeDir)
              console.log("[Theme Write Plugin] Directory exists:", dirExists)

              if (!dirExists) {
                console.log("[Theme Write Plugin] Creating directory:", themeDir)
                fs.mkdirSync(themeDir, { recursive: true })
              }

              // Write theme file as JSON
              const filePath = path.join(themeDir, filename)
              console.log("[Theme Write Plugin] Full file path:", filePath)
              console.log("[Theme Write Plugin] File exists before write:", fs.existsSync(filePath))
              console.log("[Theme Write Plugin] JSON content length:", JSON.stringify(json, null, 2).length)

              fs.writeFileSync(filePath, JSON.stringify(json, null, 2))

              console.log("[Theme Write Plugin] File written successfully")
              console.log("[Theme Write Plugin] File exists after write:", fs.existsSync(filePath))
              console.log("[Theme Write Plugin] File size:", fs.statSync(filePath).size)

              // Read back file to verify
              const writtenContent = fs.readFileSync(filePath, "utf-8")
              console.log("[Theme Write Plugin] Verification read length:", writtenContent.length)
              console.log("[Theme Write Plugin] First 100 chars of written file:", writtenContent.substring(0, 100))

              console.log(`[Theme Write] Theme "${themeName}" written to ${filePath}`)

              res.writeHead(200, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
              })
              res.end(JSON.stringify({ success: true, path: filePath }))
            } catch (error: any) {
              console.error("[Theme Write Plugin] ERROR DETAILS:")
              console.error("[Theme Write Plugin] Error message:", error.message)
              console.error("[Theme Write Plugin] Error stack:", error.stack)
              console.error("[Theme Write Plugin] Error name:", error.name)
              res.writeHead(500, {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              })
              res.end(JSON.stringify({ success: false, error: error.message }))
            }
          })
        } else {
          next()
        }
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
