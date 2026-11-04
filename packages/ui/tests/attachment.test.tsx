// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { Attachment, AttachmentGroup, attachmentKind, formatFileSize } from "../src/index.ts";

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

describe("formatFileSize", () => {
  test.each([
    [0, "0 B"],
    [512, "512 B"],
    [1024, "1 KB"],
    [1536, "1.5 KB"],
    [248320, "243 KB"],
    [824120, "805 KB"],
    [5 * 1024 * 1024, "5 MB"],
    [1.5 * 1024 * 1024 * 1024, "1.5 GB"],
  ])("%s → %s", (bytes, text) => {
    expect(formatFileSize(bytes)).toBe(text);
  });
  test("invalid values give an empty string", () => {
    expect(formatFileSize(-1)).toBe("");
    expect(formatFileSize(Number.NaN)).toBe("");
  });
});

describe("attachmentKind", () => {
  test.each([
    ["a.bin", "image/png", "image"],
    ["a.bin", "video/mp4", "video"],
    ["a.bin", "audio/mpeg", "audio"],
    ["a.bin", "application/pdf", "pdf"],
    ["a.bin", "application/zip", "archive"],
    ["a.bin", "text/csv", "sheet"],
    ["a.bin", "application/json", "code"],
    ["a.bin", "text/plain", "doc"],
    ["report.PDF", undefined, "pdf"],
    ["data.xlsx", undefined, "sheet"],
    ["index.tsx", undefined, "code"],
    ["noext", undefined, "file"],
    [".gitignore", undefined, "file"],
  ])("%s %s → %s", (name, mime, kind) => {
    expect(attachmentKind(name, mime)).toBe(kind);
  });
});

describe("Attachment", () => {
  test("file card: extension icon, name, formatted size, has a name, no class / style", () => {
    const html = ssr(
      createElement(Attachment, { name: "brief.pdf", size: 824120, mimeType: "application/pdf" }),
    );
    expect(html).toContain('data-variant="file"');
    expect(html).toContain('data-kind="pdf"');
    expect(html).toContain('role="group" aria-label="brief.pdf"');
    expect(html).toContain('data-slot="attachment-icon" aria-hidden="true">PDF<');
    expect(html).toContain('data-slot="attachment-name">brief.pdf<');
    expect(html).toContain('data-slot="attachment-size">805 KB<');
    expect(html).not.toMatch(/\sclass=|\sstyle=/);
  });

  test("image with src: a thumbnail tile (empty alt, the name is in the info layer)", () => {
    const html = ssr(
      createElement(Attachment, { name: "shot.png", src: "/shot.png", mimeType: "image/png" }),
    );
    expect(html).toContain('data-variant="media"');
    expect(html).toContain('<img data-slot="attachment-image" src="/shot.png" alt=""');
    expect(html).not.toContain("attachment-icon");
  });

  test("video: muted, preload metadata only, hidden from screen readers", () => {
    const html = ssr(createElement(Attachment, { name: "clip.mp4", src: "/c.mp4" }));
    expect(html).toContain('data-variant="media"');
    expect(html).toContain("<video");
    expect(html).toContain("muted");
    expect(html).toContain('preload="metadata"');
    expect(html).toContain('aria-hidden="true"');
  });

  test("image without src: falls back to a file card; mediaType overrides the guess", () => {
    expect(ssr(createElement(Attachment, { name: "shot.png" }))).toContain('data-variant="file"');
    expect(
      ssr(createElement(Attachment, { name: "x.bin", src: "/x", mediaType: "image" })),
    ).toContain('data-variant="media"');
  });

  test("a file without extension shows FILE, no size without size", () => {
    const html = ssr(createElement(Attachment, { name: "README" }));
    expect(html).toContain(">FILE<");
    expect(html).not.toContain("attachment-size");
  });

  test("onRemove: the remove button has a name and calls back; no button without it", async () => {
    const onRemove = vi.fn();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(createElement(Attachment, { name: "a.txt", onRemove }));
    });
    const button = host.querySelector<HTMLButtonElement>('[data-slot="attachment-remove"]')!;
    expect(button.getAttribute("aria-label")).toBe("Remove a.txt");
    await act(async () => button.click());
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(ssr(createElement(Attachment, { name: "a.txt" }))).not.toContain("attachment-remove");
    expect(
      ssr(createElement(Attachment, { name: "a.txt", onRemove, removeLabel: "Remove file" })),
    ).toContain('aria-label="Remove file"');
  });
});

describe("AttachmentGroup", () => {
  test("a group of attachments: role=group with a name", () => {
    const html = ssr(
      createElement(
        AttachmentGroup,
        { "aria-label": "Files" },
        createElement(Attachment, { name: "a.txt" }),
      ),
    );
    expect(html).toContain('role="group" aria-label="Files" data-slot="attachment-group"');
    expect(ssr(createElement(AttachmentGroup))).toContain('aria-label="Attachments"');
  });
});
