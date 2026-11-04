import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite-plus";

export default defineConfig(({ command }) => ({
  // Cloudflare's plugin builds for wrangler.jsonc. Only for the build: in dev every route is index.html (Vite's own
  // server), while Cloudflare answers paths that aren't prerendered files with the 404 page; vitest doesn't need it
  // either (its server would clash with the plugin's)
  plugins: command === "build" ? [cloudflare()] : [],
  // Not Vite's 5173 / 5174: the docs site runs beside other Vite apps
  server: {
    port: 5175,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      // Base UI marks its modules "use client" (for React Server Components); bundled into this client-only app the
      // directive means nothing, so dropping it is fine
      onLog(level, log, handler) {
        if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
        handler(level, log);
      },
    },
  },
}));
