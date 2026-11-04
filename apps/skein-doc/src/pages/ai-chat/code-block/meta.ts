import type { PageMeta } from "@/registry.ts";

export default {
  label: "Code Block",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "languages", "line-numbers", "themes", "custom"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
