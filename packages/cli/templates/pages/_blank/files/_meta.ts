{{#if shell}}
import { File } from "lucide-react";
import type { PageMeta } from "@/lib/page-meta";

export const meta: PageMeta = {
  icon: File,
  label: { zh: "{{title}}", en: "{{title}}" },
  order: {{order}},
};
{{/if}}
