import { fileURLToPath } from "node:url";
{{#if router}}
import { tanstackRouter } from "@tanstack/router-plugin/vite";
{{/if}}
{{#if customTheme}}
{{else}}
import { skeinThemes } from "@skeinui/themes/vite";
{{/if}}
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
{{#if router}}
    // File routes under src/routes/. No code splitting: KeepAlive caches the page components themselves
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
{{/if}}
    react(),
{{#if customTheme}}
{{else}}
    // A theme style bundles only the stylesheets of the components the app imports from @skeinui/ui (src/theme:
    // a theme style of the app's own, `skein theme init`)
    skeinThemes({ themes: ["src/theme"] }),
{{/if}}
  ],
  build: {
    rolldownOptions: {
      // Base UI marks its modules "use client" (for React Server Components); in this client-only app the
      // directive means nothing, so the bundler dropping it is fine
      onLog(level, log, handler) {
        if (log.code === "MODULE_LEVEL_DIRECTIVE") return;
        handler(level, log);
      },
    },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
{{#if local}}
    // --local: @skeinui/* are linked from the Skein checkout, which has its own React
    dedupe: ["react", "react-dom"],
{{/if}}
  },
});
