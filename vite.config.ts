import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { themeWritePlugin } from "./src/utils/themeWritePlugin"
import * as path from "path" // Modified to trigger restart
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve the Opencode desktop public directory path
// From desktop-theme-generator, go up to opencode/packages/app/public
const opencodeThemesPath = path.resolve(__dirname, "../opencode/packages/ui/src/theme/themes")

export default defineConfig({
  plugins: [
    react(),
    themeWritePlugin({
      themeDirs: [opencodeThemesPath],
      filename: "custom-theme.json",
    }),
  ],
  server: {
    port: 3040,
    host: true,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3040
    }
  },
})
