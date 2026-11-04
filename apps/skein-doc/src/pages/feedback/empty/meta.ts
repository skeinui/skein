import type { PageMeta } from "@/registry.ts";

export default {
  label: "Empty",
  origin: "Original",
  toc: [
    { group: "examples", items: ["usage", "actions", "sizes", "in-table"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
