import type { PageMeta } from "@/registry.ts";

export default {
  label: "Button Group",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "anatomy",
        "variants",
        "sizes",
        "orientation",
        "with-icons",
        "full-width",
        "disabled-state",
        "without-separator",
      ],
    },
    { group: "beyond", items: ["colors", "radius", "overrides"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
