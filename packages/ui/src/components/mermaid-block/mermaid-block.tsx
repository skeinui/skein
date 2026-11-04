import { useEffect, useRef, useState } from "react";
import { useLabels } from "../../locales/use-labels.ts";

export type MermaidTheme = "light" | "dark";

export interface MermaidLabels {
  /** Name of the diagram (for screen readers), default "Diagram". */
  diagram?: string;
  /** Header title, default "Mermaid". */
  title?: string;
  /** Button to switch to the source, default "View source". */
  showSource?: string;
  /** Button to switch back to the diagram, default "View diagram". */
  showDiagram?: string;
  /** Copy-source button, default "Copy source". */
  copy?: string;
  /** Copy button's label for 2 seconds after copying, default "Copied". */
  copied?: string;
  /** Text while rendering, default "Rendering diagram…". */
  rendering?: string;
  /** Prefix on render failure, default "Couldn't render the diagram". */
  error?: string;
  /** Name of the source area, default "Diagram source". */
  source?: string;
}

export interface MermaidBlockProps {
  /** Mermaid source. */
  code: string;
  /**
   * Render the source into an SVG string; the library does not bundle Mermaid, so the consumer hooks it up:
   * `(code, { theme }) => mermaid.render(id, code).then((r) => r.svg)`.
   * Initialize Mermaid with `securityLevel: "strict"` and turn off `htmlLabels`: the SVG is placed in an `<img>` (scripts do not run and nothing is injected into the page),
   * and `foreignObject` text support inside `<img>` is unreliable.
   */
  render: (code: string, options: { theme: MermaidTheme }) => Promise<string>;
  labels?: MermaidLabels;
}

type State = "loading" | "ready" | "error";

const COPIED_MS = 2000;

/** Whether it is currently light or dark: reads `data-mode` on `<html>`, and follows the system if unset. */
function currentTheme(): MermaidTheme {
  if (typeof document === "undefined") return "light";
  const mode = document.documentElement.getAttribute("data-mode");
  if (mode === "dark" || mode === "light") return mode;
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function useTheme(): MermaidTheme {
  const [theme, setTheme] = useState<MermaidTheme>("light");
  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

/** The SVG output by Mermaid has width="100%" and no intrinsic size; take it from the viewBox so the img is not stretched to fill the container. */
function intrinsicSize(svg: string): { width: number; height: number } | null {
  const match =
    /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(svg);
  const width = Number(match?.[1]);
  const height = Number(match?.[2]);
  return width > 0 && height > 0 ? { width: Math.round(width), height: Math.round(height) } : null;
}

const toDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const icon = (children: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/**
 * Mermaid diagram block: renders Mermaid `code` as a diagram, with a header holding a title, a "view source" toggle and a copy button.
 * Mermaid is not bundled: pass `render` (code → SVG string), and the result is shown as an `<img>`, so the SVG is never injected into the page.
 * While rendering a status is announced to screen readers; on failure the error is shown with the source; if it rendered before, the previous diagram stays (faded).
 * Switching light / dark mode (`data-mode` on `<html>`) re-renders with the new theme.
 * For plain source code use CodeBlock.
 *
 * Theme style: `data-state` (loading / ready / error) and `data-view` (diagram / source) on the root, `data-stale` on the image while re-rendering.
 */
export function MermaidBlock({ code, render, labels: labelsProp }: MermaidBlockProps) {
  const labels = useLabels("mermaidBlock", labelsProp);
  const theme = useTheme();
  const [state, setState] = useState<State>("loading");
  const [src, setSrc] = useState<string | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [message, setMessage] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Put the latest render in a ref, so the caller passing a new function each time does not trigger a re-render
  const renderRef = useRef(render);
  renderRef.current = render;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    let current = true;
    setState("loading");
    renderRef
      .current(code, { theme })
      .then((svg) => {
        if (!current) return;
        if (!/^\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(svg)) {
          throw new Error("The renderer did not return an SVG");
        }
        setSrc(toDataUrl(svg));
        setSize(intrinsicSize(svg));
        setMessage("");
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!current) return;
        setMessage(error instanceof Error ? error.message : String(error));
        setState("error");
      });
    return () => {
      current = false;
    };
  }, [code, theme]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  const name = labels.diagram;
  const sourceVisible = showSource || (state === "error" && src === null);
  const toggleLabel = showSource ? labels.showDiagram : labels.showSource;

  return (
    <figure data-slot="mermaid" data-state={state} data-view={sourceVisible ? "source" : "diagram"}>
      <figcaption data-slot="mermaid-header">
        <span data-slot="mermaid-title">{labels.title}</span>
        <span data-slot="mermaid-actions">
          <button
            type="button"
            data-slot="mermaid-action"
            aria-label={toggleLabel}
            aria-pressed={showSource}
            onClick={() => setShowSource((v) => !v)}
          >
            {icon(
              <>
                <path d="m16 18 6-6-6-6" />
                <path d="m8 6-6 6 6 6" />
              </>,
            )}
          </button>
          <button
            type="button"
            data-slot="mermaid-action"
            data-copied={copied ? "" : undefined}
            aria-label={copied ? labels.copied : labels.copy}
            onClick={copy}
          >
            {copied
              ? icon(<path d="M20 6 9 17l-5-5" />)
              : icon(
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </>,
                )}
          </button>
        </span>
      </figcaption>
      {state === "error" ? (
        <div data-slot="mermaid-error" role="alert">
          {labels.error}
          {message ? `: ${message}` : ""}
        </div>
      ) : null}
      {sourceVisible ? (
        <pre data-slot="mermaid-source" tabIndex={0} role="region" aria-label={labels.source}>
          {code}
        </pre>
      ) : (
        <div data-slot="mermaid-body" tabIndex={0} role="region" aria-label={name}>
          {src ? (
            <img
              data-slot="mermaid-image"
              data-stale={state !== "ready" ? "" : undefined}
              src={src}
              alt={name}
              width={size?.width}
              height={size?.height}
            />
          ) : null}
          {state === "loading" ? (
            <div data-slot="mermaid-status" role="status">
              {labels.rendering}
            </div>
          ) : null}
        </div>
      )}
    </figure>
  );
}
