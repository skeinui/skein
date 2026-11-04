import type { PageMeta } from "@/registry.ts";

export default {
  label: "Splitter",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "vertical", "limits", "nested", "controlled", "disabled"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
