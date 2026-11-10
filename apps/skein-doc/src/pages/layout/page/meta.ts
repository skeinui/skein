import type { PageMeta } from "@/registry.ts";

export default {
  label: "Page",
  origin: "Skein",
  since: "0.1.3",
  components: ["Page", "PageHeader", "PageFooter"],
  source: "page-header",
  toc: [
    {
      group: "examples",
      items: ["usage", "actions", "footer", "fill", "states", "back", "levels"],
    },
    { group: "reference", items: ["api", "headerApi", "footerApi", "styling"] },
  ],
} satisfies PageMeta;
