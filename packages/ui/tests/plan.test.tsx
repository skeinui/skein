// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Plan } from "../src/index.ts";
import type { PlanItem } from "../src/index.ts";

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

const items: PlanItem[] = [
  { id: "a", label: "Read the code", status: "done" },
  { id: "b", label: "Write the parser", status: "active", detail: "Handling tables" },
  { id: "c", label: "Add tests", status: "pending" },
  { id: "d", label: "Port docs", status: "skipped", detail: "Out of scope" },
  { id: "e", label: "Ship", status: "failed" },
];

describe("Plan", () => {
  test("SSR: title, progress (done + skipped), progress bar aria, status text per item, no class / style", () => {
    const html = ssr(createElement(Plan, { title: "Build the parser", items }));
    expect(html).toContain('data-slot="plan-title">Build the parser<');
    expect(html).toContain('data-slot="plan-count">2 / 5<');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="2"');
    expect(html).toContain('aria-valuemax="5"');
    expect(html).toContain('aria-label="Plan progress"');
    expect(html).toContain('data-slot="plan-item-status">Done: <');
    expect(html).toContain('data-slot="plan-item-status">In progress: <');
    expect(html).toContain('data-slot="plan-item-status">Failed: <');
    expect(html).toContain('data-slot="plan-item-detail">Handling tables<');
    expect(html).toContain("<ol");
    // The style on the panel is written by Base UI (used for measuring height)
    expect(html).not.toMatch(/\sclass=/);
    expect(html.replace(/<div[^>]*data-slot="plan-panel"[^>]*>/, "")).not.toMatch(/\sstyle=/);
  });

  test("the active item has aria-current=step and a spinner; icons per status", () => {
    const html = ssr(createElement(Plan, { title: "t", items }));
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('data-slot="plan-spinner"');
    expect(
      html.match(/data-slot="plan-item-icon" data-status="(done|failed|skipped)"/g),
    ).toHaveLength(3);
    // A todo is an empty circle, no svg
    expect(html).toMatch(/data-status="pending" aria-hidden="true"><\/span>/);
  });

  test("open by default, collapsible; defaultOpen=false starts collapsed", async () => {
    expect(ssr(createElement(Plan, { title: "t", items }))).toContain('aria-expanded="true"');
    expect(ssr(createElement(Plan, { title: "t", items, defaultOpen: false }))).toContain(
      'aria-expanded="false"',
    );
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(Plan, { title: "t", items }));
    });
    const trigger = host.querySelector<HTMLButtonElement>('[data-slot="plan-trigger"]')!;
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("progress is written as --plan-progress", async () => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(Plan, { title: "t", items }));
    });
    expect(
      host
        .querySelector<HTMLElement>('[data-slot="plan-bar-fill"]')!
        .style.getPropertyValue("--plan-progress"),
    ).toBe("40%");
  });

  test("no tasks: 0 / 0, 0% progress", async () => {
    const html = ssr(createElement(Plan, { title: "empty", items: [] }));
    expect(html).toContain("0 / 0");
    expect(html).toContain('aria-valuemax="0"');
  });

  test("labels switch language", () => {
    const html = ssr(
      createElement(Plan, {
        title: "t",
        items: [{ id: "a", label: "x", status: "done" }],
        labels: { status: { done: "Finished" }, progress: "Steps completed" },
      }),
    );
    expect(html).toContain("Finished: ");
    expect(html).toContain('aria-label="Steps completed"');
  });
});
