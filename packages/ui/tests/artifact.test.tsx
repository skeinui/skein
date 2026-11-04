// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Artifact, ArtifactCard } from "../src/index.ts";

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

const panel = (extra: Record<string, unknown> = {}) =>
  createElement(
    Artifact,
    null,
    createElement(
      Artifact.Header,
      null,
      createElement(Artifact.Title, null, "report.md"),
      createElement(Artifact.Meta, null, "Document · v2"),
      createElement(Artifact.Views, {
        options: [
          { value: "preview", label: "Preview" },
          { value: "code", label: "Code" },
        ],
        defaultValue: "preview",
        ...extra,
      }),
      createElement(
        Artifact.Actions,
        null,
        createElement(Artifact.Action, { "aria-label": "Copy" }, "C"),
        createElement(Artifact.Close),
      ),
    ),
    createElement(Artifact.Body, null, "content"),
  );

describe("Artifact", () => {
  test("SSR: a section named by its title, header, view switch, action group and content, no class / style", () => {
    const html = ssr(panel());
    const id = /<section aria-labelledby="([^"]+)"/.exec(html)![1]!;
    expect(html).toContain(`<h2 id="${id}" data-slot="artifact-title">report.md</h2>`);
    expect(html).toContain('data-slot="artifact-meta">Document · v2<');
    expect(html).toContain('role="group" aria-label="Actions" data-slot="artifact-actions"');
    expect(html).toContain(
      'role="region" aria-label="Content" tabindex="0" data-slot="artifact-body"',
    );
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('aria-label="View"');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("view switch: clicking another option fires onValueChange", async () => {
    const onValueChange = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(panel({ onValueChange, defaultValue: undefined, value: "preview" }));
    });
    const code = [...host.querySelectorAll<HTMLElement>('[role="radio"]')].find(
      (r) => r.textContent === "Code",
    )!;
    await act(async () => code.click());
    expect(onValueChange).toHaveBeenCalledWith("code");
  });

  test("Close and Action are icon buttons with click callbacks", async () => {
    const onClose = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(
        createElement(Artifact.Actions, null, createElement(Artifact.Close, { onClick: onClose })),
      );
    });
    const button = host.querySelector<HTMLButtonElement>("button")!;
    expect(button.getAttribute("aria-label")).toBe("Close");
    expect(button.type).toBe("button");
    await act(async () => button.click());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("names can be switched to another language", () => {
    const html = ssr(
      createElement(
        Artifact.Actions,
        { "aria-label": "Artifact tools" },
        createElement(Artifact.Close, { "aria-label": "Dismiss" }),
      ),
    );
    expect(html).toContain('aria-label="Artifact tools"');
    expect(html).toContain('aria-label="Dismiss"');
  });
});

describe("ArtifactCard", () => {
  test("SSR: a button, aria-pressed tells whether it is open", () => {
    const off = ssr(createElement(ArtifactCard, { title: "report.md", meta: "Document" }));
    expect(off).toContain('aria-pressed="false"');
    expect(off).toContain('data-slot="artifact-card-title">report.md<');
    expect(off).toContain('data-slot="artifact-card-meta">Document<');
    const on = ssr(createElement(ArtifactCard, { title: "x", selected: true }));
    expect(on).toContain('aria-pressed="true"');
    expect(on).toContain("data-selected");
    expect(off).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("click fires onOpen", async () => {
    const onOpen = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(ArtifactCard, { title: "x", onOpen }));
    });
    await act(async () => host!.querySelector<HTMLButtonElement>("button")!.click());
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
