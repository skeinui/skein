import type { PageMeta } from "@/registry.ts";

export default {
  label: "Typography",
  origin: "Skein",
  updated: "0.1.3",
  toc: [
    {
      group: "examples",
      items: ["title", "text", "tones", "ellipsis", "whitespace", "copy", "prose"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
