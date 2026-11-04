// After `vp build`: opens every page (English and Chinese) in the installed Chrome and saves the rendered HTML, so
// search engines and link previews get the content, title and description without running JavaScript; also writes
// sitemap.xml. Run by `deploy` (not by `build`: it needs Chrome and takes a minute).
//
//   /            → dist/index.html        /zh            → dist/zh.html
//   /button      → dist/button.html       /zh/button     → dist/zh/button.html
//
// Cloudflare serves /button from button.html; any other path still gets index.html (wrangler.jsonc).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, extname, join } from "node:path";
import { chromium } from "playwright-core";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const SITE_URL = "https://skeinui.com";

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

/** Every page's path, from the directories the site's registry globs: pages/<group>/<slug>/, guides/<slug>/. */
function paths() {
  const pages = join(ROOT, "src", "pages");
  const slugs = [
    ...readdirSync(join(ROOT, "src", "guides")),
    ...readdirSync(pages).flatMap((group) => readdirSync(join(pages, group))),
  ];
  return ["/", ...slugs.map((slug) => `/${slug}`)];
}

const withLang = (path: string, zh: boolean) => (zh ? (path === "/" ? "/zh" : `/zh${path}`) : path);

const outFile = (url: string) => join(DIST, url === "/" ? "index.html" : `${url.slice(1)}.html`);

// The built app, served the way Cloudflare does: files as they are, every other path gets the (unrendered) index.html
const template = readFileSync(join(DIST, "index.html"));
const server = createServer((req, res) => {
  const file = join(DIST, decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
  if (file.startsWith(DIST) && extname(file) && existsSync(file)) {
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  } else {
    res.writeHead(200, { "content-type": TYPES[".html"] });
    res.end(template);
  }
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

const browser = await chromium.launch({ channel: "chrome" });
const urls = paths().flatMap((path) => [withLang(path, false), withLang(path, true)]);
const rendered = new Map<string, string>();
const failed: string[] = [];

// A few tabs at a time
const queue = [...urls];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    for (let url = queue.shift(); url; url = queue.shift()) {
      try {
        await page.goto(base + url, { waitUntil: "load" });
        await page.waitForSelector(".pg-doc, .pg-home", { timeout: 15000 });
        // The API tables come from the manifest, loaded lazily
        if (await page.locator("#api").count())
          await page.waitForSelector("#api tbody tr", { timeout: 15000 });
        await page.waitForTimeout(300);
        // With the shadow roots (the home page's theme cards) as declarative ones, so they show without scripts
        const html = await page.evaluate(() => {
          const root = document.documentElement;
          const open = root.outerHTML.slice(0, root.outerHTML.indexOf(">") + 1);
          return `${open}${root.getHTML({ serializableShadowRoots: true })}</html>`;
        });
        rendered.set(
          url,
          `<!doctype html>\n${html
            // Vite's preload links added while rendering carry this server's address
            .replaceAll(base, "")
            // Frames of the site's own pages (/__admin-layout) load once the app has started: React recreates them
            // then, so frames in the static HTML would only load twice
            .replace(/(<iframe\b[^>]*?) src="\/__[^"]*"/g, "$1")}`,
        );
      } catch (error) {
        failed.push(`${url}: ${(error as Error).message.split("\n")[0]}`);
      }
    }
    await page.close();
  }),
);
await browser.close();
server.close();

if (failed.length) {
  console.error(`prerender failed for ${failed.length} page(s):\n  ${failed.join("\n  ")}`);
  process.exit(1);
}

for (const [url, html] of rendered) {
  const file = outFile(url);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// The frame a page embeds (main.tsx) needs a file of its own: without one it would fall back to index.html, now the
// rendered home page, which would show inside the frame until the script replaces it
writeFileSync(join(DIST, "__admin-layout.html"), template);

// Each page with its other language, so search engines pair them
const entry = (path: string) => {
  const en = SITE_URL + withLang(path, false);
  const zh = SITE_URL + withLang(path, true);
  const alternates = [
    `<xhtml:link rel="alternate" hreflang="en" href="${en}"/>`,
    `<xhtml:link rel="alternate" hreflang="zh-CN" href="${zh}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="${en}"/>`,
  ].join("");
  return [en, zh].map((loc) => `  <url><loc>${loc}</loc>${alternates}</url>`).join("\n");
};
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths().map(entry).join("\n")}
</urlset>
`,
);

console.log(`prerendered ${rendered.size} pages, sitemap.xml with ${urls.length} URLs`);
