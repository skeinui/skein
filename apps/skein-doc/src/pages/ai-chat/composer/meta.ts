import type { PageMeta } from "@/registry.ts";

export default {
  label: "Composer",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "streaming", "attachments", "triggers", "submit-on"],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
