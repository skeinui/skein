import type { PageMeta } from "@/registry.ts";

export default {
  label: "Toast",
  origin: "Base UI",
  components: ["Toaster"],
  toc: [
    {
      group: "examples",
      items: [
        "usage",
        "types",
        "rich",
        "icon",
        "close",
        "custom",
        "description",
        "action",
        "promise",
        "loading",
        "layout",
        "position",
        "persistent",
      ],
    },
    { group: "reference", items: ["api", "styling"] },
  ],
} satisfies PageMeta;
