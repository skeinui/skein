import type { PageMeta } from "@/registry.ts";

export default {
  label: "Terminal",
  origin: "Skein",
  toc: [
    { group: "examples", items: ["usage", "streaming", "failed"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
