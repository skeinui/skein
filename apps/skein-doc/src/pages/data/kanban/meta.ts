import type { PageMeta } from "@/registry.ts";

export default {
  label: "Kanban",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "actions", "sizes", "column-menu", "height", "readonly"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
