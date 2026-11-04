import type { PageMeta } from "@/registry.ts";

export default {
  label: "Navigation Menu",
  origin: "Base UI",
  toc: [
    {
      group: "examples",
      items: ["usage", "links-only"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
