import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
  // The first test of a file pays for importing and first rendering its component: on the slowest CI runners
  // (Windows) a large one (Agenda) took over vitest's 5 s
  test: { testTimeout: 15_000 },
  // These measure the running docs site: theme styles reach them over HTTP, not as files the task reads, so the
  // run cache can't tell they changed and would replay an old result. Never cache them. The same for the manifest:
  // it reads the docs site's pages and the types through the TypeScript compiler, which the cache doesn't see
  run: {
    tasks: {
      snapshot: { command: "node tests/visual/snapshot.mjs", cache: false },
      a11y: { command: "node tests/a11y/axe.mjs", cache: false },
      manifest: { command: "node scripts/manifest.ts", cache: false },
    },
  },
  // `vp pack` (prepack): the published package is dist/, one ES module per source file (so apps tree-shake per
  // component) with .d.ts. In the workspace the package's exports point at src/; publishConfig points at dist/.
  pack: {
    entry: ["src/index.ts", "src/contract.ts", "src/locales/en.ts", "src/locales/zh-CN.ts"],
    unbundle: true,
    format: "esm",
    platform: "neutral",
    dts: true,
    // The logo the package READMEs show on npm (via jsDelivr: the repository's own copy isn't public)
    copy: [{ from: "../../brand/skein-logo.svg", to: "dist" }],
    // Components use hooks: React Server Components need them marked as client modules. contract, locales and
    // the index (re-exports only) stay server-safe
    outputOptions: {
      banner: (chunk) =>
        chunk.fileName.startsWith("components/") && chunk.fileName.endsWith(".js")
          ? '"use client";'
          : "",
    },
  },
});
