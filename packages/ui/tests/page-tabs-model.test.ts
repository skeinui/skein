import { describe, expect, it } from "vite-plus/test";
import {
  closeTabs,
  isClosable,
  keysToClose,
  moveTab,
  openTab,
  pinTab,
} from "../src/components/page-tabs/model.ts";
import type { PageTab } from "../src/components/page-tabs/model.ts";

const tab = (key: string, extra: Partial<PageTab> = {}): PageTab => ({ key, title: key, ...extra });
const keys = (tabs: readonly PageTab[]) => tabs.map((t) => t.key).join("");

const TABS = [tab("h", { pinned: true }), tab("a"), tab("b"), tab("c"), tab("d")];

describe("isClosable", () => {
  it("pinned or closable:false tabs can't be closed", () => {
    expect(isClosable(tab("x"))).toBe(true);
    expect(isClosable(tab("x", { pinned: true }))).toBe(false);
    expect(isClosable(tab("x", { closable: false }))).toBe(false);
  });
});

describe("keysToClose", () => {
  it("covers each scope and skips tabs that can't be closed", () => {
    expect(keysToClose(TABS, "self", "b")).toEqual(["b"]);
    expect(keysToClose(TABS, "others", "b")).toEqual(["a", "c", "d"]);
    expect(keysToClose(TABS, "left", "c")).toEqual(["a", "b"]);
    expect(keysToClose(TABS, "right", "b")).toEqual(["c", "d"]);
    expect(keysToClose(TABS, "all", "b")).toEqual(["a", "b", "c", "d"]);
    expect(keysToClose(TABS, "self", "h")).toEqual([]);
    expect(keysToClose(TABS, "self", "nope")).toEqual([]);
  });
});

describe("closeTabs", () => {
  it("closing an inactive tab keeps the active one", () => {
    const r = closeTabs(TABS, ["c"], "a");
    expect(keys(r.tabs)).toBe("habd");
    expect(r.activeKey).toBe("a");
  });
  it("closing the active tab moves to the next one, else the previous", () => {
    expect(closeTabs(TABS, ["b"], "b").activeKey).toBe("c");
    expect(closeTabs(TABS, ["d"], "d").activeKey).toBe("c");
    expect(closeTabs(TABS, ["b", "c"], "b").activeKey).toBe("d");
    expect(closeTabs(TABS, ["a", "b", "c", "d"], "c").activeKey).toBe("h");
  });
  it("never closes pinned / non-closable tabs; returns the same value when nothing closes", () => {
    const r = closeTabs(TABS, ["h", "zzz"], "h");
    expect(r.tabs).toBe(TABS);
    expect(r.activeKey).toBe("h");
    expect(keys(closeTabs(TABS, ["h", "a"], "a").tabs)).toBe("hbcd");
  });
  it("no tabs left → empty active key", () => {
    expect(closeTabs([tab("a")], ["a"], "a")).toEqual({ tabs: [], activeKey: "" });
  });
});

describe("moveTab", () => {
  it("moves within the normal zone", () => {
    expect(keys(moveTab(TABS, "a", 3))).toBe("hbcad");
    expect(keys(moveTab(TABS, "d", 1))).toBe("hdabc");
  });
  it("normal tabs can't go in front of pinned ones; pinned ones stay in the pinned zone", () => {
    expect(keys(moveTab(TABS, "c", 0))).toBe("hcabd");
    const two = [tab("p", { pinned: true }), tab("q", { pinned: true }), tab("x"), tab("y")];
    expect(keys(moveTab(two, "p", 9))).toBe("qpxy");
    expect(keys(moveTab(two, "q", -3))).toBe("qpxy");
  });
  it("clamps the index, and returns the same array when nothing changes", () => {
    expect(keys(moveTab(TABS, "a", 99))).toBe("hbcda");
    expect(moveTab(TABS, "a", 1)).toBe(TABS);
    expect(moveTab(TABS, "nope", 1)).toBe(TABS);
  });
  it("doesn't mutate the input", () => {
    moveTab(TABS, "a", 3);
    expect(keys(TABS)).toBe("habcd");
  });
});

describe("pinTab", () => {
  it("pinning moves the tab to the end of the pinned zone", () => {
    const r = pinTab(TABS, "c", true);
    expect(keys(r)).toBe("hcabd");
    expect(r.find((t) => t.key === "c")?.pinned).toBe(true);
  });
  it("unpinning moves it to the start of the normal tabs", () => {
    const r = pinTab(TABS, "h", false);
    expect(keys(r)).toBe("habcd");
    expect(r[0].pinned).toBeUndefined();
  });
  it("no change returns the same array", () => {
    expect(pinTab(TABS, "h", true)).toBe(TABS);
    expect(pinTab(TABS, "a", false)).toBe(TABS);
    expect(pinTab(TABS, "nope", true)).toBe(TABS);
  });
});

describe("openTab", () => {
  it("adds a missing tab at the end, and is a no-op for an existing one", () => {
    expect(keys(openTab(TABS, tab("e")))).toBe("habcde");
    expect(openTab(TABS, tab("b"))).toBe(TABS);
  });
});
