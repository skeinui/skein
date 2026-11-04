import type { PageMeta } from "@/registry.ts";

export default {
  label: "Sidebar",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "app", "variants", "collapsible", "footer-trigger", "side", "theme"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
