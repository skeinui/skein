import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vite-plus/test";

const SRC = join(import.meta.dirname, "..", "src");
const PAGES = join(SRC, "pages");
const read = (...path: string[]) => readFileSync(join(...path), "utf8");
const json = (...path: string[]) => JSON.parse(read(...path)) as Messages;

interface Messages {
  [key: string]: string | Messages;
}

/** Every key path of nested messages: `a.b.c`. */
const keys = (messages: Messages, prefix = ""): string[] =>
  Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "string" ? [prefix + key] : keys(value, `${prefix}${key}.`),
  );

const GUIDES = join(SRC, "guides");
// The component pages and the guides (installation, theming…): the same layout, the same rules
const pages = [
  ...readdirSync(PAGES).flatMap((group) =>
    readdirSync(join(PAGES, group)).map((slug) => ({ slug, dir: join(PAGES, group, slug) })),
  ),
  ...readdirSync(GUIDES).map((slug) => ({ slug, dir: join(GUIDES, slug) })),
];

describe("docs site texts", () => {
  test("the site's English and Chinese messages have the same keys", () => {
    const en = keys(json(SRC, "site", "locales", "en.json"));
    expect(keys(json(SRC, "site", "locales", "zh.json")).sort()).toEqual(en.sort());
  });

  test("every page has meta.ts, index.tsx and its texts in English and Chinese", () => {
    for (const { slug, dir } of pages) {
      for (const file of ["meta.ts", "index.tsx", "locales/en.json", "locales/zh.json"])
        expect(existsSync(join(dir, file)), `${slug}/${file}`).toBe(true);
    }
  });

  describe.each(pages)("$slug", ({ dir }) => {
    const en = json(dir, "locales", "en.json");
    const zh = json(dir, "locales", "zh.json");

    test("en.json and zh.json have the same keys (props: Chinese only, English comes from the manifest)", () => {
      const { props, ...rest } = zh;
      expect(keys(rest).sort()).toEqual(keys(en).sort());
      expect(en.props).toBeUndefined();
      expect(props === undefined || typeof props === "object").toBe(true);
    });

    test("a lead, and a title for every example and table-of-contents entry", () => {
      expect(typeof en.lead).toBe("string");
      const source = read(dir, "index.tsx");
      const examples = [...source.matchAll(/<Example\s+id="([^"]+)"/g)].map((m) => m[1]);
      // Every id in the toc's `items: [...]` arrays, written on one line or several
      const toc = [...read(dir, "meta.ts").matchAll(/items:\s*\[([^\]]*)\]/g)].flatMap((m) =>
        [...m[1].matchAll(/"([\w-]+)"/g)].map((id) => id[1]),
      );
      for (const id of [...examples, ...toc]) {
        expect((en[id] as Messages | undefined)?.title, id).toBeTypeOf("string");
      }
      // Texts live in the locales: no title= / description= left on the examples (the code samples, template
      // literals, may contain such attributes of their own), no Chinese in the code
      const tags = source.replace(/`(?:\\.|[^`\\])*`/g, "``");
      expect(tags).not.toMatch(/<Example[^>]*\s(title|description)="/);
      expect(source).not.toMatch(/[一-龥]/);
    });
  });
});
