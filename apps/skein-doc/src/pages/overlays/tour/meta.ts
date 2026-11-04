import type { PageMeta } from "@/registry.ts";

export default {
  label: "Tour",
  origin: "Skein",
  toc: [
    { group: "examples", items: ["usage", "intro", "no-mask", "controlled"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
