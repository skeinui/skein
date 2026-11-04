import type { PageMeta } from "@/registry.ts";

export default {
  label: "Side Menu",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["basic", "controlled", "sidebar", "collapsed", "theme", "links"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
