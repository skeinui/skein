import type { GuideMeta } from "@/registry.ts";
import { EXAMPLES } from "@/site/examples.ts";

export default {
  order: 6,
  // One section per example app
  toc: [{ group: "guide", items: EXAMPLES.map((e) => e.id) }],
} satisfies GuideMeta;
