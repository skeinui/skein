import uiPackage from "@skeinui/ui/package.json";

/** The published version of `@skeinui/ui`, shown in the header: read from its package.json, so a release updates it. */
export const VERSION = uiPackage.version;

export const GITHUB_URL = "https://github.com/skeinui/skein";
/** The repository's data (star count) from GitHub's API: public, CORS allowed, 60 requests an hour per visitor. */
export const GITHUB_API = "https://api.github.com/repos/skeinui/skein";
/** The example app (an email client), a repository of its own. */
export const MAIL_URL = "https://github.com/skeinui/skein-mail";
/** The deployed examples, running with their mock data. */
export const MAIL_DEMO_URL = "https://skein-mail.skeinui.com";
export const ADMIN_DEMO_URL = "https://skein-admin.skeinui.com";
export const ADMIN_URL = "https://github.com/skeinui/skein-admin";
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;
export const NPM_URL = "https://www.npmjs.com/package/@skeinui/ui";

/** The site's address: canonical links, hreflang, the sitemap, social cards. */
export const SITE_URL = "https://skeinui.com";
