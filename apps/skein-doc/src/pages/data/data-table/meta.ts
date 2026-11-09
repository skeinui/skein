import type { PageMeta } from "@/registry.ts";

export default {
  label: "Data Table",
  origin: "Skein",
  since: "0.1.2",
  toc: [
    { group: "examples", items: ["usage", "actions", "selection", "sorting", "states"] },
    { group: "reference", items: ["api", "column", "action", "styling"] },
  ],
} satisfies PageMeta;
