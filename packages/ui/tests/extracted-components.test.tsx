// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import {
  ConfigProvider,
  MentionText,
  MenuButton,
  NotificationBell,
  RelativeTime,
  StatisticCard,
  formatRelativeTime,
} from "../src/index.ts";
import { zhCN } from "../src/locales/zh-CN.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = root = null;
});
async function mount(node: React.ReactElement) {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
  return host;
}
const ssr = (n: React.ReactElement) => renderToStaticMarkup(n);
const click = async (el: Element | null | undefined) => {
  await act(async () => (el as HTMLElement).click());
};

const NOW = Date.UTC(2026, 10, 9, 12, 0, 0);
const ago = (seconds: number) => NOW - seconds * 1000;

describe("RelativeTime / formatRelativeTime", () => {
  test("the largest unit that fits: seconds, minutes, hours, days, months, years; past and future", () => {
    const f = (value: number, o = {}) =>
      formatRelativeTime(value, { now: NOW, locale: "en", ...o });
    expect(f(ago(10))).toBe("10 seconds ago");
    expect(f(ago(5 * 60))).toBe("5 minutes ago");
    expect(f(ago(3 * 3600))).toBe("3 hours ago");
    expect(f(ago(2 * 86400))).toBe("2 days ago");
    expect(f(ago(60 * 86400))).toBe("2 months ago");
    expect(f(ago(800 * 86400))).toBe("2 years ago");
    expect(f(ago(-2 * 3600))).toBe("in 2 hours");
  });

  test("`numeric` auto says yesterday and now, always says 1 day ago", () => {
    expect(formatRelativeTime(ago(86400), { now: NOW, locale: "en" })).toBe("yesterday");
    expect(formatRelativeTime(ago(86400), { now: NOW, locale: "en", numeric: "always" })).toBe(
      "1 day ago",
    );
    expect(formatRelativeTime(ago(0), { now: NOW, locale: "en" })).toBe("now");
  });

  test("the language: its own `locale`, else the ConfigProvider's", () => {
    expect(formatRelativeTime(ago(3600), { now: NOW, locale: "zh-CN" })).toBe("1小时前");
    const html = ssr(
      createElement(
        ConfigProvider,
        { ...zhCN, locale: "zh-CN" },
        createElement(RelativeTime, { value: ago(3600), now: NOW }),
      ),
    );
    expect(html).toContain("1小时前");
  });

  test("a <time> with the exact moment, the full date on hover, no class / style; a bad value is empty", () => {
    const html = ssr(createElement(RelativeTime, { value: ago(3600), now: NOW, locale: "en" }));
    expect(html.startsWith("<time")).toBe(true);
    expect(html).toContain(`dateTime="${new Date(ago(3600)).toISOString()}"`);
    expect(html).toMatch(/title="[^"]+"/);
    expect(html).not.toMatch(/class=|style=/);
    expect(ssr(createElement(RelativeTime, { value: "not a date", now: NOW }))).not.toContain(
      "dateTime",
    );
  });

  test("`refresh` counts again on a timer", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(NOW);
      const el = await mount(
        createElement(RelativeTime, { value: NOW - 4 * 60_000, locale: "en", refresh: 30 }),
      );
      expect(el.textContent).toBe("4 minutes ago");
      await act(async () => {
        // the clock moves with the timers: 29 s + 31 s later the value is exactly 5 minutes old
        vi.setSystemTime(NOW + 29_000);
        vi.advanceTimersByTime(31_000);
      });
      expect(el.textContent).toBe("5 minutes ago");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("MentionText", () => {
  test("bold for a mention of a name in the list, plain for the rest; the longest name wins", () => {
    const html = ssr(
      createElement(MentionText, {
        text: "@Ada Lin please look, cc @Ada and @nobody",
        mentions: ["Ada", "Ada Lin"],
      }),
    );
    expect(html.match(/<strong>/g)).toHaveLength(2);
    expect(html).toContain("<strong>@Ada Lin</strong>");
    expect(html).toContain("<strong>@Ada</strong>");
    expect(html).toContain("@nobody");
    expect(html).not.toContain("<strong>@nobody");
  });

  test("text without a mention is returned as it is; a trigger of your own; regex characters in a name are harmless", () => {
    expect(ssr(createElement(MentionText, { text: "no mention", mentions: ["Ada"] }))).toBe(
      "no mention",
    );
    expect(ssr(createElement(MentionText, { text: "hi", mentions: [] }))).toBe("hi");
    expect(
      ssr(
        createElement(MentionText, {
          text: "ping #Ada (QA)",
          mentions: ["Ada (QA)"],
          trigger: "#",
        }),
      ),
    ).toContain("<strong>#Ada (QA)</strong>");
  });
});

describe("StatisticCard", () => {
  test("a Statistic in a Card; variant and radius are the card's", () => {
    const html = ssr(
      createElement(StatisticCard, {
        title: "Open",
        value: 12,
        variant: "elevated",
        radius: "lg",
        color: "success",
      }),
    );
    expect(html).toContain('data-slot="card"');
    expect(html).toContain('data-variant="elevated"');
    expect(html).toContain('data-radius="lg"');
    expect(html).toContain('data-slot="card-body"');
    expect(html).toContain("Open");
    expect(html).toContain("12");
    expect(html).not.toMatch(/class=|style=/);
  });
});

describe("MenuButton", () => {
  const items = [
    { key: "a", label: "Ada" },
    { type: "separator" as const },
    { key: "b", label: "Ben", danger: true },
    { key: "c", label: "Chen", disabled: true },
  ];

  test("an outline neutral button with the label and a chevron; no items, no click", () => {
    const html = ssr(createElement(MenuButton, { items, children: "Assign to" }));
    expect(html).toContain("Assign to");
    expect(html).toContain('data-variant="outline"');
    expect(html).toContain('data-color="neutral"');
    expect(html).toContain("<svg");
    expect(ssr(createElement(MenuButton, { items: [], children: "Assign to" }))).toContain(
      "disabled",
    );
  });

  test("opening lists the items; choosing one calls its onSelect and the overall onSelect with the key", async () => {
    const onSelect = vi.fn();
    const own = vi.fn();
    const el = await mount(
      createElement(MenuButton, {
        items: [{ key: "a", label: "Ada", onSelect: own }, ...items.slice(1)],
        onSelect,
        children: "Assign to",
      }),
    );
    await click(el.querySelector("button"));
    const options = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    expect(options.map((o) => o.textContent)).toEqual(["Ada", "Ben", "Chen"]);
    expect(document.querySelector('[role="menu"]')?.getAttribute("aria-label")).toBe("Assign to");
    await click(options[0]);
    expect(own).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith("a");
  });
});

describe("NotificationBell", () => {
  const items = [
    { id: 1, title: "Mentioned you", description: "T-1", time: NOW - 3600_000, canOpen: true },
    { id: 2, title: "Overdue", read: true },
    { id: 3, title: "Assigned", time: NOW - 86400_000 },
  ];

  test("the trigger says how many are unread; the badge counts them", () => {
    const html = ssr(createElement(NotificationBell, { items }));
    expect(html).toContain('aria-label="Notifications (2 unread)"');
    expect(html).toContain('data-slot="badge-indicator"');
    expect(
      ssr(createElement(NotificationBell, { items: [{ id: 1, title: "x", read: true }] })),
    ).toContain('aria-label="Notifications"');
    expect(
      ssr(createElement(ConfigProvider, { ...zhCN }, createElement(NotificationBell, { items }))),
    ).toContain('aria-label="通知 (2 条未读)"');
  });

  test("a button is shown for what its callback is given for, and each reports the notification", async () => {
    const onRead = vi.fn();
    const onReadAll = vi.fn();
    const onOpen = vi.fn();
    const el = await mount(createElement(NotificationBell, { items, onRead, onReadAll, onOpen }));
    await click(el.querySelector("button"));
    const popup = document.querySelector('[data-slot="notification-bell"]')!;
    expect(popup.textContent).toContain("Mentioned you");
    expect(popup.textContent).toContain("Overdue");
    // two unread: two "mark as read", one open (only the first can open)
    expect(popup.querySelectorAll('[aria-label="Mark as read"]')).toHaveLength(2);
    expect(popup.querySelectorAll('[aria-label="Open"]')).toHaveLength(1);
    await click(popup.querySelector('[aria-label="Mark as read"]'));
    expect(onRead).toHaveBeenLastCalledWith(items[0]);
    await click(popup.querySelector('[aria-label="Open"]'));
    expect(onOpen).toHaveBeenLastCalledWith(items[0]);
    await click(
      [...popup.querySelectorAll("button")].find((b) => b.textContent === "Mark all as read"),
    );
    expect(onReadAll).toHaveBeenCalledTimes(1);
    expect(popup.querySelectorAll("time")).toHaveLength(2);
  });

  test("without callbacks there are no buttons; with nothing unread no 'Mark all as read'; an empty list says so", async () => {
    const el = await mount(createElement(NotificationBell, { items: [] }));
    await click(el.querySelector("button"));
    const popup = document.querySelector('[data-slot="notification-bell"]')!;
    expect(popup.textContent).toContain("No notifications");
    expect(popup.querySelectorAll("button")).toHaveLength(0);
  });
});
