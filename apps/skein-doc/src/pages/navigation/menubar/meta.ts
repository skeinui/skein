import type { PageMeta } from "@/registry.ts";

export default {
  label: "Menubar",
  origin: "Base UI",
  toc: [
    {
      group: "examples",
      items: ["usage", "checkbox", "danger"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
