import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { Avatar, AvatarGroup } from "../src/index.ts";

const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);
const people = ["A", "B", "C", "D", "E"].map((l) => createElement(Avatar, { key: l, fallback: l }));

describe("AvatarGroup", () => {
  test("SSR: role=group with a name, no +N when all are shown, no class / style", () => {
    const html = ssr(createElement(AvatarGroup, { "aria-label": "Team" }, people));
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Team"');
    expect(html).toContain('data-slot="avatar-group"');
    expect(html.match(/data-slot="avatar"/g)).toHaveLength(5);
    expect(html).not.toContain("data-overflow");
    expect(html).not.toMatch(/class=|style=/);
  });

  test("beyond max folds into +N: a named role=img with the right count; the screen reader text can be replaced", () => {
    const html = ssr(createElement(AvatarGroup, { max: 3 }, people));
    expect(html.match(/data-slot="avatar"/g)).toHaveLength(4);
    expect(html).toContain("+2");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="2 more"');
    expect(html).toContain("data-overflow");
    expect(
      ssr(
        createElement(AvatarGroup, { max: 1, overflowLabel: (n: number) => `${n} others` }, people),
      ),
    ).toContain('aria-label="4 others"');
    expect(ssr(createElement(AvatarGroup, { max: 9 }, people))).not.toContain("data-overflow");
    expect(ssr(createElement(AvatarGroup, { max: 0 }, people))).toContain("+5");
  });

  test("size / color / radius are passed down to the avatars; an avatar's own value wins", () => {
    const html = ssr(
      createElement(
        AvatarGroup,
        { size: "lg", color: "primary", radius: "md" },
        createElement(Avatar, { fallback: "A" }),
        createElement(Avatar, { fallback: "B", size: "sm" }),
      ),
    );
    expect(html.match(/data-size="lg"/g)).toHaveLength(1);
    expect(html.match(/data-size="sm"/g)).toHaveLength(1);
    expect(html.match(/data-color="primary"/g)).toHaveLength(2);
    expect(html.match(/data-radius="md"/g)).toHaveLength(2);
    // An avatar outside the group still has the default values
    expect(ssr(createElement(Avatar, { fallback: "Z" }))).toContain('data-size="md"');
  });
});
