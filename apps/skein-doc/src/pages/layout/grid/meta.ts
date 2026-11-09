import type { PageMeta } from "@/registry.ts";

export default {
  label: "Grid",
  origin: "Skein",
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
