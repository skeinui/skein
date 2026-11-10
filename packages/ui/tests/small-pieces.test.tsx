// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import {
  Avatar,
  ConfigProvider,
  ConfirmButton,
  DateText,
  Field,
  Input,
  TableTools,
  DueTag,
  NumberText,
  PageHeader,
  TextPair,
  formatDateText,
  formatNumberText,
  Page,
  initialsOf,
  toCsv,
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
const MOMENT = "2026-11-10T10:37:00Z";

describe("DateText / formatDateText", () => {
  test("a date by default, a moment with timeStyle, in the language asked for", () => {
    expect(formatDateText(MOMENT, { locale: "en", timeZone: "UTC" })).toBe("Nov 10, 2026");
    expect(formatDateText(MOMENT, { locale: "en", timeZone: "UTC", timeStyle: "short" })).toMatch(
      /10:37/,
    );
    expect(formatDateText(MOMENT, { locale: "zh-CN", timeZone: "UTC" })).toContain(
      "2026年11月10日",
    );
    expect(
      formatDateText(new Date(MOMENT), { locale: "en", dateStyle: "short", timeZone: "UTC" }),
    ).toBe("11/10/26");
  });

  test("`weekday` gives the day of the week alone", () => {
    expect(formatDateText(MOMENT, { locale: "en", timeZone: "UTC", weekday: "short" })).toBe("Tue");
    expect(formatDateText(MOMENT, { locale: "en", timeZone: "UTC", weekday: "long" })).toBe(
      "Tuesday",
    );
    expect(formatDateText(MOMENT, { locale: "zh-CN", timeZone: "UTC", weekday: "short" })).toBe(
      "周二",
    );
    expect(
      ssr(
        createElement(DateText, { value: MOMENT, locale: "en", timeZone: "UTC", weekday: "short" }),
      ),
    ).toContain(">Tue</time>");
  });

  test("no value or not a date: undefined", () => {
    for (const bad of [undefined, null, "", "not a date"])
      expect(formatDateText(bad)).toBeUndefined();
  });

  test("a <time> with the exact moment; the dash when empty; the language of ConfigProvider", () => {
    const html = ssr(createElement(DateText, { value: MOMENT, locale: "en", timeZone: "UTC" }));
    expect(html).toContain(`<time dateTime="${MOMENT.replace("Z", ".000Z")}">Nov 10, 2026</time>`);
    expect(ssr(createElement(DateText, { value: null }))).toBe("—");
    expect(ssr(createElement(DateText, { value: undefined, fallback: "n/a" }))).toBe("n/a");
    const zh = ssr(
      createElement(
        ConfigProvider,
        { ...zhCN, locale: "zh-CN" },
        createElement(DateText, { value: MOMENT, timeZone: "UTC" }),
      ),
    );
    expect(zh).toContain("2026年11月10日");
  });
});

describe("Avatar `name`", () => {
  test("initials of the first two words, or the first letter of one word", () => {
    expect(initialsOf("Ada Lin")).toBe("AL");
    expect(initialsOf("  maya brooks carter ")).toBe("MB");
    expect(initialsOf("王雨桐")).toBe("王");
    expect(initialsOf("")).toBe("");
  });

  test("the fallback and the alt come from the name unless they are given", () => {
    const html = ssr(createElement(Avatar, { name: "Ada Lin" }));
    expect(html).toContain(">AL<");
    expect(ssr(createElement(Avatar, { name: "Ada Lin", fallback: "X" }))).toContain(">X<");
    expect(ssr(createElement(Avatar, { fallback: "Q" }))).toContain(">Q<");
  });
});

describe("Field `label`", () => {
  test("the label above the control and the description under it, without Field.Label", () => {
    const html = ssr(
      createElement(
        Field,
        { label: "Status", description: "Where it stands" },
        createElement(Input, {}),
      ),
    );
    expect(html).toContain('data-slot="field-label"');
    expect(html.indexOf("Status")).toBeLessThan(html.indexOf("<input"));
    expect(html.indexOf("<input")).toBeLessThan(html.indexOf("Where it stands"));
    expect(html).toContain('data-slot="field-description"');
  });

  test("`nativeLabel={false}` makes the label a plain element", () => {
    const html = ssr(
      createElement(Field, { label: "Owner", nativeLabel: false }, createElement("div")),
    );
    expect(html).toMatch(/<div[^>]*data-slot="field-label"/);
  });

  test("no label, no description: nothing extra", () => {
    const html = ssr(createElement(Field, {}, createElement(Input, {})));
    expect(html).not.toContain("field-label");
    expect(html).not.toContain("field-description");
  });
});

