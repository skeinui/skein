import type { PageMeta } from "@/registry.ts";

export default {
  label: "Form",
  origin: "Skein",
  updated: "0.1.3",
  toc: [
    {
      group: "examples",
      items: ["usage", "layouts", "columns", "types", "conditional", "instance"],
    },
    { group: "reference", items: ["api", "field", "styling"] },
  ],
} satisfies PageMeta;
