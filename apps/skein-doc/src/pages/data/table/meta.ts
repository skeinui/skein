import type { PageMeta } from "@/registry.ts";

export default {
  label: "Table",
  origin: "Skein",
  updated: "0.1.3",
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "sorting",
        "resize",
        "selection",
        "pagination",
        "striped",
        "sizes",
        "sticky",
        "fixed",
        "expand",
        "editable",
        "empty",
        "footer",
      ],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
