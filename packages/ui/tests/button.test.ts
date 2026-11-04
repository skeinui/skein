import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { Button } from "../src/index.ts";

const render = (props: Parameters<typeof Button>[0]) =>
  renderToStaticMarkup(createElement(Button, props));

describe("Button", () => {
  test("renders only hook attributes by default, no styles", () => {
    const html = render({ children: "Save" });
    expect(html).toContain('data-slot="button"');
    expect(html).toContain('data-variant="solid"');
    expect(html).toContain('data-color="primary"');
    expect(html).toContain('data-size="md"');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("variant / color / size written as data attributes as is", () => {
    const html = render({ variant: "outline", color: "danger", size: "lg", children: "Delete" });
    expect(html).toContain('data-variant="outline"');
    expect(html).toContain('data-color="danger"');
    expect(html).toContain('data-size="lg"');
  });

  test("loading replaces the start content with a spinner and marks busy", () => {
    const html = render({ loading: true, startContent: "icon", children: "Submit" });
    expect(html).toContain("data-loading");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-slot="button-spinner"');
    expect(html).not.toContain('data-slot="button-start"');
  });

  test("start / end content each have their own slot", () => {
    const html = render({ startContent: "a", endContent: "b", children: "x" });
    expect(html).toContain('data-slot="button-start"');
    expect(html).toContain('data-slot="button-end"');
  });

  test("disabled is handled by Base UI and emits data-disabled", () => {
    const html = render({ disabled: true, children: "x" });
    expect(html).toContain("data-disabled");
    expect(html).toContain("disabled");
  });

  test("iconOnly only writes a hook", () => {
    expect(render({ iconOnly: true, children: "x" })).toContain("data-icon-only");
    expect(render({ children: "x" })).not.toContain("data-icon-only");
  });
});
