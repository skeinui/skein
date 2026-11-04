import type { PageMeta } from "@/registry.ts";

export default {
  label: "Command",
  origin: "Original",
  toc: [
    { group: "examples", items: ["inline", "dialog", "search"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
