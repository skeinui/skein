// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Accordion, Alert, AlertDialog, Breadcrumb, Skeleton, Slider } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);

describe("Alert / Skeleton / Breadcrumb (SSR)", () => {
  test("Alert has title, description and the default icon; danger uses role=alert", () => {
    const html = ssr(
      createElement(
        Alert,
        { color: "danger", title: "Something went wrong", onClose: () => {} },
        "Please try again",
      ),
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('data-variant="soft"');
    expect(html).toContain('data-color="danger"');
    expect(html).toContain('data-slot="alert-icon"');
    expect(html).toContain('data-slot="alert-title"');
    expect(html).toContain('data-slot="alert-description"');
    expect(html).toContain('data-slot="alert-close"');
    expect(html).not.toContain("class=");
  });

  test("Alert icon=false renders no icon", () => {
    expect(ssr(createElement(Alert, { icon: false }, "x"))).not.toContain("alert-icon");
  });

  test("Skeleton text with several lines uses a group, the last line has data-last", () => {
    const html = ssr(createElement(Skeleton, { lines: 3 }));
    expect(html).toContain('data-slot="skeleton-group"');
    expect(html.match(/data-slot="skeleton"/g)?.length).toBe(3);
    expect(html.match(/data-last/g)?.length).toBe(1);
    expect(ssr(createElement(Skeleton, { shape: "circle" }))).toContain('data-shape="circle"');
  });

  test("Breadcrumb's last item is the current page, the others have separators", () => {
    const html = ssr(
      createElement(Breadcrumb, {
        items: [{ label: "Home", href: "/" }, { label: "Users", href: "/users" }, { label: "Ann" }],
      }),
    );
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html.match(/data-slot="breadcrumb-link"/g)?.length).toBe(2);
    expect(html.match(/data-slot="breadcrumb-separator"/g)?.length).toBe(2);
    expect(html).toContain('aria-current="page"');
  });
});

describe("Accordion / Slider / AlertDialog (DOM)", () => {
  const mounted: { unmount: () => void; el: HTMLElement }[] = [];
  afterEach(async () => {
    for (const m of mounted.splice(0)) {
      await act(async () => m.unmount());
      m.el.remove();
    }
    document.body.innerHTML = "";
  });
  async function mount(node: React.ReactNode) {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    mounted.push({ unmount: () => root.unmount(), el });
    await act(async () => root.render(node));
    return el;
  }

  test("Accordion: clicking the header opens the panel and sets data-panel-open", async () => {
    const el = await mount(
      createElement(
        Accordion,
        { variant: "bordered" },
        createElement(
          Accordion.Item,
          { value: "a" },
          createElement(Accordion.Trigger, null, "A"),
          createElement(Accordion.Panel, null, "Content A"),
        ),
      ),
    );
    expect(el.querySelector('[data-slot="accordion"]')?.getAttribute("data-variant")).toBe(
      "bordered",
    );
    const trigger = el.querySelector('[data-slot="accordion-trigger"]') as HTMLElement;
    expect(trigger.hasAttribute("data-panel-open")).toBe(false);
    await act(async () => trigger.click());
    expect(trigger.hasAttribute("data-panel-open")).toBe(true);
    expect(el.querySelector('[data-slot="accordion-content"]')?.textContent).toBe("Content A");
  });

  test("Slider renders one thumb for a value, two for a range", async () => {
    const one = await mount(
      createElement(Slider, { defaultValue: 30, label: "Volume", showValue: true }),
    );
    expect(one.querySelectorAll('[data-slot="slider-thumb"]').length).toBe(1);
    expect(one.querySelector('[data-slot="slider-label"]')?.textContent).toBe("Volume");
    const two = await mount(createElement(Slider, { defaultValue: [20, 60] }));
    expect(two.querySelectorAll('[data-slot="slider-thumb"]').length).toBe(2);
  });

  test("AlertDialog reuses the Dialog slots, no close button by default", async () => {
    await mount(
      createElement(
        AlertDialog,
        { open: true },
        createElement(
          AlertDialog.Content,
          null,
          createElement(AlertDialog.Title, null, "Delete?"),
          createElement(AlertDialog.Description, null, "This cannot be undone"),
          createElement(AlertDialog.Footer, null, "Buttons"),
        ),
      ),
    );
    const dialog = document.body.querySelector('[data-slot="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("data-size")).toBe("sm");
    expect(dialog?.hasAttribute("data-alert")).toBe(true);
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe("Delete?");
    expect(document.body.querySelector('[data-slot="dialog-close"]')).toBeNull();
    expect(document.body.querySelector('[data-slot="dialog-backdrop"]')).not.toBeNull();
  });
});
