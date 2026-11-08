// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { LoginLayout } from "../src/index.ts";
import type { LoginLayoutProps } from "../src/index.ts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const ssr = (props: Partial<LoginLayoutProps> = {}) =>
  renderToStaticMarkup(
    <LoginLayout brand="Acme" title="Sign in" description="Welcome back" {...props}>
      <form data-test="form" />
    </LoginLayout>,
  );

let root: ReturnType<typeof createRoot> | null = null;
let host: HTMLElement | null = null;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe("LoginLayout", () => {
  test("is centered by default: the form's parts in a card, no cover", () => {
    const html = ssr();
    expect(html).toContain('data-slot="login-layout"');
    expect(html).toContain('data-variant="centered"');
    for (const slot of ["head", "brand", "title", "description", "card", "panel", "main"])
      expect(html).toContain(`data-slot="login-layout-${slot}"`);
    expect(html).toContain('data-slot="card"');
    expect(html).not.toContain('data-slot="login-layout-cover"');
    expect(html).not.toContain('data-slot="login-layout-backdrop"');
    expect(html).toContain("<h1");
    expect(html).toContain('data-test="form"');
  });

  test("never writes class or style", () => {
    for (const variant of ["centered", "split", "cover"] as const) {
      const html = ssr({
        variant,
        toolbar: "tools",
        footer: "foot",
        providers: [{ id: "x", label: "X" }],
        providersLabel: "Or",
      });
      expect(html).not.toMatch(/\sclass=/);
      expect(html).not.toMatch(/\sstyle=/);
    }
  });

  test("split: a cover with the brand over a glow, the form without a card; a cover slot fills its middle", () => {
    const html = ssr({ variant: "split" });
    expect(html).toContain('data-variant="split"');
    expect(html).toContain('data-slot="login-layout-cover"');
    expect(html).toContain('data-slot="login-layout-glow"');
    expect(html).toContain('data-slot="login-layout-cover-brand"');
    expect(html).not.toContain('data-slot="card"');
    expect(html).not.toContain('data-slot="login-layout-cover-body"');
    // A cover is put in the middle of it, under the brand
    const custom = ssr({ variant: "split", cover: createElement("span", null, "my cover") });
    expect(custom).toContain('data-slot="login-layout-cover-body"');
    expect(custom).toContain("my cover");
    expect(custom).toContain('data-slot="login-layout-glow"');
    expect(custom).toContain('data-slot="login-layout-cover-brand"');
  });

  test("cover: a backdrop of the glow, or of a picture", () => {
    const glow = ssr({ variant: "cover" });
    expect(glow).toContain('data-slot="login-layout-backdrop"');
    expect(glow).toContain('data-slot="login-layout-glow"');
    expect(glow).toContain('data-slot="card"');
    const picture = ssr({ variant: "cover", backgroundImage: "/bg.jpg" });
    expect(picture).toContain('data-slot="login-layout-backdrop-image"');
    expect(picture).toContain('src="/bg.jpg"');
    expect(picture).not.toContain('data-slot="login-layout-glow"');
  });

  test("the toolbar, footer, description and providers appear only when given", () => {
    const bare = ssr({ description: undefined });
    for (const slot of ["toolbar", "footer", "description", "providers", "divider"])
      expect(bare).not.toContain(`data-slot="login-layout-${slot}"`);
    const full = ssr({
      toolbar: "tools",
      footer: "foot",
      providers: [{ id: "github", label: "GitHub", icon: createElement("i") }],
      providersLabel: "Or continue with",
    });
    for (const slot of ["toolbar", "footer", "providers", "divider", "provider-list"])
      expect(full).toContain(`data-slot="login-layout-${slot}"`);
    expect(full).toContain("Or continue with");
    // The divider needs its text
    expect(ssr({ providers: [{ id: "g", label: "G" }] })).not.toContain("login-layout-divider");
  });

  test("the footer is under the form, and in split at the bottom of the form's side", () => {
    const centered = ssr({ footer: "foot" });
    expect(centered.indexOf("login-layout-footer")).toBeLessThan(centered.indexOf("</main>"));
    expect(centered.indexOf("login-layout-card")).toBeLessThan(
      centered.indexOf("login-layout-footer"),
    );
    // In the card, which closes before the panel does
    expect(centered.indexOf("login-layout-footer")).toBeLessThan(
      centered.indexOf("login-layout-panel") + 400,
    );
    const split = ssr({ variant: "split", footer: "foot" });
    // After the panel: the panel is closed before the footer starts
    const panel = split.slice(
      split.indexOf('data-slot="login-layout-panel"'),
      split.indexOf('data-slot="login-layout-footer"'),
    );
    expect(panel).toContain("</form>");
    expect(split.slice(split.indexOf('data-slot="login-layout-footer"'))).toContain("foot");
    expect(panel.match(/<\/div>/g)?.length).toBeGreaterThanOrEqual(2);
  });

  test("a provider's button reports its id", async () => {
    const onProvider = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () =>
      root!.render(
        <LoginLayout
          brand="Acme"
          title="Sign in"
          providers={[
            { id: "github", label: "GitHub" },
            { id: "google", label: "Google" },
          ]}
          onProvider={onProvider}
        >
          <form />
        </LoginLayout>,
      ),
    );
    const buttons = [...host.querySelectorAll<HTMLButtonElement>("button")];
    await act(async () => buttons.find((b) => b.textContent === "Google")!.click());
    expect(onProvider).toHaveBeenCalledWith("google");
  });
});
