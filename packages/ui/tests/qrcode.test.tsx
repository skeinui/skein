// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { QRCode, QRTooLongError, encodeQR } from "../src/index.ts";
import type { QRCodeProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
function mount(props: QRCodeProps) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(createElement(QRCode, props)));
  return host;
}
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });

/** Read the format information (error correction level and mask), verifying the BCH code per the spec. */
function readFormat(modules: boolean[][]) {
  const n = modules.length;
  const bits: number[] = [];
  for (let i = 0; i <= 5; i++) bits.push(modules[i]![8] ? 1 : 0);
  bits.push(modules[7]![8] ? 1 : 0, modules[8]![8] ? 1 : 0, modules[8]![7] ? 1 : 0);
  for (let i = 9; i < 15; i++) bits.push(modules[8]![14 - i] ? 1 : 0);
  let word = 0;
  bits.forEach((b, i) => (word |= b << i));
  const second: number[] = [];
  for (let i = 0; i < 8; i++) second.push(modules[8]![n - 1 - i] ? 1 : 0);
  for (let i = 8; i < 15; i++) second.push(modules[n - 15 + i]![8] ? 1 : 0);
  let word2 = 0;
  second.forEach((b, i) => (word2 |= b << i));
  const data = (word ^ 0x5412) >> 10;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return {
    word,
    word2,
    valid: (((data << 10) | rem) ^ 0x5412) === word,
    level: data >> 3,
    mask: data & 7,
  };
}

/** Hash of the matrix text; the same input must always give the same matrix (when changing the encoder, first confirm it still scans before updating). */
const HELLO_WORLD_Q_HASH = 1251743882;

describe("encodeQR", () => {
  test("version grows with content, size = version × 4 + 17; capacity limits", () => {
    expect(encodeQR("A", "L").version).toBe(1);
    expect(encodeQR("A", "L").size).toBe(21);
    // Version 1, level L: byte mode holds at most 17 bytes, numeric mode at most 41 digits
    expect(encodeQR("x".repeat(17), "L").version).toBe(1);
    expect(encodeQR("x".repeat(18), "L").version).toBe(2);
    expect(encodeQR("1".repeat(41), "L").version).toBe(1);
    expect(encodeQR("1".repeat(42), "L").version).toBe(2);
    // Version 40, level L numeric mode limit is 7089 digits
    expect(encodeQR("1".repeat(7089), "L").version).toBe(40);
    expect(encodeQR("1".repeat(7089), "L").size).toBe(177);
    // The higher the error correction level, the less fits
    expect(encodeQR("x".repeat(30), "H").version).toBeGreaterThan(
      encodeQR("x".repeat(30), "L").version,
    );
  });

  test("content too long: throws QRTooLongError", () => {
    expect(() => encodeQR("1".repeat(7090), "L")).toThrow(QRTooLongError);
    expect(() => encodeQR("x".repeat(1274), "H")).toThrow(QRTooLongError);
  });

  test("the three finder patterns, timing patterns and the fixed dark module are present", () => {
    const { modules, size } = encodeQR("https://example.com", "M");
    const finder = (x0: number, y0: number) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
          expect(modules[y0 + y]![x0 + x], `${x0},${y0} (${x},${y})`).toBe(ring !== 2);
        }
      }
    };
    finder(0, 0);
    finder(size - 7, 0);
    finder(0, size - 7);
    for (let i = 8; i < size - 8; i++) {
      expect(modules[6]![i]).toBe(i % 2 === 0);
      expect(modules[i]![6]).toBe(i % 2 === 0);
    }
    expect(modules[size - 8]![8]).toBe(true);
  });

  test("format info: BCH check passes, both copies match, level and mask are valid", () => {
    for (const level of ["L", "M", "Q", "H"] as const) {
      const { modules } = encodeQR(`level ${level}`, level);
      const f = readFormat(modules);
      expect(f.valid).toBe(true);
      expect(f.word2).toBe(f.word);
      expect(f.level).toBe({ L: 1, M: 0, Q: 3, H: 2 }[level]);
      expect(f.mask).toBeGreaterThanOrEqual(0);
      expect(f.mask).toBeLessThan(8);
    }
  });

  test("deterministic: same input same matrix; different input differs; UTF-8 uses byte mode", () => {
    const a = encodeQR("你好", "M");
    const b = encodeQR("你好", "M");
    expect(a.modules).toEqual(b.modules);
    expect(encodeQR("你好!", "M").modules).not.toEqual(a.modules);
    // A two-character Chinese greeting is 6 UTF-8 bytes, still in version 1
    expect(a.version).toBe(1);
  });

  test("regression snapshot: matrix of a fixed input (cross-checked by decoding with OpenCV)", () => {
    const { modules } = encodeQR("HELLO WORLD", "Q");
    const text = modules.map((row) => row.map((m) => (m ? "#" : ".")).join("")).join("\n");
    let hash = 0;
    for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    expect(modules.length).toBe(21);
    expect(hash).toBe(HELLO_WORLD_Q_HASH);
  });
});

