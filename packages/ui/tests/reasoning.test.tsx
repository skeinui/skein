// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Reasoning } from "../src/index.ts";

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

const tree = (props: Record<string, unknown> = {}) =>
  createElement(
    Reasoning,
    props,
    createElement(Reasoning.Trigger, null, "Thought for 4s"),
    createElement(
      Reasoning.Content,
      null,
      createElement(
        Reasoning.Steps,
        null,
        createElement(Reasoning.Step, { label: "Explore" }, "Read the layout."),
        createElement(Reasoning.Step, { status: "active", label: "Write" }, "Drafting…"),
        createElement(Reasoning.Step, { status: "pending" }, "Review"),
      ),
    ),
  );

describe("Reasoning", () => {
  test("SSR: trigger, step list and status, no class / style", () => {
    const html = ssr(tree({ defaultOpen: true }));
    expect(html).toContain('data-slot="reasoning"');
    expect(html).toContain('data-slot="reasoning-trigger"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("<ol");
    expect(html).toContain('data-slot="reasoning-steps"');
    expect(html).toContain('data-status="done"');
    expect(html).toContain('data-status="active" aria-current="step"');
    expect(html).toContain('data-status="pending"');
    expect(html).toContain('data-slot="reasoning-step-label">Explore<');
    // The style on the panel is written by Base UI (used for measuring height), our own parts have none
    expect(html).not.toMatch(/\sclass=/);
    expect(html.replace(/<div[^>]*data-slot="reasoning-panel"[^>]*>/, "")).not.toMatch(/\sstyle=/);
  });

  test("collapsed by default: no panel; the trigger name is the sentence itself", () => {
    const html = ssr(tree());
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("reasoning-steps");
    expect(html).toContain("Thought for 4s");
  });

  test("streaming: the trigger text shimmers and the root has data-streaming; no shimmer after", () => {
    const on = ssr(tree({ streaming: true }));
    expect(on).toContain("data-streaming");
    expect(on).toContain('data-slot="shimmer-text-highlight"');
    expect(ssr(tree())).not.toContain("shimmer-text-highlight");
  });

  test("clicking the trigger opens / closes, calls onOpenChange, aria-controls points at the panel", async () => {
    const onOpenChange = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(tree({ onOpenChange }));
    });
    const trigger = () =>
      host!.querySelector<HTMLButtonElement>('[data-slot="reasoning-trigger"]')!;
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    await act(async () => trigger().click());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange.mock.calls[0]![0]).toBe(true);
    const panel = host.querySelector('[data-slot="reasoning-panel"]')!;
    expect(trigger().getAttribute("aria-controls")).toBe(panel.id);
    await act(async () => trigger().click());
    expect(onOpenChange.mock.calls[1]![0]).toBe(false);
  });

  test("controlled: open decides the state", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(tree({ open: true }));
    });
    expect(host.querySelector('[data-slot="reasoning-steps"]')).not.toBeNull();
    await act(async () => {
      root!.render(tree({ open: false }));
    });
    expect(
      host.querySelector('[data-slot="reasoning-trigger"]')!.getAttribute("aria-expanded"),
    ).toBe("false");
  });
});
