import uiPackage from "@skeinui/ui/package.json";

/** The published version of `@skeinui/ui`, shown in the header: read from its package.json, so a release updates it. */
export const VERSION = uiPackage.version;

export const GITHUB_URL = "https://github.com/skeinui/skein";
/** The repository's data (star count) from GitHub's API: public, CORS allowed, 60 requests an hour per visitor. */
export const GITHUB_API = "https://api.github.com/repos/skeinui/skein";
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;
export const NPM_URL = "https://www.npmjs.com/package/@skeinui/ui";

/** The site's address: canonical links, hreflang, the sitemap, social cards. */
export const SITE_URL = "https://skeinui.com";
