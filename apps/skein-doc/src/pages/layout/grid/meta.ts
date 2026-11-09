import type { PageMeta } from "@/registry.ts";

export default {
  label: "Grid",
  origin: "Skein",
  updated: "0.1.3",
  source: "layout",
  toc: [
    {
      group: "examples",
      items: [
        "row-col",
        "gutter",
        "offset",
        "align",
        "order",
        "responsive",
        "grid",
        "aside",
        "auto-grid",
      ],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
