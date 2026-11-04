// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { Button, ConfirmDialog, Popconfirm } from "../src/index.ts";
import type { PopconfirmProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: { unmount: () => void; el: HTMLElement }[] = [];
async function mount(node: React.ReactNode) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => {
    root.render(node);
  });
  mounted.push({ unmount: () => root.unmount(), el });
  return root;
}
afterEach(async () => {
  for (const m of mounted.splice(0)) {
    await act(async () => m.unmount());
    m.el.remove();
  }
  document.body.innerHTML = "";
});

const settle = () => act(() => new Promise<void>((r) => setTimeout(r, 40)));
const q = (sel: string) => document.body.querySelector<HTMLElement>(sel);
const clickEl = async (el: Element) => {
  await act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await settle();
};
const buttonByText = (scope: string, text: string) =>
  [...document.body.querySelectorAll<HTMLElement>(`${scope} button`)].find(
    (b) => b.textContent === text,
  )!;

/** An async confirmation whose completion time the test decides. */
function deferred() {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("ConfirmDialog", () => {
  test("clicking the trigger opens it with title / description / cancel / confirm, reusing the dialog slots", async () => {
    await mount(
      createElement(ConfirmDialog, {
        trigger: createElement(Button, null, "Delete"),
        title: "Delete project?",
        description: "This cannot be undone.",
        confirmLabel: "Delete",
        tone: "danger",
      }),
    );
    expect(q('[data-slot="dialog"]')).toBeNull();
    await clickEl(buttonByText("", "Delete"));
    expect(q('[data-slot="dialog"][data-alert]')).not.toBeNull();
    expect(q('[data-slot="dialog-title"]')!.textContent).toBe("Delete project?");
    expect(q('[data-slot="dialog-description"]')!.textContent).toBe("This cannot be undone.");
    expect(buttonByText('[data-slot="dialog"]', "Cancel")).toBeDefined();
    expect(buttonByText('[data-slot="dialog"]', "Delete").getAttribute("data-color")).toBe(
      "danger",
    );
  });

  test("confirm: calls back once and closes, no onCancel", async () => {
    const log: string[] = [];
    await mount(
      createElement(ConfirmDialog, {
        defaultOpen: true,
        title: "T",
        onConfirm: () => {
          log.push("confirm");
        },
        onCancel: () => log.push("cancel"),
      }),
    );
    await clickEl(buttonByText('[data-slot="dialog"]', "Confirm"));
    expect(log).toEqual(["confirm"]);
    await settle();
    expect(q('[data-slot="dialog"]')).toBeNull();
  });

  test("cancel: calls onCancel and closes, no onConfirm", async () => {
    const log: string[] = [];
    await mount(
      createElement(ConfirmDialog, {
        defaultOpen: true,
        title: "T",
        onConfirm: () => {
          log.push("confirm");
        },
        onCancel: () => log.push("cancel"),
      }),
    );
    await clickEl(buttonByText('[data-slot="dialog"]', "Cancel"));
    expect(log).toEqual(["cancel"]);
    expect(q('[data-slot="dialog"]')).toBeNull();
  });

  test("async confirm: the confirm button spins and cancel is blocked meanwhile, closes on success", async () => {
    const d = deferred();
    await mount(
      createElement(ConfirmDialog, { defaultOpen: true, title: "T", onConfirm: () => d.promise }),
    );
    await clickEl(buttonByText('[data-slot="dialog"]', "Confirm"));
    expect(buttonByText('[data-slot="dialog"]', "Confirm").hasAttribute("data-loading")).toBe(true);
    expect(buttonByText('[data-slot="dialog"]', "Cancel").hasAttribute("disabled")).toBe(true);
    // Clicking confirm again while in progress doesn't fire twice
    await clickEl(buttonByText('[data-slot="dialog"]', "Confirm"));
    d.resolve();
    await settle();
    expect(q('[data-slot="dialog"]')).toBeNull();
  });

  test("async confirm fails: stays open, buttons recover, can retry", async () => {
    let calls = 0;
    const first = deferred();
    await mount(
      createElement(ConfirmDialog, {
        defaultOpen: true,
        title: "T",
        onConfirm: () => (++calls === 1 ? first.promise : Promise.resolve()),
      }),
    );
    await clickEl(buttonByText('[data-slot="dialog"]', "Confirm"));
    first.reject(new Error("boom"));
    await settle();
    expect(q('[data-slot="dialog"]')).not.toBeNull();
    expect(buttonByText('[data-slot="dialog"]', "Confirm").hasAttribute("data-loading")).toBe(
      false,
    );
    await clickEl(buttonByText('[data-slot="dialog"]', "Confirm"));
    expect(calls).toBe(2);
    expect(q('[data-slot="dialog"]')).toBeNull();
  });

  test("controlled open: confirm only calls onOpenChange, the caller decides whether to close", async () => {
    const changes: boolean[] = [];
    await mount(
      createElement(ConfirmDialog, {
        open: true,
        title: "T",
        onOpenChange: (o: boolean) => changes.push(o),
      }),
    );
    await clickEl(buttonByText('[data-slot="dialog"]', "Confirm"));
    expect(changes).toEqual([false]);
    expect(q('[data-slot="dialog"]')).not.toBeNull();
  });

  test("children go into the body", async () => {
    await mount(
      createElement(
        ConfirmDialog,
        { defaultOpen: true, title: "T" },
        createElement("input", { "aria-label": "name" }),
      ),
    );
    expect(q('[data-slot="dialog-body"] input')).not.toBeNull();
  });
});

describe("Popconfirm", () => {
  const trigger = () => createElement(Button, null, "Remove");
  const pop = (props: Omit<PopconfirmProps, "children">) =>
    createElement(Popconfirm, { ...props, children: trigger() });

  test("clicking the element opens a popover: warning icon, title, description, cancel, confirm", async () => {
    await mount(
      pop({ title: "Remove this?", description: "It is permanent.", confirmLabel: "Yes" }),
    );
    expect(q('[data-slot="popconfirm"]')).toBeNull();
    await clickEl(buttonByText("", "Remove"));
    expect(q('[data-slot="popconfirm-icon"]')).not.toBeNull();
    expect(q('[data-slot="popconfirm-title"]')!.textContent).toBe("Remove this?");
    expect(q('[data-slot="popconfirm-description"]')!.textContent).toBe("It is permanent.");
    expect(buttonByText('[data-slot="popconfirm"]', "Cancel")).toBeDefined();
    expect(buttonByText('[data-slot="popconfirm"]', "Yes")).toBeDefined();
  });

  test("confirm calls back and closes; cancel calls onCancel and closes", async () => {
    const log: string[] = [];
    await mount(
      pop({
        title: "T",
        onConfirm: () => {
          log.push("confirm");
        },
        onCancel: () => log.push("cancel"),
      }),
    );
    await clickEl(buttonByText("", "Remove"));
    await clickEl(buttonByText('[data-slot="popconfirm"]', "OK"));
    expect(log).toEqual(["confirm"]);
    expect(q('[data-slot="popconfirm"]')).toBeNull();
    await clickEl(buttonByText("", "Remove"));
    await clickEl(buttonByText('[data-slot="popconfirm"]', "Cancel"));
    expect(log).toEqual(["confirm", "cancel"]);
    expect(q('[data-slot="popconfirm"]')).toBeNull();
  });

  test("async confirm: spins, cancel is blocked meanwhile, closes on success", async () => {
    const d = deferred();
    await mount(pop({ title: "T", onConfirm: () => d.promise }));
    await clickEl(buttonByText("", "Remove"));
    await clickEl(buttonByText('[data-slot="popconfirm"]', "OK"));
    expect(buttonByText('[data-slot="popconfirm"]', "OK").hasAttribute("data-loading")).toBe(true);
    expect(buttonByText('[data-slot="popconfirm"]', "Cancel").hasAttribute("disabled")).toBe(true);
    d.resolve();
    await settle();
    expect(q('[data-slot="popconfirm"]')).toBeNull();
  });

  test("tone=danger, hideCancel, icon=null, disabled", async () => {
    await mount(pop({ title: "T", tone: "danger", hideCancel: true, icon: null }));
    await clickEl(buttonByText("", "Remove"));
    expect(q('[data-slot="popconfirm"]')!.getAttribute("data-tone")).toBe("danger");
    expect(q('[data-slot="popconfirm-icon"]')).toBeNull();
    expect(
      [...document.body.querySelectorAll('[data-slot="popconfirm"] button')].map(
        (b) => b.textContent,
      ),
    ).toEqual(["OK"]);
    expect(buttonByText('[data-slot="popconfirm"]', "OK").getAttribute("data-color")).toBe(
      "danger",
    );
  });

  test("disabled: clicking the element opens nothing, the element itself stays", async () => {
    await mount(pop({ title: "T", disabled: true }));
    await clickEl(buttonByText("", "Remove"));
    expect(q('[data-slot="popconfirm"]')).toBeNull();
  });
});
