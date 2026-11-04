// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { BorderBeam } from "../src/index.ts";
import type { BorderBeamProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(props: Partial<BorderBeamProps> = {}) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(
      createElement(BorderBeam, { ...props, children: createElement("p", null, "Panel") }),
    );
  });
  return document.querySelector<HTMLElement>('[data-slot="border-beam"]')!;
}

describe("BorderBeam", () => {
  test("SSR: wraps the content, the beam layer is an aria-hidden SVG, one beam by default (16 segments), radius / trigger written as attributes, no class / style", () => {
    const html = renderToStaticMarkup(
      createElement(BorderBeam, null, createElement("p", null, "Panel")),
    );
    expect(html).toContain("<p>Panel</p>");
    expect(html).toMatch(/<svg[^>]*data-slot="border-beam-layer"[^>]*aria-hidden="true"/);
    expect(html.match(/data-slot="border-beam-beam"/g)).toHaveLength(16);
    expect(html).toContain('pathLength="1000"');
    expect(html).toContain('data-radius="lg"');
    expect(html).toContain('data-trigger="always"');
    expect(html).not.toMatch(/class=|style=/);
  });

  const beamsOf = (el: HTMLElement) => [
    ...el.querySelectorAll<SVGElement>('[data-slot="border-beam-beam"]'),
  ];
  const v = (e: SVGElement, name: string) => e.style.getPropertyValue(name);

  test("count beams of 16 segments each, each carrying its beam index (--bb-i) and segment index (--bb-k); non-positive integers count as 1", async () => {
    const el = await mount({ count: 3 });
    const beams = beamsOf(el);
    expect(beams).toHaveLength(48);
    expect([...new Set(beams.map((b) => v(b, "--bb-i")))]).toEqual(["0", "1", "2"]);
    expect(beams.slice(0, 16).map((b) => v(b, "--bb-k"))).toEqual(
      Array.from({ length: 16 }, (_, i) => String(i)),
    );
    expect(el.style.getPropertyValue("--bb-count")).toBe("3");
    await act(async () => root!.unmount());
    host!.remove();
    expect(beamsOf(await mount({ count: 0 }))).toHaveLength(16);
  });

  test("numbers written as CSS variables: duration, width, outset; segment length derived from the perimeter", async () => {
    const el = await mount({ duration: 3, lineWidth: 2, outset: 4, size: 100 });
    expect(el.style.getPropertyValue("--bb-duration")).toBe("3s");
    expect(el.style.getPropertyValue("--bb-line")).toBe("2px");
    expect(el.style.getPropertyValue("--bb-outset")).toBe("4px");
    // The radius is measured and written as --bb-r (at most half the short side), shared by rx / ry, so the ends of a pill shape are round
    expect(el.style.getPropertyValue("--bb-r")).toMatch(/^\d+(\.\d+)?px$/);
    // In jsdom the size is 0, the perimeter takes a lower bound of 1, and the segment length takes the cap of a full circle
    expect(Number(el.style.getPropertyValue("--bb-segfrac"))).toBeGreaterThan(0);
  });

  test("opacity decreases from head to tail; colors: primary when none given; a single color; a gradient interpolates between neighbouring stops, the head is the first color", async () => {
    let el = await mount();
    let beams = beamsOf(el);
    const opacities = beams.map((b) => Number(v(b, "--bb-o")));
    expect(opacities[0]!).toBeGreaterThan(0.9);
    expect(opacities.every((o, i) => i === 0 || o < opacities[i - 1]!)).toBe(true);
    expect(v(beams[0]!, "--bb-c")).toBe("var(--ui-c-primary)");
    await act(async () => root!.unmount());
    host!.remove();
    el = await mount({ color: "#ff0000" });
    expect(new Set(beamsOf(el).map((b) => v(b, "--bb-c")))).toEqual(new Set(["#ff0000"]));
    await act(async () => root!.unmount());
    host!.remove();
    el = await mount({
      color: [
        { color: "#1677ff", percent: 0 },
        { color: "#95de64", percent: 100 },
      ],
    });
    beams = beamsOf(el);
    expect(v(beams[0]!, "--bb-c")).toContain("color-mix");
    expect(v(beams[0]!, "--bb-c")).toContain("#1677ff");
    expect(v(beams[15]!, "--bb-c")).toContain("#95de64 100.0%");
  });

  test("fit written as an attribute, absent by default", async () => {
    expect((await mount()).hasAttribute("data-fit")).toBe(false);
    await act(async () => root!.unmount());
    host!.remove();
    expect((await mount({ fit: true })).hasAttribute("data-fit")).toBe(true);
  });

  test("trigger=hover and radius written as attributes", async () => {
    const el = await mount({ trigger: "hover", radius: "md" });
    expect(el.getAttribute("data-trigger")).toBe("hover");
    expect(el.getAttribute("data-radius")).toBe("md");
  });
});
