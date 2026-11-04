// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Feedback } from "../src/index.ts";
import type { FeedbackProps } from "../src/index.ts";

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
async function mount(props: FeedbackProps = {}) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(createElement(Feedback, props)));
  return host;
}
const btn = (v: "up" | "down") =>
  host!.querySelector<HTMLButtonElement>(`[data-slot="feedback-button"][data-value="${v}"]`)!;
const click = (el: Element) => act(async () => (el as HTMLElement).click());
async function type(el: HTMLTextAreaElement, value: string) {
  await act(async () => {
    Reflect.set(HTMLTextAreaElement.prototype, "value", value, el);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("<Feedback />", () => {
  test("SSR has no class / style; a named button group, the two buttons have different names, neither pressed initially", () => {
    const html = ssr(createElement(Feedback));
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Rate this response"');
    expect(html).toContain('aria-label="Good response"');
    expect(html).toContain('aria-label="Bad response"');
    expect(html).not.toContain('aria-pressed="true"');
  });

  test("click toggles (aria-pressed), clicking the same again clears it, onValueChange gets up / down / null", async () => {
    const onValueChange = vi.fn();
    await mount({ onValueChange });
    await click(btn("up"));
    expect(btn("up").getAttribute("aria-pressed")).toBe("true");
    expect(btn("down").getAttribute("aria-pressed")).toBe("false");
    await click(btn("down"));
    expect(btn("up").getAttribute("aria-pressed")).toBe("false");
    expect(btn("down").getAttribute("aria-pressed")).toBe("true");
    await click(btn("down"));
    expect(btn("down").getAttribute("aria-pressed")).toBe("false");
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual(["up", "down", null]);
  });

  test("controlled: value decides, clicking only notifies", async () => {
    const onValueChange = vi.fn();
    await mount({ value: "up", onValueChange });
    await click(btn("down"));
    expect(onValueChange).toHaveBeenCalledWith("down");
    expect(btn("up").getAttribute("aria-pressed")).toBe("true");
  });

  test("without reasons: thumbs down opens no form", async () => {
    await mount();
    await click(btn("down"));
    expect(host!.querySelector("form")).toBeNull();
  });

  test("with reasons: thumbs down opens a titled fieldset with reason checkboxes and a comment; closes on thumbs up / clear", async () => {
    await mount({ reasons: ["Inaccurate", "Too long"] });
    await click(btn("down"));
    expect(host!.querySelector("legend")?.textContent).toBe("What went wrong?");
    expect(host!.querySelectorAll('input[type="checkbox"]')).toHaveLength(2);
    expect(host!.querySelector("textarea")?.getAttribute("aria-label")).toBe(
      "Additional feedback (optional)",
    );
    await click(btn("up"));
    expect(host!.querySelector("form")).toBeNull();
  });

  test("submit: onSubmit gets the checked reasons and the trimmed comment, then a status confirms and the form closes", async () => {
    const onSubmit = vi.fn();
    await mount({ reasons: ["Inaccurate", "Too long"], onSubmit });
    await click(btn("down"));
    const boxes = host!.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
    await click(boxes[1]!);
    await type(host!.querySelector("textarea")!, "  Rambling  ");
    await act(async () => {
      host!
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(onSubmit).toHaveBeenCalledWith({
      value: "down",
      reasons: ["Too long"],
      comment: "Rambling",
    });
    expect(host!.querySelector("form")).toBeNull();
    const thanks = host!.querySelector('[data-slot="feedback-thanks"]')!;
    expect(thanks.getAttribute("role")).toBe("status");
    expect(thanks.textContent).toBe("Thanks for your feedback");
  });

  test("the status region is always in the DOM (so screen readers announce text added later); labels take effect", async () => {
    await mount({
      reasons: ["x"],
      labels: {
        group: "Score this answer",
        up: "Useful",
        down: "Not useful",
        reasons: "Tell us why",
        submit: "Send it",
        thanks: "Cheers",
      },
    });
    expect(host!.querySelector('[data-slot="feedback-thanks"][role="status"]')).not.toBeNull();
    expect(host!.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe(
      "Score this answer",
    );
    expect(btn("up").getAttribute("aria-label")).toBe("Useful");
    await click(btn("down"));
    expect(host!.querySelector("legend")?.textContent).toBe("Tell us why");
    expect(host!.querySelector('[data-slot="feedback-submit"]')?.textContent).toBe("Send it");
  });
});
