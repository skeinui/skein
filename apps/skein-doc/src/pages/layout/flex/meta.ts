import type { PageMeta } from "@/registry.ts";

export default {
  label: "Flex",
  origin: "Skein",
  updated: "0.1.3",
  source: "layout",
  toc: [
    { group: "examples", items: ["basic", "gap", "align", "toolbar"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
