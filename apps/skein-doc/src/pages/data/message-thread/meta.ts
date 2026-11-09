import type { PageMeta } from "@/registry.ts";

export default {
  label: "Message Thread",
  origin: "Skein",
  since: "0.1.3",
  components: ["MessageThread", "MessageComposer"],
  source: "message-thread",
  toc: [
    { group: "examples", items: ["usage", "relative", "composer", "conversation"] },
    { group: "reference", items: ["api", "composerApi", "styling"] },
  ],
} satisfies PageMeta;
