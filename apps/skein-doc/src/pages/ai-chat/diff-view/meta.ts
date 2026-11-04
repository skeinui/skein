import type { PageMeta } from "@/registry.ts";

export default {
  label: "DiffView",
  origin: "Skein",
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