describe("QRCode", () => {
  test("SSR: svg, one path draws all modules, size and viewBox, no class / style", () => {
    const html = renderToStaticMarkup(createElement(QRCode, { value: "hello", size: 100 }));
    expect(html).toContain('data-slot="qrcode"');
    expect(html).toContain('width="100"');
    expect(html).toContain('viewBox="0 0 21 21"');
    expect(html.match(/data-slot="qrcode-modules"/g)).toHaveLength(1);
    expect(html).toContain('fill="black"');
    expect(html).toContain('fill="white"');
    expect(html).toContain('role="img"');
    expect(html).not.toContain("class=");
    expect(html).not.toContain("style=");
  });

  test("colors: color / bgColor go into fill, the quiet zone background uses --qr-bg", () => {
    const h = mount({ value: "x", color: "#123456", bgColor: "#fffbe6" });
    expect(h.querySelector('[data-slot="qrcode-modules"]')!.getAttribute("fill")).toBe("#123456");
    expect(h.querySelector('[data-slot="qrcode-background"]')!.getAttribute("fill")).toBe(
      "#fffbe6",
    );
    expect(
      h.querySelector<HTMLElement>('[data-slot="qrcode"]')!.style.getPropertyValue("--qr-bg"),
    ).toBe("#fffbe6");
  });

  test("module path matches the matrix: every dark module in the path maps back", () => {
    const h = mount({ value: "path check", errorLevel: "L" });
    const { modules, size } = encodeQR("path check", "L");
    const d = h.querySelector('[data-slot="qrcode-modules"]')!.getAttribute("d")!;
    const rebuilt = Array.from({ length: size }, () => Array.from({ length: size }, () => false));
    for (const m of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
      for (let i = 0; i < Number(m[3]); i++) rebuilt[Number(m[2])]![Number(m[1]) + i] = true;
    }
    expect(rebuilt).toEqual(modules);
  });

  test("icon: drawn in the center, raises error correction to H by default; an explicit errorLevel wins", () => {
    const withIcon = mount({ value: "icon", icon: "/logo.png", size: 200, iconSize: 40 });
    const image = withIcon.querySelector('[data-slot="qrcode-icon"]')!;
    const n = encodeQR("icon", "H").size;
    expect(withIcon.querySelector("svg")!.getAttribute("viewBox")).toBe(`0 0 ${n} ${n}`);
    const side = (40 / 200) * n;
    expect(Number(image.getAttribute("width"))).toBeCloseTo(side);
    expect(Number(image.getAttribute("x"))).toBeCloseTo((n - side) / 2);
    expect(image.getAttribute("href")).toBe("/logo.png");
    act(() => root!.unmount());
    host?.remove();
    const forced = mount({ value: "icon", icon: "/logo.png", errorLevel: "L" });
    expect(forced.querySelector("svg")!.getAttribute("viewBox")).toBe(
      `0 0 ${encodeQR("icon", "L").size} ${encodeQR("icon", "L").size}`,
    );
  });

  test("bordered on by default, can be turned off; content too long draws nothing and sets data-error", () => {
    const h = mount({ value: "x" });
    expect(h.querySelector('[data-slot="qrcode"]')!.hasAttribute("data-bordered")).toBe(true);
    act(() => root!.render(createElement(QRCode, { value: "x", bordered: false })));
    expect(h.querySelector('[data-slot="qrcode"]')!.hasAttribute("data-bordered")).toBe(false);
    act(() => root!.render(createElement(QRCode, { value: "1".repeat(8000), errorLevel: "L" })));
    expect(h.querySelector('[data-slot="qrcode"]')!.hasAttribute("data-error")).toBe(true);
    expect(h.querySelector("svg")).toBeNull();
  });

  test("status: active has no overlay; loading spins; expired has a refresh button with a callback; scanned shows a text; labels change the texts", () => {
    const h = mount({ value: "x" });
    expect(h.querySelector('[data-slot="qrcode-mask"]')).toBeNull();
    act(() => root!.render(createElement(QRCode, { value: "x", status: "loading" })));
    expect(h.querySelector('[data-slot="qrcode-spinner"]')).not.toBeNull();
    expect(h.querySelector("button")).toBeNull();
    let refreshed = 0;
    act(() =>
      root!.render(
        createElement(QRCode, {
          value: "x",
          status: "expired",
          onRefresh: () => refreshed++,
          labels: { expired: "Timed out", refresh: "Try again" },
        }),
      ),
    );
    expect(h.querySelector('[data-slot="qrcode-status"]')!.textContent).toBe("Timed out");
    click(h.querySelector("button")!);
    expect(refreshed).toBe(1);
    expect(h.querySelector("button")!.textContent).toBe("Try again");
    act(() => root!.render(createElement(QRCode, { value: "x", status: "scanned" })));
    expect(h.querySelector('[data-slot="qrcode-status"]')!.textContent).toBe("Scanned");
    expect(h.querySelector("button")).toBeNull();
  });
});
