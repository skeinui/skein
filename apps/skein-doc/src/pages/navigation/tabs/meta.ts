import type { PageMeta } from "@/registry.ts";

export default {
  label: "Tabs",
  origin: "Base UI",
  toc: [
    {
      group: "examples",
      items: ["usage", "variants", "colors", "sizes", "vertical", "disabled", "full-width"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
