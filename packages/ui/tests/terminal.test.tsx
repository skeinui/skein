// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Terminal, parseAnsi, stripAnsi } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  vi.useRealTimers();
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

const E = "\u001b";

describe("parseAnsi", () => {
  test("plain text splits into lines, a trailing newline adds no empty line", () => {
    expect(parseAnsi("a\nb\n").map((l) => l.map((s) => s.text).join(""))).toEqual(["a", "b"]);
    expect(parseAnsi("a\n\nb").map((l) => l.length)).toEqual([1, 0, 1]);
    expect(parseAnsi("a\r\nb")).toHaveLength(2);
  });

  test("colors, bold, reset; adjacent same-style spans merge", () => {
    const [line] = parseAnsi(`plain ${E}[1;31merror${E}[0m done`);
    expect(line).toEqual([
      { text: "plain " },
      { text: "error", bold: true, fg: 1 },
      { text: " done" },
    ]);
    expect(parseAnsi(`${E}[32mgo${E}[32mod`)[0]).toEqual([{ text: "good", fg: 2 }]);
  });

  test("bright colors, backgrounds, the first 16 of 256 colors; true color isn't applied but keeps the text", () => {
    expect(parseAnsi(`${E}[91mx`)[0]![0]).toMatchObject({ fg: 9 });
    expect(parseAnsi(`${E}[42mx`)[0]![0]).toMatchObject({ bg: 2 });
    expect(parseAnsi(`${E}[38;5;12mx`)[0]![0]).toMatchObject({ fg: 12 });
    expect(parseAnsi(`${E}[38;5;200mx`)[0]![0]).toEqual({ text: "x" });
    expect(parseAnsi(`${E}[38;2;10;20;30mx`)[0]![0]).toEqual({ text: "x" });
  });

  test("styles carry across lines until a reset", () => {
    const lines = parseAnsi(`${E}[33mone\ntwo${E}[0m\nthree`);
    expect(lines[0]![0]).toMatchObject({ fg: 3 });
    expect(lines[1]![0]).toMatchObject({ fg: 3 });
    expect(lines[2]![0]).toEqual({ text: "three" });
  });

  test("underline, italic, dim, inverse and their resets", () => {
    const seg = parseAnsi(`${E}[2;3;4;7mx${E}[22;23;24;27my`)[0]!;
    expect(seg[0]).toMatchObject({ dim: true, italic: true, underline: true, inverse: true });
    expect(seg[1]).toMatchObject({
      text: "y",
      dim: false,
      italic: false,
      underline: false,
      inverse: false,
    });
  });

  test("other escape sequences (cursor, clear, title) are dropped", () => {
    expect(stripAnsi(`${E}[2K${E}[1Ahello${E}]0;title\u0007 world`)).toBe("hello world");
  });

  test("\\r redraws in place: only the last shown part stays, colors kept", () => {
    expect(stripAnsi("10%\r50%\r100%\ndone")).toBe("100%\ndone");
    const [line] = parseAnsi(`${E}[32m10%\r${E}[0m100%`);
    expect(line).toEqual([{ text: "100%" }]);
    const [kept] = parseAnsi(`${E}[31m1\r2`);
    expect(kept![0]).toMatchObject({ text: "2", fg: 1 });
  });
});

describe("Terminal", () => {
  test("SSR: dark panel, title, command line, focusable output, no class / style", () => {
    const html = ssr(
      createElement(Terminal, { output: `${E}[32mok${E}[0m`, command: "pnpm test", title: "pnpm" }),
    );
    expect(html).toContain('data-slot="terminal-title">pnpm<');
    expect(html).toContain('data-slot="terminal-prompt" aria-hidden="true">$ <');
    expect(html).toContain("pnpm test");
    expect(html).toContain('data-fg="2"');
    expect(html).toContain('role="region" aria-label="pnpm"');
    expect(html).toContain('tabindex="0"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("status: role=status, exit code only when finished; no status without status", () => {
    expect(ssr(createElement(Terminal, { output: "", status: "running", exitCode: 0 }))).toContain(
      'role="status">Running<',
    );
    expect(ssr(createElement(Terminal, { output: "", status: "done", exitCode: 0 }))).toContain(
      ">Done (0)<",
    );
    expect(ssr(createElement(Terminal, { output: "", status: "error", exitCode: 2 }))).toContain(
      ">Failed (2)<",
    );
    expect(ssr(createElement(Terminal, { output: "" }))).not.toContain("terminal-status");
  });

  test("empty lines have a placeholder; style attributes as data-*", () => {
    const html = ssr(createElement(Terminal, { output: `a\n\n${E}[1;4mb` }));
    expect(html.match(/data-slot="terminal-line"/g)).toHaveLength(3);
    expect(html).toContain("data-bold");
    expect(html).toContain("data-underline");
    expect(html).toContain("​");
  });

  test("copy: copies plain text without escapes, the button name becomes Copied and resets after 2 seconds", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(createElement(Terminal, { output: `${E}[31mfail${E}[0m\nnext` }));
    });
    const button = () => host!.querySelector<HTMLButtonElement>('[data-slot="terminal-copy"]')!;
    expect(button().getAttribute("aria-label")).toBe("Copy output");
    await act(async () => button().click());
    expect(writeText).toHaveBeenCalledWith("fail\nnext");
    expect(button().getAttribute("aria-label")).toBe("Copied");
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(button().getAttribute("aria-label")).toBe("Copy output");
  });

  test("maxLines as --term-lines; growing output scrolls to the bottom when already there", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    const state = { scrollHeight: 300 };
    const proto = HTMLElement.prototype;
    const original = Object.getOwnPropertyDescriptor(proto, "scrollHeight");
    Object.defineProperty(proto, "scrollHeight", {
      configurable: true,
      get: () => state.scrollHeight,
    });
    try {
      await act(async () => {
        root!.render(createElement(Terminal, { output: "a", maxLines: 8 }));
      });
      const pre = host.querySelector<HTMLElement>("pre")!;
      expect(pre.style.getPropertyValue("--term-lines")).toBe("8");
      expect(pre.scrollTop).toBe(300);
      state.scrollHeight = 500;
      await act(async () => {
        root!.render(createElement(Terminal, { output: "a\nb\nc", maxLines: 8 }));
      });
      expect(pre.scrollTop).toBe(500);
    } finally {
      if (original) Object.defineProperty(proto, "scrollHeight", original);
      else delete (proto as { scrollHeight?: number }).scrollHeight;
    }
  });

  test("labels switch language", () => {
    const html = ssr(
      createElement(Terminal, {
        output: "",
        status: "done",
        labels: { copy: "Copy log", status: { done: "Finished" }, output: "Command log" },
      }),
    );
    expect(html).toContain('aria-label="Copy log"');
    expect(html).toContain(">Finished<");
    expect(html).toContain('aria-label="Command log"');
  });
});
