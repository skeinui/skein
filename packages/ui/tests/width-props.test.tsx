// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import {
  ArtifactCard,
  Command,
  Empty,
  Input,
  InputGroup,
  ModelPicker,
  Result,
  Select,
  Suggestions,
  Textarea,
  ThreadList,
  Timeline,
  Tree,
  Upload,
} from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = host = null;
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}
const rerender = (node: React.ReactElement) =>
  act(async () => {
    root!.render(node);
  });
const slot = (name: string) => host!.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
const v = (el: HTMLElement, name: string) => el.style.getPropertyValue(name);

describe("width / minWidth / maxWidth are written as CSS variables on the slot", () => {
  test("a number is px, a string is kept, an unset value writes nothing", async () => {
    await mount(createElement(Input, { width: 256, minWidth: "12rem" }));
    const input = slot("input");
    expect(v(input, "--ui-input-width")).toBe("256px");
    expect(v(input, "--ui-input-min-width")).toBe("12rem");
    expect(v(input, "--ui-input-max-width")).toBe("");
  });

  test("changing or removing a value updates the variable", async () => {
    await mount(createElement(Input, { width: 200 }));
    await rerender(createElement(Input, { width: "50%", maxWidth: 400 }));
    const input = slot("input");
    expect(v(input, "--ui-input-width")).toBe("50%");
    expect(v(input, "--ui-input-max-width")).toBe("400px");
    await rerender(createElement(Input, {}));
    expect(v(input, "--ui-input-width")).toBe("");
  });

  test("Input keeps a ref passed by the caller", async () => {
    const seen: { el: HTMLInputElement | null } = { el: null };
    await mount(
      <Input
        width={100}
        ref={(el) => {
          seen.el = el;
        }}
      />,
    );
    expect(seen.el).toBe(slot("input"));
  });

  test("Select puts them on the trigger", async () => {
    await mount(createElement(Select, { options: [], width: 256, "aria-label": "x" }));
    expect(v(slot("select-trigger"), "--ui-select-width")).toBe("256px");
  });

  test("Textarea with a count puts them on the wrapper, not the textarea", async () => {
    await mount(createElement(Textarea, { width: 300, showCount: true, "aria-label": "x" }));
    expect(v(slot("textarea-wrapper"), "--ui-textarea-wrapper-width")).toBe("300px");
    expect(v(slot("textarea"), "--ui-textarea-width")).toBe("");
    await rerender(createElement(Textarea, { width: 300, "aria-label": "x" }));
    expect(v(slot("textarea"), "--ui-textarea-width")).toBe("300px");
  });

  test("InputGroup: sm / md / lg stay a preset, anything else is a width", async () => {
    await mount(createElement(InputGroup, { width: "md" }));
    expect(slot("input-group").dataset.width).toBe("md");
    expect(v(slot("input-group"), "--ui-input-group-width")).toBe("");
    await rerender(createElement(InputGroup, { width: "16rem", minWidth: 100 }));
    expect(slot("input-group").dataset.width).toBeUndefined();
    expect(v(slot("input-group"), "--ui-input-group-width")).toBe("16rem");
    expect(v(slot("input-group"), "--ui-input-group-min-width")).toBe("100px");
  });

  test("ThreadList iconSize is a variable on the root", async () => {
    await mount(createElement(ThreadList, { items: [], iconSize: 28 }));
    expect(v(slot("thread-list"), "--ui-thread-list-icon-size")).toBe("28px");
    await rerender(createElement(ThreadList, { items: [], iconSize: "1.5rem" }));
    expect(v(slot("thread-list"), "--ui-thread-list-icon-size")).toBe("1.5rem");
    await rerender(createElement(ThreadList, { items: [] }));
    expect(v(slot("thread-list"), "--ui-thread-list-icon-size")).toBe("");
  });

  test.each([
    ["empty", "empty", Empty, {}],
    ["result", "result", Result, {}],
    ["upload", "upload", Upload, {}],
    ["artifact-card", "artifact-card", ArtifactCard, { title: "t" }],
    ["suggestions", "suggestions", Suggestions, { items: [] }],
    ["tree", "tree", Tree, { nodes: [] }],
    ["command", "command", Command, { items: [] }],
    ["timeline", "timeline", Timeline, { items: [] }],
  ] as const)(
    "%s: iconSize is a variable on the root",
    async (prefix, slotName, Component, props) => {
      const C = Component as React.ComponentType<Record<string, unknown>>;
      await mount(createElement(C, { ...props, iconSize: 32 }));
      expect(v(slot(slotName), `--ui-${prefix}-icon-size`)).toBe("32px");
      await rerender(createElement(C, { ...props, iconSize: "2rem" }));
      expect(v(slot(slotName), `--ui-${prefix}-icon-size`)).toBe("2rem");
    },
  );

  test("ModelPicker iconSize is on the trigger", async () => {
    await mount(createElement(ModelPicker, { models: [], iconSize: 24 }));
    expect(v(slot("model-picker-trigger"), "--ui-model-picker-icon-size")).toBe("24px");
  });
});
