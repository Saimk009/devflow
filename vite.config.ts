import { fileURLToPath, URL } from "node:url"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@xyflow/react")) {
            return "react-flow"
          }

          if (id.includes("xstate") || id.includes("@xstate/react")) {
            return "xstate"
          }

          if (id.includes("recharts")) {
            return "charts"
          }

          if (
            id.includes("react-router-dom") ||
            id.includes("react-dom") ||
            id.includes("react")
          ) {
            return "vendor"
          }

          return undefined
        },
      },
    },
    sourcemap: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
