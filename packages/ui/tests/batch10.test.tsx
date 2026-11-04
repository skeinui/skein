// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Empty, Kbd, Link, Stepper, Tag } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("Tag / Kbd / Link / Empty (SSR)", () => {
  test("Tag defaults to soft / neutral / md, has a remove button only with onRemove", () => {
    const html = ssr(createElement(Tag, null, "react"));
    expect(html).toContain('data-slot="tag"');
    expect(html).toContain('data-variant="soft"');
    expect(html).toContain('data-slot="tag-label"');
    expect(html).not.toContain("tag-remove");
    expect(html).not.toContain("class=");
    expect(ssr(createElement(Tag, { onRemove: () => {} }, "x"))).toContain('aria-label="Remove"');
  });

  test("Kbd and Kbd.Group", () => {
    const html = ssr(
      createElement(
        Kbd.Group,
        null,
        createElement(Kbd, null, "⌘"),
        createElement(Kbd, { size: "sm" }, "K"),
      ),
    );
    expect(html).toContain('data-slot="kbd-group"');
    expect(html.match(/<kbd/g)?.length).toBe(2);
    expect(html).toContain('data-size="sm"');
  });

  test("Link: external adds rel and target, disabled drops href", () => {
    const ext = ssr(createElement(Link, { href: "https://a.com", external: true }, "a"));
    expect(ext).toContain('target="_blank"');
    expect(ext).toContain('rel="noopener noreferrer"');
    expect(ext).toContain("data-external");
    const dis = ssr(createElement(Link, { href: "/x", disabled: true }, "x"));
    expect(dis).not.toContain("href=");
    expect(dis).toContain('aria-disabled="true"');
  });

  test("Empty renders each part only when given", () => {
    const html = ssr(
      createElement(Empty, {
        title: "No data",
        description: "Try other filters",
        actions: "Button",
      }),
    );
    expect(html).toContain('data-slot="empty-title"');
    expect(html).toContain('data-slot="empty-description"');
    expect(html).toContain('data-slot="empty-actions"');
    expect(html).not.toContain("empty-icon");
  });
});

describe("Stepper", () => {
  const steps = [
    { title: "Account" },
    { title: "Profile", description: "Enter your name" },
    { title: "Done" },
  ];

  test("derives complete / current / upcoming from current, with connectors", () => {
    const html = ssr(createElement(Stepper, { steps, current: 1 }));
    expect(html).toContain('data-status="complete"');
    expect(html).toContain('data-status="current"');
    expect(html).toContain('data-status="upcoming"');
    expect(html).toContain('aria-current="step"');
    expect(html.match(/data-slot="stepper-connector"/g)?.length).toBe(2);
    expect(html).toContain('data-slot="stepper-description"');
    expect(html).not.toContain("class=");
  });

  test("a manual error status wins; clicking a completed step reports its index, upcoming ones are not clickable", async () => {
    expect(
      ssr(createElement(Stepper, { steps: [{ title: "a", status: "error" }], current: 0 })),
    ).toContain('data-status="error"');
    const calls: number[] = [];
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    await act(async () =>
      root.render(
        createElement(Stepper, { steps, current: 1, onStepClick: (i: number) => calls.push(i) }),
      ),
    );
    const triggers = el.querySelectorAll('[data-slot="stepper-trigger"]');
    expect(triggers[0].tagName).toBe("BUTTON");
    expect(triggers[2].tagName).toBe("SPAN");
    await act(async () => (triggers[0] as HTMLElement).click());
    expect(calls).toEqual([0]);
    await act(async () => root.unmount());
    el.remove();
    void afterEach;
  });
});
