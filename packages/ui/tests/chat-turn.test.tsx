// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ChatTurn } from "../src/index.ts";

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

const assistant = (extra: Record<string, unknown> = {}) =>
  createElement(
    ChatTurn.Assistant,
    extra,
    createElement(ChatTurn.Avatar, { fallback: "AI", alt: "Assistant" }),
    createElement(
      ChatTurn.Body,
      null,
      createElement(ChatTurn.Content, null, "Hello"),
      createElement(
        ChatTurn.Actions,
        null,
        createElement(ChatTurn.Action, { "aria-label": "Copy" }, "C"),
      ),
    ),
  );

describe("ChatTurn", () => {
  test("assistant: article with a name, avatar + content column + action group, no class / style", () => {
    const html = ssr(assistant());
    expect(html).toContain(
      '<article aria-label="Assistant" data-slot="chat-turn" data-role="assistant">',
    );
    expect(html).toContain('data-slot="chat-turn-avatar"');
    expect(html).toContain('data-slot="chat-turn-body"');
    expect(html).toContain('data-slot="chat-turn-content">Hello<');
    expect(html).toContain(
      'role="group" aria-label="Message actions" data-slot="chat-turn-actions"',
    );
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("user: content in a bubble, name defaults to You and can be changed", () => {
    const html = ssr(
      createElement(
        ChatTurn.User,
        { "aria-label": "Me" },
        createElement(ChatTurn.Bubble, null, createElement(ChatTurn.Content, null, "Hi")),
      ),
    );
    expect(html).toContain('aria-label="Me"');
    expect(html).toContain('data-role="user"');
    expect(html).toContain('data-slot="chat-turn-bubble"');
    expect(ssr(createElement(ChatTurn.User))).toContain('aria-label="You"');
  });

  test("Avatar show=false: keeps the space, aria-hidden, renders no avatar", () => {
    const html = ssr(createElement(ChatTurn.Avatar, { show: false, fallback: "AI" }));
    expect(html).toContain("data-hidden");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("avatar-fallback");
  });

  test("Action: an icon button, pressed written as aria-pressed, click calls back", async () => {
    const onClick = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        createElement(
          ChatTurn.Actions,
          null,
          createElement(ChatTurn.Action, { "aria-label": "Like", pressed: true, onClick }, "👍"),
          createElement(ChatTurn.Action, { "aria-label": "Dislike", pressed: false }, "👎"),
        ),
      );
    });
    const [like, dislike] = [...host.querySelectorAll<HTMLButtonElement>("button")];
    expect(like!.getAttribute("aria-label")).toBe("Like");
    expect(like!.getAttribute("aria-pressed")).toBe("true");
    expect(dislike!.getAttribute("aria-pressed")).toBe("false");
    expect(like!.hasAttribute("data-icon-only")).toBe(true);
    await act(async () => like!.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("Action without toggle has no aria-pressed", () => {
    expect(ssr(createElement(ChatTurn.Action, { "aria-label": "Copy" }, "C"))).not.toContain(
      "aria-pressed",
    );
  });
});

describe("ChatTurn.Edit", () => {
  const mountEdit = async (props: Record<string, unknown> = {}) => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        createElement(ChatTurn.Edit, {
          defaultValue: "Hello",
          onSave,
          onCancel,
          ...props,
        } as never),
      );
    });
    return { onSave, onCancel };
  };
  const field = () => host!.querySelector<HTMLTextAreaElement>("textarea")!;
  const type = (text: string) =>
    act(async () => {
      Reflect.set(HTMLTextAreaElement.prototype, "value", text, field());
      field().dispatchEvent(new Event("input", { bubbles: true }));
    });

  test("SSR: a form, named input, save and cancel buttons, no class / style", () => {
    const html = ssr(
      createElement(ChatTurn.Edit, { defaultValue: "x", onSave: () => {}, onCancel: () => {} }),
    );
    expect(html).toContain('data-slot="chat-turn-edit"');
    expect(html).toContain('aria-label="Edit message"');
    expect(html).toContain(">Cancel<");
    expect(html).toContain(">Save<");
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("focused on mount, caret at the end", async () => {
    await mountEdit();
    expect(document.activeElement).toBe(field());
    expect(field().selectionStart).toBe(5);
  });

  test("the save button saves the edited text; Cmd / Ctrl + Enter saves too, Enter only adds a line", async () => {
    const { onSave } = await mountEdit();
    await type("Hello world");
    await act(async () => {
      field().dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    });
    expect(onSave).not.toHaveBeenCalled();
    await act(async () => {
      field().dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(onSave).toHaveBeenLastCalledWith("Hello world");
    const save = [...host!.querySelectorAll("button")].find((b) => b.textContent === "Save")!;
    await act(async () => save.click());
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  test("Esc and the cancel button cancel", async () => {
    const { onCancel } = await mountEdit();
    await act(async () => {
      field().dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      );
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    const cancel = [...host!.querySelectorAll("button")].find((b) => b.textContent === "Cancel")!;
    await act(async () => cancel.click());
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  test("empty text cannot be saved", async () => {
    const { onSave } = await mountEdit();
    await type("   ");
    const save = [...host!.querySelectorAll("button")].find((b) => b.textContent === "Save")!;
    expect(save.disabled).toBe(true);
    await act(async () => {
      field().dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          metaKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  test("labels replace the text", async () => {
    await mountEdit({
      labels: { save: "Keep edit", cancel: "Discard" },
      "aria-label": "Revise message",
    });
    expect(field().getAttribute("aria-label")).toBe("Revise message");
    expect([...host!.querySelectorAll("button")].map((b) => b.textContent)).toEqual([
      "Discard",
      "Keep edit",
    ]);
  });
});

describe("ChatTurn.Pager", () => {
  test("SSR: role=group, position text, two named buttons, no class / style", () => {
    const html = ssr(
      createElement(ChatTurn.Pager, { index: 1, count: 3, onIndexChange: () => {} }),
    );
    expect(html).toContain('role="group" aria-label="Response versions"');
    expect(html).toContain('aria-live="polite">2 / 3<');
    expect(html).toContain('aria-label="Previous response"');
    expect(html).toContain('aria-label="Next response"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("renders nothing with fewer than 2 versions", () => {
    expect(
      ssr(createElement(ChatTurn.Pager, { index: 0, count: 1, onIndexChange: () => {} })),
    ).toBe("");
  });

  test("the direction at an end is disabled; clicking fires onIndexChange", async () => {
    const onIndexChange = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ChatTurn.Pager, { index: 0, count: 2, onIndexChange }));
    });
    const [prev, next] = [...host.querySelectorAll<HTMLButtonElement>("button")];
    expect(prev!.disabled).toBe(true);
    expect(next!.disabled).toBe(false);
    await act(async () => next!.click());
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });
});

describe("ChatTurn.Status / Time", () => {
  test("sending is role=status", () => {
    const html = ssr(createElement(ChatTurn.Status, { state: "sending" }));
    expect(html).toContain('role="status"');
    expect(html).toContain("Sending…");
    expect(html).not.toContain("button");
  });

  test("failure is role=alert with a retry button that calls back; no button without onRetry", async () => {
    const onRetry = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ChatTurn.Status, { state: "failed", onRetry }));
    });
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    await act(async () => host!.querySelector<HTMLButtonElement>("button")!.click());
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(ssr(createElement(ChatTurn.Status, { state: "failed" }))).not.toContain("<button");
  });

  test("Time: <time datetime>, formatted by locale, title is the full date", () => {
    const html = ssr(
      createElement(ChatTurn.Time, {
        value: "2026-10-23T14:30:00Z",
        locale: "en-US",
        display: "datetime",
      }),
    );
    expect(html).toContain('dateTime="2026-10-23T14:30:00.000Z"');
    expect(html).toContain("Oct 23, 2026");
    expect(html).toContain('title="');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("Time: invalid values render nothing", () => {
    expect(ssr(createElement(ChatTurn.Time, { value: "not a date" }))).toBe("");
  });
});
