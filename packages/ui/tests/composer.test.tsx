// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Composer } from "../src/index.ts";
import type { ComposerProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
}

const tree = (props: Omit<ComposerProps, "children"> = {}) =>
  createElement(
    Composer,
    props,
    createElement(
      Composer.Shell,
      null,
      createElement(Composer.TextArea, { placeholder: "Ask anything" }),
      createElement(
        Composer.Toolbar,
        null,
        createElement(
          Composer.ToolbarStart,
          null,
          createElement(Composer.Action, { "aria-label": "Attach file" }, "+"),
        ),
        createElement(Composer.ToolbarEnd, null, createElement(Composer.Send)),
      ),
    ),
    createElement(Composer.Footer, null, "AI can make mistakes."),
  );

const textarea = () => host!.querySelector<HTMLTextAreaElement>("textarea")!;
const send = () =>
  host!.querySelector<HTMLButtonElement>('button[type="submit"], button[data-action="stop"]')!;

async function type(text: string) {
  await act(async () => {
    Reflect.set(HTMLTextAreaElement.prototype, "value", text, textarea());
    textarea().dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const keydown = (init: KeyboardEventInit & { isComposing?: boolean }) =>
  act(async () => {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
    textarea().dispatchEvent(event);
  });

describe("Composer", () => {
  test("SSR: a form, named input, send button disabled (no content), no class / style", () => {
    const html = ssr(tree());
    expect(html).toContain('<form data-slot="composer" data-status="idle">');
    expect(html).toContain('aria-label="Message"');
    expect(html).toContain('placeholder="Ask anything"');
    expect(html).toContain('data-slot="composer-footer"');
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled/);
    expect(html).toContain('aria-label="Send message"');
    expect(html).not.toMatch(/\sclass=/);
  });

  test("after typing the send button is enabled and submits; uncontrolled clears after submit", async () => {
    const onSubmit = vi.fn();
    await mount(tree({ onSubmit }));
    expect(send().disabled).toBe(true);
    await type("hello");
    expect(send().disabled).toBe(false);
    await act(async () => send().click());
    expect(onSubmit).toHaveBeenCalledWith("hello");
    expect(textarea().value).toBe("");
  });

  test("Enter submits, Shift + Enter does not", async () => {
    const onSubmit = vi.fn();
    await mount(tree({ onSubmit }));
    await type("hi");
    await keydown({ key: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
    await keydown({ key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("hi");
  });

  test("Enter during IME composition does not submit", async () => {
    const onSubmit = vi.fn();
    await mount(tree({ onSubmit }));
    await type("你好");
    await keydown({ key: "Enter", isComposing: true });
    await keydown({ key: "Enter", keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("blank content cannot be submitted", async () => {
    const onSubmit = vi.fn();
    await mount(tree({ onSubmit }));
    await type("   ");
    await keydown({ key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(send().disabled).toBe(true);
  });

  test("submitOn=mod-enter: Enter adds a line, Cmd / Ctrl + Enter submits", async () => {
    const onSubmit = vi.fn();
    await mount(tree({ onSubmit, submitOn: "mod-enter" }));
    await type("hi");
    await keydown({ key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
    await keydown({ key: "Enter", ctrlKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await type("again");
    await keydown({ key: "Enter", metaKey: true });
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  test("controlled: the caller holds the value, it does not clear itself after submit", async () => {
    const onSubmit = vi.fn();
    function Controlled() {
      const [value, setValue] = useState("draft");
      return tree({ value, onValueChange: setValue, onSubmit });
    }
    await mount(createElement(Controlled));
    expect(textarea().value).toBe("draft");
    await keydown({ key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("draft");
    expect(textarea().value).toBe("draft");
  });

  test("canSubmit overrides the default (sending with only attachments)", async () => {
    const onSubmit = vi.fn();
    await mount(tree({ onSubmit, canSubmit: true }));
    expect(send().disabled).toBe(false);
    await act(async () => send().click());
    expect(onSubmit).toHaveBeenCalledWith("");
  });

  test("generating: the send button becomes a stop button that fires onStop, Enter cannot submit", async () => {
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    await mount(tree({ status: "streaming", onStop, onSubmit }));
    await type("more");
    const stop = send();
    expect(stop.getAttribute("aria-label")).toBe("Stop generating");
    expect(stop.type).toBe("button");
    expect(stop.disabled).toBe(false);
    await act(async () => stop.click());
    expect(onStop).toHaveBeenCalledTimes(1);
    await keydown({ key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("disabled: both the input and the buttons are disabled", async () => {
    await mount(tree({ disabled: true, defaultValue: "x" }));
    expect(textarea().disabled).toBe(true);
    expect(send().disabled).toBe(true);
    expect(
      host!.querySelector<HTMLButtonElement>('button[aria-label="Attach file"]')!.disabled,
    ).toBe(true);
  });

  test("Action does not submit the form", async () => {
    const onSubmit = vi.fn();
    await mount(tree({ onSubmit, defaultValue: "x" }));
    const action = host!.querySelector<HTMLButtonElement>('button[aria-label="Attach file"]')!;
    expect(action.type).toBe("button");
    await act(async () => action.click());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("labels replace the text", async () => {
    await mount(
      tree({ labels: { input: "Prompt", send: "Submit", stop: "Halt" }, defaultValue: "x" }),
    );
    expect(textarea().getAttribute("aria-label")).toBe("Prompt");
    expect(send().getAttribute("aria-label")).toBe("Submit");
  });

  test("clicking empty space in the frame focuses the input", async () => {
    await mount(tree());
    const shell = host!.querySelector<HTMLElement>('[data-slot="composer-shell"]')!;
    await act(async () => {
      shell.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true }));
    });
    expect(document.activeElement).toBe(textarea());
  });
});

describe("Composer triggers (@ mentions / / commands)", () => {
  const triggers = {
    "@": ["ada", "grace"],
    "/": [
      { value: "summarize", label: "Summarize" },
      { value: "translate", label: "Translate" },
    ],
  };
  const withTriggers = (props: Omit<ComposerProps, "children"> = {}, onSelect?: () => void) =>
    createElement(
      Composer,
      props,
      createElement(
        Composer.Shell,
        null,
        createElement(Composer.TextArea, { triggers, onTriggerSelect: onSelect }),
      ),
    );
  const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 30)));
  const typeAt = async (text: string) => {
    act(() => textarea().focus());
    await act(async () => {
      Reflect.set(HTMLTextAreaElement.prototype, "value", text, textarea());
      textarea().setSelectionRange(text.length, text.length);
      textarea().dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settle();
  };
  const options = () =>
    [...document.querySelectorAll('[data-slot="mentions-option"]')].map((o) => o.textContent);

  test("without triggers: no suggestion list and no combobox attributes", async () => {
    await mount(tree());
    await type("@a");
    await settle();
    expect(document.querySelector('[data-slot="mentions-list"]')).toBeNull();
    expect(textarea().getAttribute("aria-haspopup")).toBeNull();
  });

  test("typing @ opens suggestions filtered by input, a space ends the trigger", async () => {
    await mount(withTriggers());
    await typeAt("hi @");
    expect(options()).toEqual(["ada", "grace"]);
    await typeAt("hi @g");
    expect(options()).toEqual(["grace"]);
    await typeAt("hi @g ");
    expect(options()).toEqual([]);
  });

  test("typing / takes the command suggestions (shows label, inserts value)", async () => {
    await mount(withTriggers());
    await typeAt("/");
    expect(options()).toEqual(["Summarize", "Translate"]);
  });

  test("with suggestions open Enter selects instead of submitting; the text is inserted with the caret after it", async () => {
    const onSubmit = vi.fn();
    const onSelect = vi.fn();
    await mount(withTriggers({ onSubmit }, onSelect));
    await typeAt("ask @gr");
    await keydown({ key: "Enter" });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(textarea().value).toBe("ask @grace ");
    expect(onSelect).toHaveBeenCalledWith({ value: "grace" }, "@");
    expect(textarea().selectionStart).toBe("ask @grace ".length);
    // Enter submits only after the list is closed
    await keydown({ key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("ask @grace ");
  });

  test("Up / Down move the highlight, Esc closes suggestions (Enter then submits)", async () => {
    const onSubmit = vi.fn();
    await mount(withTriggers({ onSubmit }));
    await typeAt("@");
    await keydown({ key: "ArrowDown" });
    const active = document.querySelector('[data-slot="mentions-option"][data-active]')!;
    expect(active.textContent).toBe("grace");
    await keydown({ key: "Escape" });
    await settle();
    expect(document.querySelector('[data-slot="mentions-list"]')).toBeNull();
    await keydown({ key: "Enter" });
    expect(onSubmit).toHaveBeenCalledWith("@");
  });

  test("clicking a suggestion selects it", async () => {
    await mount(withTriggers());
    await typeAt("@a");
    const option = document.querySelector<HTMLElement>('[data-slot="mentions-option"]')!;
    await act(async () => option.click());
    expect(textarea().value).toBe("@ada ");
  });
});
