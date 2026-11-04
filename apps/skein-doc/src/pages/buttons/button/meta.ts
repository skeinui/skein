import type { PageMeta } from "@/registry.ts";

export default {
  label: "Button",
  origin: "Base UI",
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "variants",
        "sizes",
        "with-icons",
        "icon-only",
        "loading",
        "loading-state",
        "full-width",
        "disabled-state",
        "social-buttons",
        "render-function",
      ],
    },
    { group: "beyond", items: ["colors", "radius", "behaviour"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
