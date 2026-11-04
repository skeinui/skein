// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vite-plus/test";
import {
  Calendar,
  ConfigProvider,
  Dialog,
  Feedback,
  NumberField,
  Pagination,
  Plan,
  Queue,
  ToolCall,
  Upload,
} from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});
async function mount(child: React.ReactElement, withPack = true) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () =>
    root!.render(withPack ? createElement(ConfigProvider, { ...zhCN }, child) : child),
  );
}
const text = () => host!.textContent ?? "";

describe("locale wired into components", () => {
  test("Plan: status names (nested table) and the progress bar name are Chinese", async () => {
    await mount(
      createElement(Plan, {
        title: "Plan",
        items: [
          { id: "1", label: "a", status: "done" },
          { id: "2", label: "b", status: "active" },
        ],
      }),
    );
    expect(text()).toContain("完成");
    expect(text()).toContain("进行中");
    expect(host!.querySelector('[role="progressbar"]')?.getAttribute("aria-label")).toBe(
      "计划进度",
    );
  });

  test("ToolCall: overriding one state keeps the locale for the others", async () => {
    await mount(
      createElement(ToolCall, {
        toolName: "search",
        state: "output-available",
        labels: { states: { "output-error": "Crashed" } },
      }),
    );
    expect(text()).toContain("完成");
    expect(text()).not.toContain("Done");
    await mount(
      createElement(ToolCall, {
        toolName: "search",
        state: "output-error",
        labels: { states: { "output-error": "Crashed" } },
      }),
    );
    expect(text()).toContain("Crashed");
  });

  test("Feedback and Queue names are Chinese; the component's own labels win", async () => {
    await mount(
      createElement(
        "div",
        null,
        createElement(Feedback, { labels: { up: "Like" } }),
        createElement(Queue, { items: [{ id: "1", text: "任务" }], onChange: () => {} }),
      ),
    );
    const names = [...host!.querySelectorAll("[aria-label]")].map((e) =>
      e.getAttribute("aria-label"),
    );
    expect(names).toContain("评价这条回复");
    expect(names).toContain("Like");
    expect(names).toContain("回复得不好");
    expect(names).toContain("移除任务");
    expect(text()).toContain("待发送");
  });

  test("English defaults without ConfigProvider", async () => {
    await mount(createElement(Feedback, {}), false);
    expect(host!.querySelector('[aria-label="Rate this response"]')).not.toBeNull();
  });

  test("components that used to hard-code English: calendar, pagination, number input, upload, dialog", async () => {
    await mount(
      createElement(
        "div",
        null,
        createElement(Calendar, { defaultMonth: "2026-10" }),
        createElement(Pagination, {
          variant: "pages",
          page: 1,
          pageSize: 10,
          total: 50,
          onPageChange: () => {},
          onPageSizeChange: () => {},
        }),
        createElement(NumberField, { defaultValue: 1 }),
        createElement(Upload, { onFilesChange: () => {} } as never),
      ),
    );
    const names = [...host!.querySelectorAll("[aria-label]")].map((e) =>
      e.getAttribute("aria-label"),
    );
    expect(names).toEqual(
      expect.arrayContaining(["上个月", "下个月", "分页", "第 2 页", "每页条数", "减少", "增加"]),
    );
    expect(text()).toContain("点击或拖拽文件到这里");
    expect(names).not.toContain("Previous month");
  });

  test("Dialog close button uses the locale", async () => {
    await mount(
      createElement(
        Dialog,
        { open: true },
        createElement(
          Dialog.Content,
          null,
          createElement(Dialog.Title, null, "Title"),
          createElement(Dialog.Body, null, "Body"),
        ),
      ),
    );
    expect(
      document.body.querySelector('[data-slot="dialog-close"]')?.getAttribute("aria-label"),
    ).toBe("关闭");
  });
});
