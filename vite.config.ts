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
      registerType: "autoUpdate",
      injectRegister: "inline",
      devOptions: {
        enabled: false,
        type: "module",
      },
      manifest: {
        name: "filthy's MizMaster",
        short_name: "MizMaster",
        description: "Your personal AI co-pilot for DCS World mission scripting.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/filthys-mizmaster/",
        scope: "/filthys-mizmaster/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
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
