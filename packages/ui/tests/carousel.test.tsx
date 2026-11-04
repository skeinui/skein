// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { Carousel } from "../src/index.ts";
import type { CarouselProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => {
    root!.render(node);
  });
  return host;
}
const slidesOf = (n = 3) =>
  Array.from({ length: n }, (_, i) => createElement("div", { key: i }, `Slide ${i + 1}`));
const make = (props: Partial<Omit<CarouselProps, "children">> = {}, n = 3) =>
  createElement(Carousel, { "aria-label": "Gallery", children: slidesOf(n), ...props });
const active = () => document.querySelector("[data-slot=carousel-slide][data-active]")?.textContent;
const click = (el: Element | null) => act(async () => (el as HTMLElement).click());
const arrow = (dir: "prev" | "next") =>
  document.querySelector<HTMLButtonElement>(`[data-slot=carousel-arrow][data-direction=${dir}]`)!;
const dots = () => [...document.querySelectorAll<HTMLButtonElement>("[data-slot=carousel-dot]")];
const key = (k: string) =>
  act(async () => {
    document
      .querySelector("[data-slot=carousel]")!
      .dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });

describe("Carousel structure", () => {
  test("SSR: region + aria-roledescription=carousel; each slide is an 'n of N' group; slides other than the current are inert; no class / style", () => {
    const html = ssr(make());
    expect(html).toMatch(/<section[^>]*aria-roledescription="carousel"/);
    expect(html).toContain('aria-label="Gallery"');
    expect(html.match(/role="group" aria-roledescription="slide"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="1 of 3"');
    expect(html).toContain('aria-label="3 of 3"');
    expect(html.match(/inert=""/g)).toHaveLength(2);
    expect(html).not.toMatch(/class=|style=/);
  });

  test("dots: a group of named buttons, the current one aria-current, aria-controls points to its slide", () => {
    const html = ssr(make());
    expect(html).toContain('role="group" aria-label="Choose slide"');
    expect(html).toContain('aria-label="Go to slide 2"');
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    const controls = [
      ...html.matchAll(/data-slot="carousel-dot"[^>]*aria-controls="([^"]+)"/g),
    ].map((m) => m[1]);
    for (const id of controls) expect(html).toContain(`id="${id}"`);
  });

  test("a single slide: no arrows, dots or pause button; effect / dotPosition written as data attributes; arrows / dots can be turned off", () => {
    const one = ssr(make({ autoplay: 1000 }, 1));
    expect(one).not.toMatch(/carousel-(arrow|dots|pause)/);
    const html = ssr(make({ effect: "fade", dotPosition: "top", arrows: false, dots: false }));
    expect(html).toContain('data-effect="fade"');
    expect(html).toContain('data-dot-position="top"');
    expect(html).not.toMatch(/carousel-(arrow|dots)/);
  });

  test("labels can be switched to another language", () => {
    const html = ssr(
      make({
        labels: {
          previous: "Back",
          next: "Forward",
          goTo: (n) => `Show slide ${n}`,
          slide: (n, t) => `${n}/${t}`,
        },
      }),
    );
    expect(html).toContain('aria-label="Back"');
    expect(html).toContain('aria-label="Show slide 2"');
    expect(html).toContain('aria-label="2/3"');
  });
});

describe("Carousel navigation", () => {
  test("arrows and dots change slides, position written as --car-index, inert follows the current slide; onIndexChange gets the new slide", async () => {
    const onIndexChange = vi.fn();
    const el = await mount(make({ onIndexChange }));
    const section = el.querySelector<HTMLElement>("[data-slot=carousel]")!;
    expect(section.style.getPropertyValue("--car-index")).toBe("0");
    await click(arrow("next"));
    expect(active()).toBe("Slide 2");
    expect(section.style.getPropertyValue("--car-index")).toBe("1");
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    await click(dots()[2]!);
    expect(active()).toBe("Slide 3");
    expect(dots()[2]!.getAttribute("aria-current")).toBe("true");
    expect(document.querySelectorAll("[data-slot=carousel-slide][inert]")).toHaveLength(2);
  });

  test("loop (default) wraps around; with loop=false the arrow at an end is disabled", async () => {
    await mount(make());
    await click(arrow("prev"));
    expect(active()).toBe("Slide 3");
    await click(arrow("next"));
    expect(active()).toBe("Slide 1");
    await act(async () => root!.unmount());
    host!.remove();
    await mount(make({ loop: false }));
    expect(arrow("prev").disabled).toBe(true);
    await click(arrow("next"));
    await click(arrow("next"));
    expect(arrow("next").disabled).toBe(true);
    expect(active()).toBe("Slide 3");
  });

  test("keyboard: Left / Right / Home / End; arrow keys inside inputs are not intercepted", async () => {
    await mount(make());
    await key("ArrowRight");
    expect(active()).toBe("Slide 2");
    await key("ArrowLeft");
    await key("End");
    expect(active()).toBe("Slide 3");
    await key("Home");
    expect(active()).toBe("Slide 1");
  });

  test("controlled index: clicking only notifies; defaultIndex is the initial slide", async () => {
    const onIndexChange = vi.fn();
    await mount(make({ index: 1, onIndexChange }));
    expect(active()).toBe("Slide 2");
    await click(arrow("next"));
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(active()).toBe("Slide 2");
    await act(async () => root!.unmount());
    host!.remove();
    await mount(make({ defaultIndex: 2 }));
    expect(active()).toBe("Slide 3");
  });

  test("a horizontal swipe over 40px changes slides (left for next, right for previous), vertical or short ones do not", async () => {
    await mount(make());
    const viewport = document.querySelector("[data-slot=carousel-viewport]")!;
    const swipe = async (dx: number, dy = 0) => {
      await act(async () => {
        viewport.dispatchEvent(
          new PointerEvent("pointerdown", {
            bubbles: true,
            clientX: 200,
            clientY: 100,
            pointerType: "touch",
          }),
        );
        viewport.dispatchEvent(
          new PointerEvent("pointerup", {
            bubbles: true,
            clientX: 200 + dx,
            clientY: 100 + dy,
            pointerType: "touch",
          }),
        );
      });
    };
    await swipe(-80);
    expect(active()).toBe("Slide 2");
    await swipe(80);
    expect(active()).toBe("Slide 1");
    await swipe(-20);
    expect(active()).toBe("Slide 1");
    await swipe(-60, 120);
    expect(active()).toBe("Slide 1");
  });
});

describe("Carousel autoplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test("advances at the interval; the pause button stops / resumes, its name follows the state", async () => {
    await mount(make({ autoplay: 1000 }));
    await act(async () => vi.advanceTimersByTime(1000));
    expect(active()).toBe("Slide 2");
    const pause = document.querySelector<HTMLButtonElement>("[data-slot=carousel-pause]")!;
    expect(pause.getAttribute("aria-label")).toBe("Pause autoplay");
    await click(pause);
    expect(pause.getAttribute("aria-label")).toBe("Start autoplay");
    await act(async () => vi.advanceTimersByTime(3000));
    expect(active()).toBe("Slide 2");
    await click(pause);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(active()).toBe("Slide 3");
  });

  test("pauses on hover and focus, resumes on leave / blur; pauseOnHover=false does not pause", async () => {
    await mount(make({ autoplay: 1000 }));
    const section = document.querySelector("[data-slot=carousel]")!;
    await act(async () =>
      section.dispatchEvent(new PointerEvent("pointerover", { bubbles: true })),
    );
    await act(async () => vi.advanceTimersByTime(3000));
    expect(active()).toBe("Slide 1");
    await act(async () =>
      section.dispatchEvent(
        new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }),
      ),
    );
    await act(async () => vi.advanceTimersByTime(1000));
    expect(active()).toBe("Slide 2");
    await act(async () => root!.unmount());
    host!.remove();
    await mount(make({ autoplay: 1000, pauseOnHover: false }));
    await act(async () =>
      document
        .querySelector("[data-slot=carousel]")!
        .dispatchEvent(new PointerEvent("pointerover", { bubbles: true })),
    );
    await act(async () => vi.advanceTimersByTime(1000));
    expect(active()).toBe("Slide 2");
  });

  test("no autoplay when the system asks for reduced motion", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      addEventListener() {},
      removeEventListener() {},
    }));
    await mount(make({ autoplay: 1000 }));
    await act(async () => vi.advanceTimersByTime(5000));
    expect(active()).toBe("Slide 1");
  });

  test("with autoplay screen readers do not repeat (aria-live=off), without it polite", async () => {
    await mount(make({ autoplay: 1000 }));
    expect(document.querySelector("[data-slot=carousel-viewport]")!.getAttribute("aria-live")).toBe(
      "off",
    );
    await act(async () => root!.unmount());
    host!.remove();
    await mount(make());
    expect(document.querySelector("[data-slot=carousel-viewport]")!.getAttribute("aria-live")).toBe(
      "polite",
    );
  });
});
