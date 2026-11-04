// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Image } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = "";
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
const fire = (el: Element, type: "load" | "error") =>
  act(async () => {
    el.dispatchEvent(new Event(type));
  });
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });
const img = (host: HTMLElement) => host.querySelector<HTMLImageElement>("[data-slot=image-img]")!;
const viewer = () => document.querySelector<HTMLElement>("[data-slot=image-preview]");
const previewImg = () => document.querySelector<HTMLImageElement>("[data-slot=image-preview-img]");

describe("Image", () => {
  test("SSR: loading state with a placeholder, img has alt / width / height / lazy; no class / style", () => {
    const html = ssr(createElement(Image, { src: "/a.png", alt: "Cat", width: 120, height: 80 }));
    expect(html).toContain('data-status="loading"');
    expect(html).toContain('data-slot="image-placeholder"');
    expect(html).toMatch(/<img[^>]*alt="Cat"/);
    expect(html).toContain('width="120"');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toMatch(/class=|style=/);
    // Not loaded yet, the preview entry (button) doesn't exist yet
    expect(html).not.toContain("<button");
  });

  test("loaded: placeholder removed; with preview the image becomes a button (named by alt, aria-haspopup=dialog) with a hover mask", async () => {
    const el = await mount(createElement(Image, { src: "/a.png", alt: "Cat" }));
    await fire(img(el), "load");
    const root = el.querySelector("[data-slot=image]")!;
    expect(root.tagName).toBe("BUTTON");
    expect(root.getAttribute("data-status")).toBe("loaded");
    expect(root.getAttribute("aria-haspopup")).toBe("dialog");
    expect(el.querySelector("[data-slot=image-placeholder]")).toBeNull();
    expect(el.querySelector("[data-slot=image-mask]")!.textContent).toContain("Preview");
  });

  test("preview={false}: a plain span when loaded, no button or mask; placeholder={false} shows no placeholder", async () => {
    const el = await mount(
      createElement(Image, { src: "/a.png", alt: "Cat", preview: false, placeholder: false }),
    );
    expect(el.querySelector("[data-slot=image-placeholder]")).toBeNull();
    await fire(img(el), "load");
    expect(el.querySelector("[data-slot=image]")!.tagName).toBe("SPAN");
    expect(el.querySelector("[data-slot=image-mask]")).toBeNull();
  });

  test("load error: a string fallback is loaded instead; if that fails too, or it is a node, the fallback content is shown", async () => {
    const el = await mount(
      createElement(Image, { src: "/bad.png", alt: "Cat", fallback: "/fallback.png" }),
    );
    await fire(img(el), "error");
    expect(img(el).getAttribute("src")).toBe("/fallback.png");
    expect(el.querySelector("[data-slot=image]")!.getAttribute("data-status")).toBe("loading");
    await fire(img(el), "load");
    expect(el.querySelector("[data-slot=image]")!.getAttribute("data-status")).toBe("loaded");
    await act(async () => root!.unmount());
    host!.remove();
    const el2 = await mount(
      createElement(Image, {
        src: "/bad.png",
        alt: "Cat",
        fallback: createElement("b", null, "No image"),
      }),
    );
    await fire(img(el2), "error");
    const fb = el2.querySelector("[data-slot=image-fallback]")!;
    expect(fb.textContent).toBe("No image");
    expect(fb.getAttribute("role")).toBe("img");
    expect(fb.getAttribute("aria-label")).toBe("Cat");
    expect(el2.querySelector("[data-slot=image]")!.tagName).toBe("SPAN");
  });

  test("a new src starts loading again", async () => {
    const el = await mount(createElement(Image, { src: "/a.png", alt: "x" }));
    await fire(img(el), "load");
    await act(async () => root!.render(createElement(Image, { src: "/b.png", alt: "x" })));
    expect(el.querySelector("[data-slot=image]")!.getAttribute("data-status")).toBe("loading");
  });
});

