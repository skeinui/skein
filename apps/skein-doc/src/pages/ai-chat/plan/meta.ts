import type { PageMeta } from "@/registry.ts";

export default {
  label: "Plan",
  origin: "Original",
  toc: [
    { group: "examples", items: ["usage", "running"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
