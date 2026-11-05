import { fileURLToPath } from "node:url";
{{#if router}}
import { tanstackRouter } from "@tanstack/router-plugin/vite";
{{/if}}
{{#if customTheme}}
{{else}}
import { skeinThemes } from "@skeinui/themes/vite";
{{/if}}
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

// Written by tools in their own style: not formatted or linted
const generated = ["dist/**"{{#if router}}, "src/routeTree.gen.ts"{{/if}}{{#if mock}}, "public/mockServiceWorker.js"{{/if}}];

// Vite+ (`vp`): dev and build (Vite, Rolldown), test (Vitest), lint (Oxlint) and fmt (Oxfmt), all set up here
export default defineConfig({
  // Loaded only by the commands that run the app (dev, build, preview), not by check, lint or fmt
  plugins: lazyPlugins(() => [
{{#if router}}
    // File routes under src/routes/. No code splitting: KeepAlive caches the page components themselves
    tanstackRouter({ target: "react", autoCodeSplitting: false }),
{{/if}}
    // JSX and Fast Refresh
    react(),
{{#if customTheme}}
{{else}}
    // A theme style bundles only the stylesheets of the components the app imports from @skeinui/ui (src/theme:
    // a theme style of the app's own, `skein theme init`)
    skeinThemes({ themes: ["src/theme"] }),
{{/if}}
  ]),
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
  // `vp check`: fmt, lint and type check; `vp check --fix` formats and fixes what it can
  fmt: {
    ignorePatterns: generated,
  },
  lint: {
    ignorePatterns: generated,
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  // Run on the staged files before each commit (the git hook `vp config` installs; `prepare` runs it)
  staged: {
    "*": "vp check --fix",
  },
});