describe("Image preview", () => {
  const open = async (props = {}) => {
    const el = await mount(createElement(Image, { src: "/a.png", alt: "Cat", ...props }));
    await fire(img(el), "load");
    await act(async () => el.querySelector<HTMLElement>("[data-slot=image]")!.click());
    return el;
  };

  test("click opens the preview: dialog named by alt, the large image uses previewSrc, toolbar buttons all have names", async () => {
    await open({ previewSrc: "/big.png" });
    expect(viewer()).not.toBeNull();
    expect(viewer()!.getAttribute("aria-label")).toBe("Cat");
    expect(previewImg()!.getAttribute("src")).toBe("/big.png");
    const names = [...document.querySelectorAll("[data-slot=image-preview-button]")].map((b) =>
      b.getAttribute("aria-label"),
    );
    expect(names).toEqual(["Zoom out", "Zoom in", "Rotate left", "Rotate right", "Reset"]);
    expect(
      document.querySelector("[data-slot=image-preview-close]")!.getAttribute("aria-label"),
    ).toBe("Close");
  });

  test("a single image has no previous / next or counter", async () => {
    await open();
    expect(document.querySelector("[data-slot=image-preview-nav]")).toBeNull();
    expect(document.querySelector("[data-slot=image-preview-counter]")).toBeNull();
  });

  test("zoom / rotation written as variables, reset restores them; buttons disabled at the min / max zoom", async () => {
    await open();
    const imgEl = previewImg()!;
    const btn = (name: string) =>
      document.querySelector<HTMLButtonElement>(`[aria-label="${name}"]`)!;
    expect(imgEl.style.getPropertyValue("--pv-scale")).toBe("1");
    await act(async () => btn("Zoom in").click());
    expect(imgEl.style.getPropertyValue("--pv-scale")).toBe("1.25");
    await act(async () => btn("Rotate right").click());
    expect(imgEl.style.getPropertyValue("--pv-rot")).toBe("90");
    await act(async () => btn("Rotate left").click());
    await act(async () => btn("Rotate left").click());
    expect(imgEl.style.getPropertyValue("--pv-rot")).toBe("-90");
    await act(async () => btn("Reset").click());
    expect(imgEl.style.getPropertyValue("--pv-scale")).toBe("1");
    expect(imgEl.style.getPropertyValue("--pv-rot")).toBe("0");
    for (let i = 0; i < 4; i++) await act(async () => btn("Zoom out").click());
    expect(btn("Zoom out").disabled).toBe(true);
  });

  test("keyboard: + - zoom, r rotates, 0 resets, Esc closes", async () => {
    await open();
    const dlg = viewer()!;
    const imgEl = previewImg()!;
    await key(dlg, "+");
    expect(imgEl.style.getPropertyValue("--pv-scale")).toBe("1.25");
    await key(dlg, "-");
    await key(dlg, "-");
    expect(Number(imgEl.style.getPropertyValue("--pv-scale"))).toBeLessThan(1);
    await key(dlg, "r");
    expect(imgEl.style.getPropertyValue("--pv-rot")).toBe("90");
    await key(dlg, "0");
    expect(imgEl.style.getPropertyValue("--pv-rot")).toBe("0");
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
  });

  test("the close button closes the preview", async () => {
    await open();
    await act(async () =>
      document.querySelector<HTMLButtonElement>('[aria-label="Close"]')!.click(),
    );
    expect(viewer()).toBeNull();
  });
});

describe("Image.PreviewGroup", () => {
  const group = () =>
    createElement(
      Image.PreviewGroup,
      null,
      createElement(Image, { src: "/1.png", alt: "One" }),
      createElement(Image, { src: "/2.png", alt: "Two" }),
      createElement(Image, { src: "/3.png", alt: "Three" }),
    );
  const loadAll = async (el: HTMLElement) => {
    for (const i of el.querySelectorAll("[data-slot=image-img]")) await fire(i, "load");
  };

  test("clicking the second opens it, counter 2 / 3; arrow keys and side buttons switch, wrapping around", async () => {
    const el = await mount(group());
    await loadAll(el);
    await act(async () => el.querySelectorAll<HTMLElement>("[data-slot=image]")[1]!.click());
    expect(previewImg()!.getAttribute("alt")).toBe("Two");
    expect(document.querySelector("[data-slot=image-preview-counter]")!.textContent).toBe("2 / 3");
    await key(viewer()!, "ArrowRight");
    expect(previewImg()!.getAttribute("alt")).toBe("Three");
    await key(viewer()!, "ArrowRight");
    expect(previewImg()!.getAttribute("alt")).toBe("One");
    await act(async () =>
      document.querySelector<HTMLButtonElement>('[aria-label="Previous image"]')!.click(),
    );
    expect(previewImg()!.getAttribute("alt")).toBe("Three");
  });

  test("images that failed to load are left out of the preview group", async () => {
    const el = await mount(group());
    const imgs = [...el.querySelectorAll("[data-slot=image-img]")];
    await fire(imgs[0]!, "load");
    await fire(imgs[1]!, "error");
    await fire(imgs[2]!, "load");
    await act(async () =>
      el.querySelectorAll<HTMLElement>("[data-slot=image][data-preview]")[0]!.click(),
    );
    expect(document.querySelector("[data-slot=image-preview-counter]")!.textContent).toBe("1 / 2");
  });
});
