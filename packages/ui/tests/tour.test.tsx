// @vitest-environment jsdom
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test } from "vite-plus/test";
import { Tour } from "../src/index.ts";
import type { TourProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
let target: HTMLElement;
beforeEach(() => {
  target = document.createElement("button");
  target.id = "t1";
  target.textContent = "target";
  target.getBoundingClientRect = () => new DOMRect(40, 60, 100, 30);
  document.body.appendChild(target);
});
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  target.remove();
  root = null;
  host = null;
});
function mount(el: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(el));
}
const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 30)));
const q = (sel: string) => document.querySelector<HTMLElement>(sel);
const qa = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
const buttonByText = (text: string) =>
  qa('[data-slot="tour-card"] button').find((b) => b.textContent === text)!;

const STEPS = [
  { target: "#t1", title: "One", description: "first" },
  { target: "#t1", title: "Two" },
  { title: "Three (centered)" },
];

function Harness(props: Partial<TourProps>) {
  const [open, setOpen] = useState(props.open ?? true);
  return createElement(Tour, {
    steps: STEPS,
    ...props,
    open,
    onOpenChange: (o: boolean) => {
      setOpen(o);
      props.onOpenChange?.(o);
    },
  });
}

describe("Tour", () => {
  test("server rendering outputs nothing (the mask lives under body)", () => {
    expect(renderToStaticMarkup(createElement(Tour, { steps: STEPS, open: true }))).toBe("");
  });

  test("nothing when closed; open shows mask, highlight and card, the target rect goes into root variables", async () => {
    mount(createElement(Tour, { steps: STEPS, open: false }));
    expect(q('[data-slot="tour-card"]')).toBeNull();
    act(() => root!.render(createElement(Tour, { steps: STEPS, open: true })));
    await settle();
    expect(q('[data-slot="tour-mask"]')).not.toBeNull();
    expect(q('[data-slot="tour-spotlight"]')).not.toBeNull();
    expect(q('[data-slot="tour-title"]')!.textContent).toBe("One");
    expect(q('[data-slot="tour-description"]')!.textContent).toBe("first");
    const tour = q('[data-slot="tour"]')!;
    expect(tour.style.getPropertyValue("--tour-x")).toBe("40");
    expect(tour.style.getPropertyValue("--tour-w")).toBe("100");
    expect(tour.hasAttribute("data-no-target")).toBe(false);
  });

  test("next / previous / finish: callbacks, progress dots, the last step's button finishes and closes", async () => {
    const currents: number[] = [];
    let finished = 0;
    const opens: boolean[] = [];
    mount(
      createElement(Harness, {
        onCurrentChange: (c: number) => currents.push(c),
        onFinish: () => finished++,
        onOpenChange: (o: boolean) => opens.push(o),
      }),
    );
    await settle();
    expect(qa('[data-slot="tour-indicator"]')).toHaveLength(3);
    expect(qa('[data-slot="tour-indicator"]')[0]!.hasAttribute("data-active")).toBe(true);
    expect(buttonByText("Previous")).toBeUndefined(); // no previous on the first step
    click(buttonByText("Next"));
    await settle();
    expect(q('[data-slot="tour-title"]')!.textContent).toBe("Two");
    click(buttonByText("Previous"));
    await settle();
    expect(q('[data-slot="tour-title"]')!.textContent).toBe("One");
    click(buttonByText("Next"));
    click(buttonByText("Next"));
    await settle();
    expect(currents).toEqual([1, 0, 1, 2]);
    expect(buttonByText("Next")).toBeUndefined();
    click(buttonByText("Finish"));
    await settle();
    expect(finished).toBe(1);
    expect(opens).toEqual([false]);
    expect(q('[data-slot="tour-card"]')).toBeNull();
  });

  test("a step without target: centered card, no highlight, the mask dims the whole screen", async () => {
    mount(createElement(Harness, { defaultCurrent: 2 }));
    await settle();
    expect(q('[data-slot="tour-center"]')).not.toBeNull();
    expect(q('[data-slot="tour-spotlight"]')).toBeNull();
    expect(q('[data-slot="tour"]')!.hasAttribute("data-no-target")).toBe(true);
    expect(q('[data-slot="tour-title"]')!.textContent).toBe("Three (centered)");
  });

  test("Esc closes (one callback); the X button closes; no X with closable=false", async () => {
    const opens: boolean[] = [];
    mount(createElement(Harness, { onOpenChange: (o: boolean) => opens.push(o) }));
    await settle();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await settle();
    expect(opens).toEqual([false]);
    expect(q('[data-slot="tour-card"]')).toBeNull();

    act(() => root!.render(createElement(Harness, { closable: false })));
    await settle();
    expect(q('[data-slot="tour-close"]')).toBeNull();
  });

  test("clicking the X closes", async () => {
    const opens: boolean[] = [];
    mount(createElement(Harness, { onOpenChange: (o: boolean) => opens.push(o) }));
    await settle();
    click(q('[data-slot="tour-close"]')!);
    await settle();
    expect(opens).toEqual([false]);
  });

  test("mask=false: no mask or highlight; indicators=count shows text, false hides the dots; labels change the texts", async () => {
    mount(
      createElement(Harness, {
        mask: false,
        indicators: "count",
        labels: { next: "Continue" },
      }),
    );
    await settle();
    expect(q('[data-slot="tour-mask"]')).toBeNull();
    expect(q('[data-slot="tour-spotlight"]')).toBeNull();
    expect(q('[data-slot="tour-indicators"]')!.textContent).toBe("1 / 3");
    expect(buttonByText("Continue")).toBeDefined();
    act(() => root!.render(createElement(Harness, { indicators: false })));
    await settle();
    expect(qa('[data-slot="tour-indicator"]')).toHaveLength(0);
  });

  test("controlled current: the parent decides the step, next only calls back", async () => {
    const currents: number[] = [];
    mount(
      createElement(Harness, {
        current: 1,
        onCurrentChange: (c: number) => currents.push(c),
      }),
    );
    await settle();
    expect(q('[data-slot="tour-title"]')!.textContent).toBe("Two");
    click(buttonByText("Next"));
    await settle();
    expect(currents).toEqual([2]);
    expect(q('[data-slot="tour-title"]')!.textContent).toBe("Two");
  });

  test("target can be a function, a ref or an element", async () => {
    const ref = { current: target };
    for (const t of [() => target, ref, target]) {
      mount(createElement(Harness, { steps: [{ target: t, title: "x" }] }));
      await settle();
      expect(q('[data-slot="tour-spotlight"]')).not.toBeNull();
      act(() => root?.unmount());
      host?.remove();
    }
  });
});
