import type { PageMeta } from "@/registry.ts";

export default {
  label: "Marquee",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["basic", "direction", "controlled", "short"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
