import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite-plus";

// Not Vite's 5173 / 5174: the docs site runs beside other Vite apps
export default defineConfig({
  // Builds for Cloudflare (wrangler.jsonc) and runs the dev server in its runtime; not under vitest, whose own
  // server the plugin's would clash with (the tests don't need the Cloudflare runtime)
  plugins: process.env.VITEST ? [] : [cloudflare()],
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
});
