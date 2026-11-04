import type { PageMeta } from "@/registry.ts";

export default {
  label: "Link",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "variants", "colors", "external", "disabled"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
