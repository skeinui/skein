import type { PageMeta } from "@/registry.ts";

export default {
  label: "Kanban",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "actions", "sizes", "column-menu", "height", "readonly"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
