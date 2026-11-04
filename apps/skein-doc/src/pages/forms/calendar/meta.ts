import type { PageMeta } from "@/registry.ts";

export default {
  label: "Calendar",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "range", "week", "limits", "controlled", "sizes", "locale"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
