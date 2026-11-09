import type { PageMeta } from "@/registry.ts";

export default {
  label: "Badge",
  origin: "Skein",
  updated: "0.1.2",
  toc: [
    {
      group: "examples",
      items: ["usage", "max", "dot", "colors", "sizes", "placement", "standalone"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
