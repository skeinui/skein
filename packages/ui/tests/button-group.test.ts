import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vite-plus/test";
import { Button, ButtonGroup } from "../src/index.ts";

const btn = (props: Record<string, unknown>, label: string) => createElement(Button, props, label);

describe("ButtonGroup", () => {
  test("renders role=group with group hooks, no styles", () => {
    const html = renderToStaticMarkup(
      createElement(ButtonGroup, { variant: "outline" }, btn({}, "a"), btn({}, "b")),
    );
    expect(html).toContain('role="group"');
    expect(html).toContain('data-slot="button-group"');
    expect(html).toContain('data-orientation="horizontal"');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("variant / color / size / radius on the group become defaults of its buttons", () => {
    const html = renderToStaticMarkup(
      createElement(
        ButtonGroup,
        { variant: "faded", color: "danger", size: "lg", radius: "full" },
        btn({}, "a"),
      ),
    );
    const button = html.slice(html.indexOf("<button"));
    expect(button).toContain('data-variant="faded"');
    expect(button).toContain('data-color="danger"');
    expect(button).toContain('data-size="lg"');
    expect(button).toContain('data-radius="full"');
  });

  test("a button's own values win over the group", () => {
    const html = renderToStaticMarkup(
      createElement(ButtonGroup, { variant: "outline" }, btn({ variant: "solid" }, "a")),
    );
    const button = html.slice(html.indexOf("<button"));
    expect(button).toContain('data-variant="solid"');
  });

  test("group disabled reaches every button, an explicit disabled={false} on a button overrides it", () => {
    const html = renderToStaticMarkup(
      createElement(ButtonGroup, { disabled: true }, btn({}, "a"), btn({ disabled: false }, "b")),
    );
    expect(html.match(/data-disabled/g)?.length).toBe(2); // the group itself + the first button
  });

  test("fullWidth and orientation written as hooks", () => {
    const html = renderToStaticMarkup(
      createElement(ButtonGroup, { fullWidth: true, orientation: "vertical" }, btn({}, "a")),
    );
    expect(html).toContain("data-full-width");
    expect(html).toContain('data-orientation="vertical"');
  });

  test("buttons outside a group are unaffected: defaults and no data-radius", () => {
    const html = renderToStaticMarkup(btn({}, "a"));
    expect(html).toContain('data-variant="solid"');
    expect(html).not.toContain("data-radius");
  });

  test("ButtonGroup.Separator renders an aria-hidden element with a slot, no styles", () => {
    const html = renderToStaticMarkup(
      createElement(
        ButtonGroup,
        null,
        btn({}, "a"),
        createElement(Button, null, createElement(ButtonGroup.Separator), "b"),
      ),
    );
    expect(html).toContain('data-slot="button-group-separator"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });
});
