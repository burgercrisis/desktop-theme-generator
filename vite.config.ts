import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { themeWritePlugin } from "./src/utils/themeWritePlugin"
import * as path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve the Opencode desktop public directory path
// From desktop-theme-generator, go up to opencode/packages/app/public
const opencodePublicPath = path.resolve(__dirname, "../opencode/packages/app/public")

export default defineConfig({
  plugins: [
    react(),
    themeWritePlugin({
      themeDir: opencodePublicPath,
      filename: "custom-theme.json",
    }),
  ],
  server: {
    port: 3032,
    host: "0.0.0.0",
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 3033,
    },
  },
})
