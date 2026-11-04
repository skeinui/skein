import { ImageGrid } from "@skeinui/ui";
import type { ImageGridItem } from "@skeinui/ui";
import { useEffect, useRef, useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "image-grid" },
  { key: "item", name: "image-grid-item" },
  { key: "loading", name: "image-grid-loading / image-grid-status" },
  { key: "progress", name: "image-grid-progress / image-grid-progress-bar" },
  { key: "error", name: "image-grid-error / image-grid-message / image-grid-retry" },
  { key: "actions", name: "image-grid-actions / image-grid-action" },
  { key: "remove", name: "image-grid-remove" },
  { key: "image", name: "image" },
];

/** Demo image: generates a gradient SVG by hue (data URI, no network needed). */
const swatch = (hue: number, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 80% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 75% 42%)"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="215" font-size="64" text-anchor="middle" fill="white" font-family="system-ui" font-weight="700">${label}</text></svg>`,
  )}`;

const READY: ImageGridItem[] = [10, 70, 160, 250].map((hue, i) => ({
  id: `r${i}`,
  alt: `Sample ${i + 1}`,
  src: swatch(hue, String(i + 1)),
}));

const wrap = { width: 420, maxWidth: "100%" } as const;

const DownloadIcon = (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);
const RefreshIcon = (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
  </svg>
);

/** Simulate one generation: four images show progress and appear in turn, the third fails and succeeds after clicking retry. */
function GeneratingDemo() {
  const t = usePageT();
  const [items, setItems] = useState<ImageGridItem[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const failed = useRef(true);
  const clear = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const run = (index: number, hue: number) => {
    const set = (patch: Partial<ImageGridItem>) =>
      setItems((all) => all.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    set({ status: "loading", progress: 0, error: undefined });
    for (const [step, p] of [20, 55, 85].entries()) {
      timers.current.push(setTimeout(() => set({ progress: p }), 500 + step * 500 + index * 300));
    }
    timers.current.push(
      setTimeout(
        () => {
          if (index === 2 && failed.current) {
            set({ status: "error", error: t("generating.blocked") });
          } else {
            set({ status: "ready", src: swatch(hue, String(index + 1)), progress: undefined });
          }
        },
        2300 + index * 300,
      ),
    );
  };
  const start = () => {
    clear();
    failed.current = true;
    const hues = [10, 70, 160, 250];
    setItems(
      hues.map((_, i) => ({
        id: `g${i}`,
        alt: `Generated ${i + 1}`,
        status: "loading",
        progress: 0,
      })),
    );
    hues.forEach((hue, i) => run(i, hue));
  };

  return (
    <div style={wrap}>
      <p style={{ marginBottom: 12 }}>
        <button type="button" onClick={start}>
          {t(items.length ? "generating.again" : "generating.start")}
        </button>
      </p>
      {items.length ? (
        <ImageGrid
          aria-label="Generated images"
          items={items}
          onRetry={(item) => {
            failed.current = false;
            run(Number(item.id.slice(1)), 160);
          }}
        />
      ) : null}
    </div>
  );
}

function ActionsDemo() {
  const t = usePageT();
  const [items, setItems] = useState(READY);
  return (
    <div style={wrap}>
      <ImageGrid
        aria-label="Images with actions"
        items={items}
        onRemove={(item) => setItems((all) => all.filter((x) => x.id !== item.id))}
        actions={(item) => (
          <>
            <ImageGrid.Action aria-label={`Regenerate ${item.alt}`}>{RefreshIcon}</ImageGrid.Action>
            <ImageGrid.Action aria-label={`Download ${item.alt}`}>{DownloadIcon}</ImageGrid.Action>
          </>
        )}
      />
      <p style={{ marginTop: 12 }}>
        <button type="button" onClick={() => setItems(READY)}>
          {t("actions.reset")}
        </button>
      </p>
    </div>
  );
}

export default function ImageGridPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Image Grid</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ImageGrid } from "@skeinui/ui";

<ImageGrid items={[{ id: "1", alt: "Sample 1", src: "/1.png" }, …]} />`}
      >
        <div style={wrap}>
          <ImageGrid aria-label="Samples" items={READY} />
        </div>
      </Example>

      <Example
        id="states"
        code={`<ImageGrid
  items={[
    { id: "a", alt: "A", src },
    { id: "b", alt: "B", status: "loading", progress: 60 },
    { id: "c", alt: "C", status: "loading" },
    { id: "d", alt: "D", status: "error", error: "Upload failed" },
  ]}
  onRetry={retry}
/>`}
      >
        <div style={wrap}>
          <ImageGrid
            aria-label="States"
            onRetry={() => {}}
            items={[
              READY[0]!,
              { id: "b", alt: "B", status: "loading", progress: 60 },
              { id: "c", alt: "C", status: "loading" },
              { id: "d", alt: "D", status: "error", error: t("states.uploadFailed") },
            ]}
          />
        </div>
      </Example>

      <Example
        id="generating"
        code={`setItems(prompts.map((_, i) => ({ id: String(i), alt: …, status: "loading", progress: 0 })));
// then, as each one progresses or finishes, update that item's status / progress / src / error`}
      >
        <GeneratingDemo />
      </Example>

      <Example
        id="actions"
        code={`<ImageGrid
  items={items}
  onRemove={(item) => remove(item.id)}
  actions={(item) => (
    <ImageGrid.Action aria-label={\`Download \${item.alt}\`}><DownloadIcon /></ImageGrid.Action>
  )}
/>`}
      >
        <ActionsDemo />
      </Example>

      <Example
        id="layout"
        code={`<ImageGrid items={items} columns={4} ratio="landscape" />
<ImageGrid items={items} ratio="portrait" />`}
      >
        <div className="pg-stack" style={wrap}>
          <ImageGrid aria-label="4 columns" columns={4} ratio="landscape" items={READY} />
          <ImageGrid aria-label="Portrait" ratio="portrait" items={READY.slice(0, 2)} />
          <ImageGrid aria-label="Wide" ratio="wide" items={READY.slice(0, 1)} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ImageGrid" />
        <h4>ImageGrid.Action</h4>
        <ApiReference component="ImageGrid.Action" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "data-slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
