import type { PageMeta } from "@/registry.ts";

export default {
  label: "Typography",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["title", "text", "tones", "ellipsis", "whitespace", "copy", "prose"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
