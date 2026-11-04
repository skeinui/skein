// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { Statistic, formatCountdown } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("formatCountdown", () => {
  const ms = 1 * 86_400_000 + 2 * 3_600_000 + 3 * 60_000 + 4_000 + 56;
  test("splits by the format, repeated letters pad with zeros", () => {
    expect(formatCountdown(ms, "D HH:mm:ss")).toBe("1 02:03:04");
    expect(formatCountdown(ms, "HH:mm:ss.SSS")).toBe("26:03:04.056");
    expect(formatCountdown(ms, "s")).toBe("93784");
  });
  test("missing larger units fold into smaller ones; text in square brackets is output as is", () => {
    expect(formatCountdown(ms, "mm:ss")).toBe("1563:04");
    expect(formatCountdown(ms, "D [days] H [h]")).toBe("1 days 2 h");
  });
  test("negative counts as 0", () => {
    expect(formatCountdown(-5, "HH:mm:ss")).toBe("00:00:00");
  });
});

describe("Statistic.Countdown", () => {
  let root: ReturnType<typeof createRoot> | null = null;
  let host: HTMLElement | null = null;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    act(() => root?.unmount());
    host?.remove();
    root = null;
    vi.useRealTimers();
  });
  function mount(node: React.ReactElement) {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    act(() => {
      root!.render(node);
    });
  }
  const text = () => document.querySelector('[data-slot="statistic-value"]')!.textContent;
  const NOW = Date.parse("2026-01-01T00:00:00Z");
  const deadline = NOW + 65_000;

  test("SSR: a <time> with role=timer and an ISO duration, no class / style", () => {
    const html = renderToStaticMarkup(
      createElement(Statistic.Countdown, { deadline, title: "Left" }),
    );
    expect(html).toContain('role="timer"');
    expect(html).toContain('<time role="timer" dateTime="PT0H1M5S">00:01:05</time>');
    expect(html).not.toMatch(/class=|style=/);
  });

  test("updates every second; at 0 onFinish is called once and it stops", () => {
    const onFinish = vi.fn();
    const onChange = vi.fn();
    mount(createElement(Statistic.Countdown, { deadline, onFinish, onChange, format: "mm:ss" }));
    expect(text()).toBe("01:05");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(text()).toBe("01:04");
    expect(onChange).toHaveBeenLastCalledWith(64_000);
    act(() => {
      vi.advanceTimersByTime(70_000);
    });
    expect(text()).toBe("00:00");
    expect(onFinish).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  test("already expired on mount: shows 0 and calls onFinish; changing deadline starts again", () => {
    const onFinish = vi.fn();
    mount(createElement(Statistic.Countdown, { deadline: Date.now() - 1, onFinish }));
    expect(text()).toBe("00:00:00");
    expect(onFinish).toHaveBeenCalledTimes(1);
    act(() => {
      root!.render(createElement(Statistic.Countdown, { deadline: Date.now() + 3000, onFinish }));
    });
    expect(text()).toBe("00:00:03");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onFinish).toHaveBeenCalledTimes(2);
  });

  test("updates faster when the format has S", () => {
    mount(createElement(Statistic.Countdown, { deadline: Date.now() + 2000, format: "s.SSS" }));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(text()).toBe("1.900");
  });
});
