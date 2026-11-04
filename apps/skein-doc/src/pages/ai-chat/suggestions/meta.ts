import type { PageMeta } from "@/registry.ts";

export default {
  label: "Suggestions",
  origin: "Original",
  toc: [
    { group: "examples", items: ["grid", "list", "chips"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
