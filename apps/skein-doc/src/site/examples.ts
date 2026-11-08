import { ADMIN_DEMO_URL, ADMIN_URL, MAIL_DEMO_URL, MAIL_URL } from "@/site/links.ts";

/**
 * The example apps (each a repository of its own, deployed with its mock data): the home page shows a card for each, the Examples guide has a
 * section for each (its id is the guide's section id and the key of its messages). A new one: an entry here, its
 * two screenshots in public/examples/, its messages, and its section in guides/examples/index.tsx.
 */
export const EXAMPLES = [
  {
    id: "admin",
    url: ADMIN_URL,
    demo: ADMIN_DEMO_URL,
    light: "/examples/skein-admin-light.webp",
    dark: "/examples/skein-admin-dark.webp",
  },
  {
    id: "mail",
    url: MAIL_URL,
    demo: MAIL_DEMO_URL,
    light: "/examples/skein-mail-light.webp",
    dark: "/examples/skein-mail-dark.webp",
  },
] as const;
