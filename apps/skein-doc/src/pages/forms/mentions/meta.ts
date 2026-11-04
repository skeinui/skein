import type { PageMeta } from "@/registry.ts";

export default {
  label: "Mentions",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "controlled", "prefix", "single", "rich", "async", "states"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
