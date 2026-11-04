import type { PageMeta } from "@/registry.ts";

export default {
  label: "Chat Thread",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "streaming"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
