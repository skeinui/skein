import { Upload, type UploadFile } from "@skeinui/ui";
import { useEffect, useRef, useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "upload / upload-trigger", type: "slot" },
  { key: "trigger", name: "upload-icon / upload-title / upload-hint", type: "slot" },
  { key: "list", name: "upload-list / upload-item", type: "slot" },
  { key: "item", name: "upload-item-icon / name / meta / progress / error / action", type: "slot" },
];

let seq = 0;

function UploadDemo({ variant }: { variant: "dropzone" | "button" }) {
  const t = usePageT();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearInterval(t));
  }, []);

  const run = (id: string, shouldFail: boolean) => {
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 20;
      setFiles((list) =>
        list.map((f) =>
          f.id !== id
            ? f
            : progress >= 100
              ? shouldFail
                ? { ...f, status: "error", error: t("usage.failed") }
                : { ...f, status: "done", progress: 100 }
              : { ...f, progress },
        ),
      );
      if (progress >= 100) {
        window.clearInterval(timer);
        timers.current.delete(id);
      }
    }, 400);
    timers.current.set(id, timer);
  };

  return (
    <div className="pg-stack">
      <Upload
        variant={variant}
        multiple
        hint={t("usage.hint")}
        files={files}
        onFilesAdded={(added) => {
          const next = added.map<UploadFile>((f) => ({
            id: `f${++seq}`,
            name: f.name,
            size: f.size,
            status: "uploading",
            progress: 0,
          }));
          setFiles((list) => [...list, ...next]);
          next.forEach((n, i) => run(n.id, /fail/i.test(added[i]!.name)));
        }}
        onRemove={(id) => {
          const t = timers.current.get(id);
          if (t) window.clearInterval(t);
          timers.current.delete(id);
          setFiles((list) => list.filter((f) => f.id !== id));
        }}
        onRetry={(id) => {
          setFiles((list) =>
            list.map((f) =>
              f.id === id ? { ...f, status: "uploading", progress: 0, error: undefined } : f,
            ),
          );
          run(id, false);
        }}
      />
    </div>
  );
}

export default function UploadPage() {
  const t = usePageT();
  const STATES: UploadFile[] = [
    { id: "1", name: "report.pdf", size: 12_582_912, status: "done" },
    { id: "2", name: "photo.png", size: 5_242_880, status: "uploading", progress: 45 },
    {
      id: "3",
      name: "video.mov",
      size: 90_000_000,
      status: "error",
      error: t("states.tooLarge"),
    },
  ];

  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Upload</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Upload } from "@skeinui/ui";

<Upload
  multiple
  hint="PNG or JPG, up to 5 MB"
  files={files}
  onFilesAdded={(added) => upload(added)}
  onRemove={(id) => remove(id)}
  onRetry={(id) => retry(id)}
/>`}
      >
        <UploadDemo variant="dropzone" />
      </Example>

      <Example id="button" code={`<Upload variant="button" title="Upload file" … />`}>
        <UploadDemo variant="button" />
      </Example>

      <Example
        id="states"
        code={`files={[{ id, name, size, status: "done" | "uploading" | "error", progress, error }]}`}
      >
        <Upload files={STATES} onRemove={() => {}} onRetry={() => {}} />
      </Example>

      <Example id="disabled" code={`<Upload disabled … />`}>
        <Upload disabled hint={t("disabled.hint")} />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Upload" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
