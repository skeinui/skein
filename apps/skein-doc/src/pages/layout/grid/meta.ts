import type { PageMeta } from "@/registry.ts";

export default {
  label: "Grid",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["row-col", "gutter", "offset", "align", "order", "responsive", "grid", "auto-grid"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
