import type { PageMeta } from "@/registry.ts";

export default {
  label: "Breadcrumb",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "separator", "onclick"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
