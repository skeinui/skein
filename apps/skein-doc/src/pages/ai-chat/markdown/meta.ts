import type { PageMeta } from "@/registry.ts";

export default {
  label: "Markdown",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "lists", "table", "streaming", "citations", "math", "safety"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
