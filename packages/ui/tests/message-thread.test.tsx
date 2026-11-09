// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ConfigProvider, MessageComposer, MessageThread } from "../src/index.ts";
import type { ComposerMode, MessageKind, ThreadMessage } from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = root = null;
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
  return host;
}
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

const KINDS: Record<string, MessageKind> = {
  customer: { label: "Customer" },
  agent: { label: "Agent", variant: "soft", color: "primary" },
  note: { label: "Internal note", variant: "dashed", color: "warning" },
};
const MESSAGES: ThreadMessage[] = [
  {
    id: 1,
    kind: "customer",
    author: "Priya Nair",
    time: "2026-11-06T15:37:00Z",
    body: "How do I invite a teammate?",
  },
  {
    id: 2,
    kind: "note",
    author: "Ben Carter",
    time: "2026-11-09T18:37:00Z",
    body: "@Ada Lin can you look?\nSecond line.",
    attachments: [
      { name: "log.txt", size: 2048, href: "https://example.com/log.txt" },
      { name: "shot.png" },
    ],
  },
  { id: 3, kind: "other", author: "Bot", time: 0, body: createElement("em", null, "node body") },
];

describe("MessageThread", () => {
  const html = ssr(
    createElement(MessageThread, {
      messages: MESSAGES,
      kinds: KINDS,
      mentions: ["Ada Lin"],
      locale: "en",
    }),
  );

  test("each message is a Callout of its kind, with the author, a tag, the time, no class", () => {
    expect(html).toContain('role="log"');
    expect(html.match(/data-slot="callout"/g)?.length).toBe(3);
    expect(html).toContain('data-variant="outline"');
    expect(html).toContain('data-variant="dashed"');
    expect(html).toContain("Priya Nair");
    expect(html).toContain("Internal note");
    expect(html).toContain("<time");
    expect(html).toContain("PN");
    expect(html).not.toContain("class=");
  });

  test("mentions in a text are bold, line breaks are kept, a node body is shown as it is", () => {
    expect(html).toContain("<strong");
    expect(html).toContain("@Ada Lin");
    expect(html).toContain('data-pre=""');
    expect(html).toContain("<em>node body</em>");
  });

  test("files: the name (a link with an href) and the size", () => {
    expect(html).toContain('href="https://example.com/log.txt"');
    expect(html).toContain("2 KB");
    expect(html).toContain("shot.png");
  });

  test("a kind that is not in `kinds` has no tag", () => {
    expect(html).not.toContain(">other<");
  });

  test("`relativeTime` and the language, an empty thread", () => {
    const rel = ssr(
      createElement(MessageThread, {
        messages: [{ id: 1, kind: "agent", author: "A", time: Date.now() - 3_600_000, body: "x" }],
        kinds: KINDS,
        relativeTime: true,
        locale: "en",
      }),
    );
    expect(rel).toContain("1 hour ago");
    expect(ssr(createElement(MessageThread, { messages: [], kinds: KINDS }))).toContain(
      "No messages yet",
    );
    expect(
      ssr(
        createElement(
          ConfigProvider,
          { ...zhCN },
          createElement(MessageThread, { messages: [], kinds: KINDS }),
        ),
      ),
    ).toContain("还没有消息");
  });
});

const MODES: ComposerMode[] = [
  { value: "agent", label: "Reply", sendLabel: "Send reply", placeholder: "Write…" },
  { value: "note", label: "Note", sendLabel: "Add note", mentions: ["Ada Lin", "Ben Carter"] },
];

function Harness({ onSend, toolbar }: { onSend: (v: string, m: string) => void; toolbar?: never }) {
  const [mode, setMode] = useState("agent");
  const [value, setValue] = useState("");
  return createElement(MessageComposer, {
    modes: MODES,
    mode,
    onModeChange: setMode,
    value,
    onValueChange: setValue,
    onSend,
    toolbar: toolbar ?? ((m: string) => createElement("span", { "data-tool": m }, `tools:${m}`)),
  });
}
const type = async (el: HTMLElement, text: string) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto.prototype, "value")!.set!.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("MessageComposer", () => {
  test("the switch shows with two modes; the toolbar gets the mode; the button names the mode", async () => {
    const el = await mount(createElement(Harness, { onSend: () => {} }));
    expect(el.querySelectorAll('[role="radio"]').length).toBe(2);
    expect(el.querySelector("[data-tool]")?.textContent).toBe("tools:agent");
    expect(el.textContent).toContain("Send reply");
    await act(async () => (el.querySelectorAll('[role="radio"]')[1] as HTMLElement).click());
    expect(el.querySelector("[data-tool]")?.textContent).toBe("tools:note");
    expect(el.textContent).toContain("Add note");
  });

  test("nothing to send: the button is disabled; sending gives the text and the mode", async () => {
    const onSend = vi.fn();
    const el = await mount(createElement(Harness, { onSend }));
    const button = [...el.querySelectorAll("button")].find((b) => b.textContent === "Send reply")!;
    expect(button.disabled).toBe(true);
    await type(el.querySelector("textarea")!, "Hello");
    expect(button.disabled).toBe(false);
    await act(async () => button.click());
    expect(onSend).toHaveBeenCalledWith("Hello", "agent");
  });

  test("Ctrl+Enter sends; a mode with `mentions` is a Mentions box", async () => {
    const onSend = vi.fn();
    const el = await mount(createElement(Harness, { onSend }));
    const box = el.querySelector("textarea")!;
    await type(box, "Hi");
    await act(async () => {
      box.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }),
      );
    });
    expect(onSend).toHaveBeenCalledWith("Hi", "agent");
    await act(async () => (el.querySelectorAll('[role="radio"]')[1] as HTMLElement).click());
    expect(el.querySelector('[data-slot="mentions"], [data-slot="mentions-input"]')).not.toBeNull();
  });
});
