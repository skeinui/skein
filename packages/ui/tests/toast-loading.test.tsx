// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, test } from "vite-plus/test";
import { Toaster, toast } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const item = () => document.body.querySelector('[data-slot="toast"]');

test("toast.loading: spinner icon, no auto close; still the same toast after update to success; close removes it", async () => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => {
    root.render(createElement(Toaster, { timeout: 50 }));
  });
  let id = "";
  await act(async () => {
    id = toast.loading("Saving…");
  });
  expect(item()?.getAttribute("data-type")).toBe("loading");
  expect(document.body.querySelector('[data-slot="toast-icon"]')).not.toBeNull();
  await act(async () => {
    await new Promise((r) => setTimeout(r, 200));
  });
  expect(item()).not.toBeNull();
  await act(async () => {
    toast.update(id, { type: "success", title: "Saved", timeout: 0 });
  });
  expect(item()?.getAttribute("data-type")).toBe("success");
  expect(document.body.querySelectorAll('[data-slot="toast"]')).toHaveLength(1);
  await act(async () => {
    toast.close(id);
    await new Promise((r) => setTimeout(r, 100));
  });
  expect(item() === null || item()!.hasAttribute("data-ending-style")).toBe(true);
  await act(async () => root.unmount());
  el.remove();
});
