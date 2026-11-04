import type { PageMeta } from "@/registry.ts";

export default {
  label: "Image",
  origin: "Original",
  toc: [
    { group: "examples", items: ["basic", "fallback", "no-preview", "group"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
