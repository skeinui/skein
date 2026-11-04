import type { PageMeta } from "@/registry.ts";

export default {
  label: "Descriptions",
  origin: "Original",
  toc: [
    { group: "examples", items: ["usage", "bordered", "span", "vertical", "sizes"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
