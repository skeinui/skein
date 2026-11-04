import type { PageMeta } from "@/registry.ts";

export default {
  label: "Result",
  origin: "Original",
  toc: [
    { group: "examples", items: ["usage", "statuses", "pages", "content", "icon"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
