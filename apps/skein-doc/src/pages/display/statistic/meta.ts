import type { PageMeta } from "@/registry.ts";

export default {
  label: "Statistic",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "format", "affixes", "colors", "loading", "animated", "countdown", "cards"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
