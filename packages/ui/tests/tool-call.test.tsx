// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ToolCall, ToolCallGroup } from "../src/index.ts";
import { TOOL_CALL_STATES } from "../src/contract.ts";

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

/** Strip the style Base UI writes on the panel, then check there is no class / style. */
const noClassOrStyle = (html: string) => {
  expect(html).not.toMatch(/\sclass=/);
  expect(html.replace(/<div[^>]*data-slot="tool-call(?:-group)?-panel"[^>]*>/g, "")).not.toMatch(
    /\sstyle=/,
  );
};

describe("ToolCall", () => {
  test.each(TOOL_CALL_STATES)(
    "%s: state on the root and icon, the trigger has the state text",
    (state) => {
      const html = ssr(
        createElement(ToolCall, { toolName: "searchDocs", state, input: { q: "x" } }),
      );
      expect(html).toContain(`data-slot="tool-call" data-state="${state}"`);
      expect(html).toContain(
        `data-slot="tool-call-status" data-state="${state}" aria-hidden="true"`,
      );
      expect(html).toContain("<strong>searchDocs</strong>");
      expect(html).toContain('data-slot="tool-call-state"');
      noClassOrStyle(html);
    },
  );

  test("running shows a spinner, the others an icon", () => {
    const run = ssr(createElement(ToolCall, { toolName: "t", state: "input-available" }));
    expect(run).toContain("tool-call-spinner");
    const done = ssr(createElement(ToolCall, { toolName: "t", state: "output-available" }));
    expect(done).not.toContain("tool-call-spinner");
    expect(done).toContain("<svg");
  });

  test("done: when open, input and result are JSON CodeBlocks named Input / Result", async () => {
    await mount(
      createElement(ToolCall, {
        toolName: "searchDocs",
        state: "output-available",
        input: { query: "HeroUI" },
        output: { matches: 3 },
        defaultOpen: true,
      }),
    );
    const titles = [...host!.querySelectorAll('[data-slot="code-block-language"]')].map(
      (e) => e.textContent,
    );
    expect(titles).toEqual(["Input", "Result"]);
    expect(host!.textContent).toContain('"query": "HeroUI"');
    expect(host!.textContent).toContain('"matches": 3');
  });

  test("argsText wins over input (JSON is incomplete while arguments stream)", async () => {
    await mount(
      createElement(ToolCall, {
        toolName: "t",
        state: "input-streaming",
        input: { a: 1 },
        argsText: '{"a": 1, "b":',
        defaultOpen: true,
      }),
    );
    expect(host!.textContent).toContain('{"a": 1, "b":');
  });

  test("by default error and approval-requested are open, the others closed; the trigger is disabled with nothing to show", () => {
    expect(
      ssr(createElement(ToolCall, { toolName: "t", state: "output-error", errorText: "boom" })),
    ).toContain('aria-expanded="true"');
    expect(
      ssr(
        createElement(ToolCall, { toolName: "t", state: "requires-action", onApprove: () => {} }),
      ),
    ).toContain('aria-expanded="true"');
    expect(
      ssr(createElement(ToolCall, { toolName: "t", state: "output-available", output: 1 })),
    ).toContain('aria-expanded="false"');
    const bare = ssr(createElement(ToolCall, { toolName: "t", state: "input-available" }));
    expect(bare).toContain("disabled");
    expect(bare).not.toContain("tool-call-icon");
  });

  test("error: the details are role=alert", () => {
    const html = ssr(
      createElement(ToolCall, { toolName: "t", state: "output-error", errorText: "Rate limited" }),
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Rate limited");
    expect(html).toContain("Error");
  });

  test("approval requested: approve / deny button callbacks, no button without its callback", async () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    await mount(
      createElement(ToolCall, { toolName: "t", state: "requires-action", onApprove, onReject }),
    );
    const group = host!.querySelector('[data-slot="tool-call-actions"]')!;
    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-label")).toBe("Approval");
    const [reject, approve] = [...group.querySelectorAll<HTMLButtonElement>("button")];
    expect(reject!.textContent).toBe("Reject");
    expect(approve!.textContent).toBe("Approve");
    await act(async () => approve!.click());
    await act(async () => reject!.click());
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(ssr(createElement(ToolCall, { toolName: "t", state: "requires-action" }))).not.toContain(
      "tool-call-actions",
    );
  });

  test("labels switch language; triggerPrefix goes before the tool name", () => {
    const html = ssr(
      createElement(ToolCall, {
        toolName: "lookup",
        state: "output-available",
        output: 1,
        triggerPrefix: "Called ",
        labels: { states: { "output-available": "Finished" }, output: "Returned" },
        defaultOpen: true,
      }),
    );
    expect(html).toContain("Called <strong>lookup</strong>");
    expect(html).toContain(">Finished<");
    expect(html).toContain(">Returned<");
  });

  test("clicking the trigger opens / closes", async () => {
    await mount(
      createElement(ToolCall, { toolName: "t", state: "output-available", output: { a: 1 } }),
    );
    const trigger = () =>
      host!.querySelector<HTMLButtonElement>('[data-slot="tool-call-trigger"]')!;
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    await act(async () => trigger().click());
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
  });

  test("non-string output: objects as JSON, strings as is, circular references don't crash", async () => {
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    await mount(
      createElement(ToolCall, {
        toolName: "t",
        state: "output-available",
        output: loop,
        defaultOpen: true,
      }),
    );
    expect(host!.querySelector('[data-slot="code-block"]')).not.toBeNull();
  });
});

describe("ToolCallGroup", () => {
  test("the trigger is a summary, opening shows a list of ToolCalls", async () => {
    await mount(
      createElement(
        ToolCallGroup,
        { label: "2 tool calls", defaultOpen: true },
        createElement(ToolCall, { toolName: "a", state: "output-available" }),
        createElement(ToolCall, { toolName: "b", state: "output-available" }),
      ),
    );
    expect(host!.querySelector('[data-slot="tool-call-group-trigger"]')!.textContent).toContain(
      "2 tool calls",
    );
    expect(host!.querySelectorAll('[data-slot="tool-call"]')).toHaveLength(2);
    noClassOrStyle(host!.innerHTML);
  });
});
