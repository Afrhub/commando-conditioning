import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  // Base path strategy:
  // - GitHub Pages build (GITHUB_PAGES=true env): /commando-conditioning/
  // - Netlify / Cloudflare Pages / direct domain (default): /
  // - Local dev (mode !== production): /
  base: mode === "production" && process.env.GITHUB_PAGES === "true"
    ? "/commando-conditioning/"
    : "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "brand/logo.svg", "brand/wordmark.svg"],
      manifest: {
        name: "Commando Conditioning",
        short_name: "Commando",
        description: "12-week training programme for Royal Marines entrance standards",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/brand/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/brand/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,mp3}"],
      },
    }),
  ],
}));
