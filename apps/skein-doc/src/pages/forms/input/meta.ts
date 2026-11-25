import type { PageMeta } from "@/registry.ts";

export default {
  label: "Input",
  origin: "Base UI",
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "variants",
        "sizes",
        "types",
        "disabled",
        "invalid",
        "read-only",
        "full-width",
        "width",
        "controlled",
      ],
    },
    {
      group: "textarea",
      items: ["textarea", "textarea-rows", "textarea-auto", "textarea-count", "textarea-width"],
    },
    {
      group: "input-group",
      items: [
        "input-group",
        "input-group-icons",
        "input-group-password",
        "input-group-states",
        "input-group-width",
      ],
    },
    { group: "composed", items: ["password-input", "search-input", "tag-input"] },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
