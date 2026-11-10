import type { PageMeta } from "@/registry.ts";

export default {
  label: "Field",
  origin: "Base UI",
  updated: "0.1.3",
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "anatomy",
        "label",
        "description",
        "required",
        "validation",
        "controlled-invalid",
        "variants",
        "textarea",
        "input-group",
        "disabled",
        "form",
      ],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
