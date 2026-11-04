import { describe, expect, it } from "vite-plus/test";
import { activeTopOf, firstLeaf, matchNav, trailOf } from "../src/components/admin-layout/nav.ts";
import type { AdminNavItem } from "../src/components/admin-layout/nav.ts";

const ITEMS: AdminNavItem[] = [
  { key: "home", label: "Home" },
  {
    key: "tenants",
    label: "Tenants",
    children: [
      { key: "list", label: "List" },
      { key: "settings", label: "Settings", children: [{ key: "billing", label: "Billing" }] },
    ],
  },
  {
    key: "apps",
    label: "Apps",
    children: [
      { key: "off", label: "Off", disabled: true },
      { key: "on", label: "On" },
    ],
  },
];

describe("trailOf", () => {
  it("returns the path from the top to the item, itself included", () => {
    expect(trailOf(ITEMS, "home")?.map((i) => i.key)).toEqual(["home"]);
    expect(trailOf(ITEMS, "billing")?.map((i) => i.key)).toEqual([
      "tenants",
      "settings",
      "billing",
    ]);
  });
  it("returns null when there is no such item (or no key)", () => {
    expect(trailOf(ITEMS, "nope")).toBeNull();
    expect(trailOf(ITEMS, null)).toBeNull();
    expect(trailOf(ITEMS, undefined)).toBeNull();
  });
});

describe("firstLeaf", () => {
  it("walks down to the first enabled leaf", () => {
    expect(firstLeaf(ITEMS[0]).key).toBe("home");
    expect(firstLeaf(ITEMS[1]).key).toBe("list");
    expect(firstLeaf(ITEMS[2]).key).toBe("on");
  });
  it("an item whose children are all disabled stays itself", () => {
    const item: AdminNavItem = {
      key: "x",
      label: "X",
      children: [{ key: "y", label: "Y", disabled: true }],
    };
    expect(firstLeaf(item).key).toBe("x");
  });
});

describe("activeTopOf", () => {
  it("is the top-level item on the path to the active key", () => {
    expect(activeTopOf(ITEMS, "billing")?.key).toBe("tenants");
    expect(activeTopOf(ITEMS, "home")?.key).toBe("home");
    expect(activeTopOf(ITEMS, "tenants")?.key).toBe("tenants");
  });
  it("falls back to the first top-level item when the key is unknown", () => {
    expect(activeTopOf(ITEMS, "nope")?.key).toBe("home");
    expect(activeTopOf(ITEMS, null)?.key).toBe("home");
    expect(activeTopOf([], "x")).toBeUndefined();
  });
});

describe("matchNav", () => {
  const NAV: AdminNavItem[] = [
    { key: "/acme", label: "Home" },
    { key: "/acme/users", label: "Users" },
    { key: "/acme/users-archive", label: "Archive" },
    { key: "/system", label: "System", children: [{ key: "/system/roles", label: "Roles" }] },
  ];
  const key = (path: string) => matchNav(NAV, path)?.key ?? null;

  it("the item itself, else its longest prefix on a / boundary (a detail page lights up its list)", () => {
    expect(key("/acme/users")).toBe("/acme/users");
    expect(key("/acme/users/42")).toBe("/acme/users");
    expect(key("/acme/users/42/edit")).toBe("/acme/users");
    expect(key("/acme/users-archive/7")).toBe("/acme/users-archive");
    expect(key("/acme/settings")).toBe("/acme");
    expect(key("/system/roles/3")).toBe("/system/roles");
  });

  it("groups only match exactly; nothing matches outside the menu", () => {
    expect(key("/system")).toBe("/system");
    expect(key("/system/other")).toBeNull();
    expect(key("/elsewhere")).toBeNull();
    expect(matchNav(NAV, undefined)).toBeNull();
  });
});
