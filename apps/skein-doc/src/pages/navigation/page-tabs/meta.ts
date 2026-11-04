import type { PageMeta } from "@/registry.ts";

export default {
  label: "Page Tabs",
  origin: "Original",
  toc: [
    { group: "examples", items: ["usage", "variants", "keep-alive", "overflow"] },
    { group: "reference", items: ["api", "keep-alive-api", "helpers", "styling"] },
  ],
} satisfies PageMeta;
