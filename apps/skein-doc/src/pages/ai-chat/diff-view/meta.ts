import type { PageMeta } from "@/registry.ts";

export default {
  label: "DiffView",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "patch", "collapsed"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
