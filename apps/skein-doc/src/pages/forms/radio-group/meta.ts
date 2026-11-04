import type { PageMeta } from "@/registry.ts";

export default {
  label: "Radio Group",
  origin: "Base UI",
  components: ["Radio", "RadioGroup"],
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "horizontal",
        "with-description",
        "controlled",
        "disabled",
        "invalid",
        "variants",
      ],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
