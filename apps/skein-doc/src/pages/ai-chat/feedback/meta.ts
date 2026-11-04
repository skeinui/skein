import type { PageMeta } from "@/registry.ts";

export default {
  label: "Feedback",
  origin: "Skein",
  toc: [
    {
      group: "examples",
      items: ["usage", "reasons"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
