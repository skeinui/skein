import type { PageMeta } from "@/registry.ts";

export default {
  label: "Transfer",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "controlled", "search", "one-way", "sizes", "disabled"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
