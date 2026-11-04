import type { PageMeta } from "@/registry.ts";

export default {
  label: "Rating",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "controlled", "half", "readonly", "icon", "sizes", "disabled"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
