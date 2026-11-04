import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
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
