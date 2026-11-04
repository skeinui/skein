import type { PageMeta } from "@/registry.ts";

export default {
  label: "WebPreview",
  origin: "Original",
  toc: [
    { group: "examples", items: ["usage", "html"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
