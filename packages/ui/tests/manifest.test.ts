import { readFileSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";
import { MANIFEST_FILE, buildManifest, serialize } from "../scripts/manifest.ts";

describe("manifest.json", () => {
  const manifest = buildManifest();

  test("matches the component types (run vp run manifest after changing props / docs examples)", () => {
    expect(
      readFileSync(MANIFEST_FILE, "utf8") === serialize(manifest),
      "manifest.json is out of date: run `vp run manifest`",
    ).toBe(true);
  });

  test("every component has a description and an import; variant props list their values", () => {
    for (const [name, info] of Object.entries(manifest.components)) {
      expect(info.import, name).toBe(`import { ${name} } from "@skeinui/ui";`);
    }
    expect(manifest.components.Button.props.variant.values).toEqual(
      expect.arrayContaining(["solid", "outline"]),
    );
    expect(Object.keys(manifest.components.Card.parts ?? {})).toContain("Card.Header");
    expect(manifest.components.Button.slots).toContain("button");
  });

  test("readable for AI: data types list their fields, ReactNode isn't expanded, convention props are described, all English", () => {
    const { Breadcrumb, Button, ConfigProvider } = manifest.components;
    expect(Breadcrumb.types?.BreadcrumbItem.props.label).toMatchObject({ required: true });
    expect(Object.keys(ConfigProvider.types ?? {})).not.toContain("KanbanLabels");
    expect(Button.props.startContent.type).toBe("ReactNode");
    const descriptions = Object.values(manifest.components).flatMap((c) =>
      Object.values(c.props).map((p) => p.description),
    );
    expect(descriptions).toContain("Initial `value` when uncontrolled.");
    expect(JSON.stringify(manifest)).not.toMatch(/[一-龥]/);
  });

  test("no className / style and no React DOM attributes", () => {
    for (const [name, info] of Object.entries(manifest.components)) {
      expect(Object.keys(info.props), name).not.toContain("className");
      expect(Object.keys(info.props), name).not.toContain("onMouseEnter");
    }
  });
});
