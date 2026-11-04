import type { PageMeta } from "@/registry.ts";

export default {
  label: "Citation",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "preview", "document", "group"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
