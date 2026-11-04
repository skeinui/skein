import { Attachment, AttachmentGroup } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The exported helpers; their descriptions are the page's `api.<key>` messages. */
const HELPERS = [
  { key: "kind", name: "attachmentKind(name, mimeType?)", type: "AttachmentKind" },
  { key: "size", name: "formatFileSize(bytes)", type: "string" },
];

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "attachment" },
  { key: "preview", name: "attachment-preview" },
  { key: "media", name: "attachment-image / attachment-video" },
  { key: "icon", name: "attachment-icon" },
  { key: "info", name: "attachment-info / attachment-name / attachment-size" },
  { key: "remove", name: "attachment-remove" },
  { key: "group", name: "attachment-group" },
];

const PHOTO = (n: number) =>
  `https://randomuser.me/api/portraits/${n % 2 ? "men" : "women"}/${n}.jpg`;

function RemovableDemo() {
  const t = usePageT();
  const [files, setFiles] = useState([
    { name: "quarterly-report.pdf", size: 2_345_678, mimeType: "application/pdf" },
    { name: "budget.xlsx", size: 48_120 },
    { name: "notes.md", size: 1_800 },
  ]);
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <AttachmentGroup aria-label={t("removable.group")}>
        {files.map((f) => (
          <Attachment
            key={f.name}
            {...f}
            onRemove={() => setFiles((all) => all.filter((x) => x.name !== f.name))}
          />
        ))}
      </AttachmentGroup>
      {files.length === 0 ? <p>{t("removable.empty")}</p> : null}
    </div>
  );
}

export default function AttachmentPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Attachment</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="files"
        code={`import { Attachment, AttachmentGroup } from "@skeinui/ui";

<AttachmentGroup>
  <Attachment name="brief.pdf" size={824120} mimeType="application/pdf" />
  <Attachment name="data.csv" size={12000} />
</AttachmentGroup>`}
      >
        <AttachmentGroup>
          <Attachment name="brief.pdf" size={824120} mimeType="application/pdf" />
          <Attachment name="data.csv" size={12000} />
          <Attachment name="archive.zip" size={5_242_880} />
          <Attachment name="index.tsx" size={2048} />
          <Attachment name="voice-note.mp3" size={348_000} />
          <Attachment name="README" size={900} />
        </AttachmentGroup>
      </Example>

      <Example id="media" code={`<Attachment name="portrait.jpg" size={248320} src={url} />`}>
        <AttachmentGroup>
          <Attachment name="portrait-1.jpg" size={248320} src={PHOTO(32)} />
          <Attachment name="portrait-2.jpg" size={198000} src={PHOTO(44)} />
          <Attachment name="no-preview.png" size={51200} />
        </AttachmentGroup>
      </Example>

      <Example id="removable" code={`<Attachment name="a.pdf" onRemove={() => remove("a.pdf")} />`}>
        <RemovableDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Attachment" />
        <h4>AttachmentGroup</h4>
        <p className="pg-desc">{t.rich("api.group")}</p>
        <ApiReference component="AttachmentGroup" />
        <h4>{t("api.helpers")}</h4>
        <PropsTable
          first={t("api.function")}
          rows={HELPERS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`api.${h.key}`),
          }))}
        />
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
