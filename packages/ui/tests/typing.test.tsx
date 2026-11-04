import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { Typing } from "../src/index.ts";
import { TYPING_VARIANTS } from "../src/contract.ts";

const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("Typing", () => {
  test.each(TYPING_VARIANTS)(
    "%s: role=status, named, decorative parts aria-hidden, no class / style",
    (variant) => {
      const html = ssr(createElement(Typing, { variant }));
      expect(html).toContain('data-slot="typing"');
      expect(html).toContain(`data-variant="${variant}"`);
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-label="Assistant is typing"');
      expect(html).not.toMatch(/\sclass=|\sstyle=/);
      // None of the drawn parts enter the accessibility tree
      const inner = html.replace(/^<span[^>]*>/, "");
      expect(inner).toContain('aria-hidden="true"');
    },
  );

  test("dots by default: three dots", () => {
    const html = ssr(createElement(Typing));
    expect(html).toContain('data-variant="dots"');
    expect(html.match(/data-slot="typing-dot"/g)).toHaveLength(3);
  });

  test("skeleton: an avatar and three lines", () => {
    const html = ssr(createElement(Typing, { variant: "skeleton" }));
    expect(html).toContain('data-slot="typing-avatar"');
    expect(html.match(/data-slot="typing-line"/g)).toHaveLength(3);
  });

  test("label can be replaced", () => {
    expect(ssr(createElement(Typing, { label: "Writing a reply" }))).toContain(
      'aria-label="Writing a reply"',
    );
  });
});
