import type { PageMeta } from "@/registry.ts";

export default {
  label: "Field",
  origin: "Base UI",
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "anatomy",
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
