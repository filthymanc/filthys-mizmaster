import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",
      registerType: "prompt",
      injectRegister: "auto",
      devOptions: {
        enabled: false,
        type: "module",
      },
      manifest: {
        name: "filthy's MizMaster",
        short_name: "MizMaster",
        description:
          "Your personal AI co-pilot for DCS World mission scripting.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/filthys-mizmaster/",
        scope: "/filthys-mizmaster/",
        icons: [
          {
            src: "filthysMM.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "filthysMM.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  base: "/filthys-mizmaster/",
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    open: false,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@google/genai")) {
              return "vendor-genai";
            }
            return "vendor-libs";
          }
        },
      },
    },
  },
});
