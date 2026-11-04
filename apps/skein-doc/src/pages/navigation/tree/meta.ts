import type { PageMeta } from "@/registry.ts";

export default {
  label: "Tree",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "controlled",
        "checkable",
        "async",
        "filter",
        "drag",
        "lines",
        "block",
        "icons",
        "sizes",
        "colors",
      ],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