describe("TableTools `exportCsv` / toCsv", () => {
  test("CSV text: quotes, commas, numbers, formulas made plain", () => {
    expect(
      toCsv(
        ["a", "b"],
        [
          ["x,y", 3],
          ['say "hi"', "=SUM(A1)"],
        ],
      ),
    ).toBe('a,b\r\n"x,y",3\r\n"say ""hi""",\'=SUM(A1)');
    expect(toCsv(["n"], [[null], [undefined], [{ k: 1 }]])).toBe('n\r\n\r\n\r\n"{""k"":1}"');
  });

  test("the export button shows with exportCsv, and the file is made when it is pressed", async () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((b: Blob) => (created.push(b), "blob:x"));
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const exportCsv = vi.fn(() => ({ filename: "rows.csv", headers: ["a"], rows: [["1"]] }));
    const el = await mount(createElement(TableTools, { exportCsv }));
    expect(exportCsv).not.toHaveBeenCalled();
    await act(async () =>
      el.querySelector<HTMLElement>('button[aria-label="Export CSV"]')!.click(),
    );
    expect(exportCsv).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    const bytes = new Uint8Array(await created[0]!.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder().decode(bytes.slice(3))).toBe("a\r\n1");
    click.mockRestore();
  });
});

describe("ConfirmButton", () => {
  test("a Button; color danger makes the question danger too; the label is the confirm button", async () => {
    const onConfirm = vi.fn();
    const el = await mount(
      createElement(
        ConfirmButton,
        { question: "Delete it?", color: "danger", variant: "outline", onConfirm },
        "Delete",
      ),
    );
    const trigger = el.querySelector("button")!;
    expect(trigger.getAttribute("data-color")).toBe("danger");
    expect(trigger.getAttribute("data-variant")).toBe("outline");
    expect(onConfirm).not.toHaveBeenCalled();
    await act(async () => trigger.click());
    expect(document.body.textContent).toContain("Delete it?");
    const confirm = [...document.querySelectorAll("button")].filter(
      (b) => b.textContent === "Delete",
    );
    expect(confirm.length).toBeGreaterThan(1);
    await act(async () => confirm.at(-1)!.click());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe("NumberText / formatNumberText", () => {
  test("a number in the language asked for: decimal, percent, unit, currency, compact", () => {
    expect(formatNumberText(12500, { locale: "en" })).toBe("12,500");
    expect(formatNumberText(0.974, { locale: "en", format: "percent" })).toBe("97%");
    expect(formatNumberText(97, { locale: "en", format: "unit", unit: "percent" })).toBe("97%");
    expect(formatNumberText(4.5, { locale: "en", format: "currency", currency: "USD" })).toBe(
      "$4.50",
    );
    expect(formatNumberText(4, { locale: "en", precision: 1 })).toBe("4.0");
    expect(formatNumberText(12500, { locale: "en", notation: "compact" })).toBe("13K");
    expect(formatNumberText(1234.5, { locale: "de" })).toBe("1.234,5");
  });

  test("no value or not a number: undefined", () => {
    for (const bad of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY])
      expect(formatNumberText(bad)).toBeUndefined();
    expect(formatNumberText(0, { locale: "en" })).toBe("0");
  });

  test("a <data> with the exact value; the dash when empty; the language of ConfigProvider", () => {
    expect(ssr(createElement(NumberText, { value: 0.5, format: "percent", locale: "en" }))).toBe(
      '<data value="0.5">50%</data>',
    );
    expect(ssr(createElement(NumberText, { value: null }))).toBe("—");
    expect(ssr(createElement(NumberText, { value: undefined, fallback: "n/a" }))).toBe("n/a");
    const zh = ssr(
      createElement(
        ConfigProvider,
        { ...zhCN, locale: "zh-CN" },
        createElement(NumberText, { value: 12500, notation: "compact" }),
      ),
    );
    expect(zh).toContain("1.3万");
  });
});

describe("Page `loading` / `notFound`", () => {
  const page = (props: object) =>
    ssr(createElement(Page, { title: "Ticket", ...props }, createElement("p", {}, "BODY")));

  test("the content by default; a spinner while loading; notFound wins; the frame stays", () => {
    expect(page({})).toContain("BODY");
    const loading = page({ loading: true });
    expect(loading).not.toContain("BODY");
    expect(loading).toContain('data-slot="spinner"');
    expect(loading).toContain('data-slot="page-header"');
    const gone = page({ loading: true, notFound: createElement("span", {}, "NOPE") });
    expect(gone).toContain("NOPE");
    expect(gone).not.toContain('data-slot="spinner"');
    expect(gone).not.toContain("BODY");
  });

  test("a page scrolls inside its own frame; with `fill` it does not", () => {
    const scrolling = page({});
    expect(scrolling).toContain('data-slot="scroll-area"');
    expect(scrolling).toMatch(/data-slot="scroll-area-viewport".*data-slot="page-content"/s);
    const filled = page({ fill: true });
    expect(filled).not.toContain('data-slot="scroll-area"');
    expect(filled).toContain('data-slot="page-content" data-fill=""');
  });
});

describe("TextPair", () => {
  test("a bold title over a secondary description; extra after the title; strong off for a link", () => {
    const html = ssr(
      createElement(TextPair, {
        title: "Maya Brooks",
        description: "maya@northwind.example",
        extra: createElement("i", {}, "VIP"),
      }),
    );
    expect(html.indexOf("Maya Brooks")).toBeLessThan(html.indexOf("<i>VIP</i>"));
    expect(html.indexOf("<i>VIP</i>")).toBeLessThan(html.indexOf("maya@northwind.example"));
    expect(html).toContain("<strong");
    expect(html).toContain('data-tone="secondary"');
    expect(ssr(createElement(TextPair, { title: "Link", strong: false }))).not.toContain("<strong");
    expect(ssr(createElement(TextPair, { title: "Only" }))).not.toContain("secondary");
  });
});

describe("DueTag", () => {
  const hour = 3_600_000;
  const tag = (props: object) =>
    ssr(createElement(DueTag, { value: Date.now() + 5 * hour, ...props } as never));

  test("before the deadline: the time left in plain text, no tag", () => {
    const html = tag({});
    expect(html).toContain("<time");
    expect(html).not.toContain('data-slot="tag"');
  });

  test("after it: a danger tag with Overdue; done: a dash; paused: Paused", () => {
    const late = tag({ value: Date.now() - 3 * hour });
    expect(late).toContain('data-color="danger"');
    expect(late).toContain("Overdue");
    expect(tag({ value: Date.now() - 3 * hour, done: true })).toContain("—");
    expect(tag({ value: Date.now() - 3 * hour, done: true })).not.toContain("Overdue");
    const paused = tag({ paused: true });
    expect(paused).toContain("Paused");
    expect(paused).not.toContain("<time");
    expect(tag({ value: Date.now() - hour, labels: { overdue: "Late" } })).toContain("Late");
  });
});

describe("PageHeader `back`", () => {
  test("the way back is above the title, inside the main block; a header may be only that", () => {
    const html = ssr(
      createElement(PageHeader, {
        title: "T-1016",
        back: createElement("a", { href: "/t" }, "Tickets"),
      }),
    );
    expect(html).toContain('data-slot="page-header-back"');
    expect(html.indexOf("page-header-main")).toBeLessThan(html.indexOf("page-header-back"));
    expect(html.indexOf("page-header-back")).toBeLessThan(html.indexOf("T-1016"));
    expect(ssr(createElement(PageHeader, { back: "Back" }))).toContain("Back");
    expect(ssr(createElement(PageHeader, { title: "A" }))).not.toContain("page-header-back");
  });
});
