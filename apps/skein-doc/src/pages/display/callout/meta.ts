import type { PageMeta } from "@/registry.ts";

export default {
  label: "Callout",
  origin: "Skein",
  since: "0.1.3",
  toc: [
    { group: "examples", items: ["usage", "variants", "colors", "conversation"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
