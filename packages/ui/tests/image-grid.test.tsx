// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { ImageGrid } from "../src/index.ts";
import type { ImageGridItem, ImageGridProps } from "../src/index.ts";

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
async function mount(props: ImageGridProps) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root!.render(createElement(ImageGrid, props)));
  return host;
}
const q = (s: string) => host!.querySelector<HTMLElement>(s);
const qa = (s: string) => [...host!.querySelectorAll<HTMLElement>(s)];

const item = (n: number, extra: Partial<ImageGridItem> = {}): ImageGridItem => ({
  id: `i${n}`,
  alt: `Image ${n}`,
  src: `https://example.com/${n}.png`,
  ...extra,
});

describe("<ImageGrid />", () => {
  test("SSR has no class / style; a list with one li per cell", () => {
    const html = ssr(createElement(ImageGrid, { items: [item(1), item(2)] }));
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
    expect(html).toMatch(/^<ul/);
    expect(html.match(/<li/g)).toHaveLength(2);
  });

  test("columns follow the image count or can be set; aspect ratio written as data-ratio", async () => {
    const cols = (n: number) =>
      ssr(createElement(ImageGrid, { items: Array.from({ length: n }, (_, i) => item(i)) })).match(
        /data-columns="(\d)"/,
      )![1];
    expect([1, 2, 4, 5, 9, 10].map(cols)).toEqual(["1", "2", "2", "3", "3", "4"]);
    await mount({ items: [item(1)], columns: 3, ratio: "wide" });
    expect(q('[data-slot="image-grid"]')!.dataset.columns).toBe("3");
    expect(q('[data-slot="image-grid"]')!.dataset.ratio).toBe("wide");
  });

  test("ready cells are Images (a button named with alt once loaded), previewed as a group", async () => {
    await mount({ items: [item(1), item(2)] });
    // jsdom doesn't actually load images, trigger load manually
    await act(async () => {
      for (const img of qa('[data-slot="image-img"]')) img.dispatchEvent(new Event("load"));
    });
    const buttons = qa(
      '[data-slot="image-grid-item"][data-status="ready"] button[data-slot="image"]',
    );
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.querySelector("img")?.getAttribute("alt")).toBe("Image 1");
    await act(async () => buttons[0]!.click());
    expect(document.querySelector('[data-slot="image-preview"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="image-preview-nav"]')).not.toBeNull();
  });

  test("loading: placeholder + status text; the group is aria-busy; a progress bar only with progress (readable by screen readers)", async () => {
    await mount({
      items: [
        item(1),
        { id: "l", alt: "Image 2", status: "loading", progress: 42.4 },
        { id: "l2", alt: "Image 3", status: "loading" },
      ],
    });
    expect(q('[data-slot="image-grid"]')!.getAttribute("aria-busy")).toBe("true");
    const loading = qa('[data-slot="image-grid-item"][data-status="loading"]');
    expect(loading).toHaveLength(2);
    expect(loading[0]!.querySelector('[data-slot="image-grid-status"]')?.textContent).toBe(
      "Generating image 2",
    );
    const bar = loading[0]!.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("100");
    expect(
      loading[0]!
        .querySelector<HTMLElement>('[data-slot="image-grid-progress-bar"]')!
        .style.getPropertyValue("--grid-progress"),
    ).toBe("42.4%");
    expect(loading[1]!.querySelector('[role="progressbar"]')).toBeNull();
  });

  test("no aria-busy once all are ready; a ready item without src is treated as failed and renders no image", async () => {
    await mount({ items: [item(1), { id: "x", alt: "No src" }] });
    expect(q('[data-slot="image-grid"]')!.hasAttribute("aria-busy")).toBe(false);
    expect(qa('[data-slot="image-grid-item"]')[1]!.dataset.status).toBe("ready");
    expect(qa('[data-slot="image-grid-item"]')[1]!.querySelector("img")).toBeNull();
  });

  test("failed: shows the reason (or default text); a retry button only with onRetry, clicking passes that item", async () => {
    const onRetry = vi.fn();
    const bad = { id: "e", alt: "Image 2", status: "error" as const, error: "Content blocked" };
    await mount({ items: [item(1), bad, { id: "e2", alt: "Image 3", status: "error" }], onRetry });
    const errors = qa('[data-slot="image-grid-item"][data-status="error"]');
    expect(errors[0]!.querySelector('[data-slot="image-grid-message"]')?.textContent).toBe(
      "Content blocked",
    );
    expect(errors[1]!.querySelector('[data-slot="image-grid-message"]')?.textContent).toBe(
      "Failed to load",
    );
    await act(async () =>
      errors[0]!.querySelector<HTMLButtonElement>('[data-slot="image-grid-retry"]')!.click(),
    );
    expect(onRetry).toHaveBeenCalledWith(bad);
  });

  test("no onRetry / onRemove / actions, no matching buttons", async () => {
    await mount({ items: [item(1), { id: "e", alt: "x", status: "error" }] });
    expect(q('[data-slot="image-grid-retry"]')).toBeNull();
    expect(q('[data-slot="image-grid-remove"]')).toBeNull();
    expect(q('[data-slot="image-grid-actions"]')).toBeNull();
  });

  test("onRemove: a named remove button per cell; actions only appear in ready cells", async () => {
    const onRemove = vi.fn();
    const first = item(1);
    await mount({
      items: [first, { id: "l", alt: "Image 2", status: "loading" }],
      onRemove,
      actions: (it) => createElement(ImageGrid.Action, { "aria-label": `Download ${it.alt}` }, "↓"),
    });
    const removes = qa('[data-slot="image-grid-remove"]');
    expect(removes.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Remove Image 1",
      "Remove Image 2",
    ]);
    await act(async () => removes[0]!.click());
    expect(onRemove).toHaveBeenCalledWith(first);
    const actions = qa('[data-slot="image-grid-actions"]');
    expect(actions).toHaveLength(1);
    expect(actions[0]!.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Download Image 1",
    );
    expect(actions[0]!.closest("li")!.dataset.status).toBe("ready");
  });

  test("labels take effect", async () => {
    await mount({
      items: [
        { id: "l", alt: "cat", status: "loading", progress: 10 },
        { id: "e", alt: "dog", status: "error" },
      ],
      onRetry: () => {},
      onRemove: () => {},
      labels: {
        loading: (n) => `Drawing image ${n}`,
        failed: "Broke",
        retry: "Again",
        remove: (alt) => `Discard ${alt}`,
        progress: "Done so far",
      },
    });
    expect(q('[data-slot="image-grid-status"]')?.textContent).toBe("Drawing image 1");
    expect(q('[role="progressbar"]')?.getAttribute("aria-label")).toBe("Done so far");
    expect(q('[data-slot="image-grid-message"]')?.textContent).toBe("Broke");
    expect(q('[data-slot="image-grid-retry"]')?.textContent).toBe("Again");
    expect(q('[data-slot="image-grid-remove"]')?.getAttribute("aria-label")).toBe("Discard cat");
  });
});
