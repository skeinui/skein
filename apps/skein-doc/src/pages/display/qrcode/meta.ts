import type { PageMeta } from "@/registry.ts";

export default {
  label: "QRCode",
  origin: "Original",
  toc: [
    {
      group: "examples",
      items: ["usage", "icon", "colors", "levels", "status", "wechat", "borderless"],
    },
    {
      group: "reference",
      items: ["api", "styling"],
    },
  ],
} satisfies PageMeta;
