import { Attachment, AttachmentGroup, Composer } from "@skeinui/ui";
import { useEffect, useRef, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The parts, with the element each renders; their descriptions are the page's `api.parts.<key>` messages. */
const PARTS = [
  { key: "Composer", name: "Composer", element: "form" },
  { key: "Shell", name: "Composer.Shell", element: "div" },
  { key: "Attachments", name: "Composer.Attachments", element: "div" },
  { key: "TextArea", name: "Composer.TextArea", element: "textarea" },
  { key: "Toolbar", name: "Composer.Toolbar / ToolbarStart / ToolbarEnd", element: "div" },
  { key: "Action", name: "Composer.Action", element: "Button" },
  { key: "Send", name: "Composer.Send", element: "Button" },
  { key: "Footer", name: "Composer.Footer", element: "p" },
];

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "composer" },
  { key: "shell", name: "composer-shell" },
  { key: "attachments", name: "composer-attachments" },
  { key: "textarea", name: "composer-textarea" },
  { key: "toolbar", name: "composer-toolbar / -start / -end" },
  { key: "footer", name: "composer-footer" },
];

const PlusIcon = (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function BasicDemo() {
  const t = usePageT();
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Composer onSubmit={(v) => setSent((s) => [...s, v])}>
        <Composer.Shell>
          <Composer.TextArea placeholder={t("usage.placeholder")} />
          <Composer.Toolbar>
            <Composer.ToolbarStart />
            <Composer.ToolbarEnd>
              <Composer.Send />
            </Composer.ToolbarEnd>
          </Composer.Toolbar>
        </Composer.Shell>
        <Composer.Footer>{t("usage.footer")}</Composer.Footer>
      </Composer>
      {sent.length ? (
        <ul>
          {sent.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StreamingDemo() {
  const t = usePageT();
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  const [log, setLog] = useState<{ key: string; text?: string }>({ key: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Composer
        status={status}
        onSubmit={(v) => {
          setStatus("streaming");
          setLog({ key: "answering", text: v });
          timer.current = setTimeout(() => {
            setStatus("idle");
            setLog({ key: "done" });
          }, 4000);
        }}
        onStop={() => {
          if (timer.current) clearTimeout(timer.current);
          setStatus("idle");
          setLog({ key: "stopped" });
        }}
      >
        <Composer.Shell>
          <Composer.TextArea placeholder={t("streaming.placeholder")} />
          <Composer.Toolbar>
            <Composer.ToolbarStart />
            <Composer.ToolbarEnd>
              <Composer.Send />
            </Composer.ToolbarEnd>
          </Composer.Toolbar>
        </Composer.Shell>
      </Composer>
      <p>{t(`streaming.${log.key}`, { text: log.text ?? "" })}</p>
    </div>
  );
}

function TriggersDemo() {
  const t = usePageT();
  const [log, setLog] = useState("");
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Composer onSubmit={(v) => setLog(t("triggers.sent", { text: v }))}>
        <Composer.Shell>
          <Composer.TextArea
            placeholder={t("triggers.placeholder")}
            triggers={{
              "@": ["ada", "grace", "linus"],
              "/": [
                { value: "summarize", label: t("triggers.summarize") },
                { value: "translate", label: t("triggers.translate") },
              ],
            }}
            onTriggerSelect={(option, prefix) =>
              setLog(t("triggers.picked", { text: `${prefix}${option.value}` }))
            }
          />
          <Composer.Toolbar>
            <Composer.ToolbarStart />
            <Composer.ToolbarEnd>
              <Composer.Send />
            </Composer.ToolbarEnd>
          </Composer.Toolbar>
        </Composer.Shell>
      </Composer>
      <p>{log || t("triggers.none")}</p>
    </div>
  );
}

function AttachmentsDemo() {
  const t = usePageT();
  const [files, setFiles] = useState([
    { name: "brief.pdf", size: 824120 },
    { name: "data.csv", size: 12000 },
  ]);
  const [text, setText] = useState("");
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <Composer
        value={text}
        onValueChange={setText}
        canSubmit={text.trim() !== "" || files.length > 0}
        onSubmit={() => {
          setText("");
          setFiles([]);
        }}
      >
        <Composer.Shell>
          {files.length ? (
            <Composer.Attachments>
              <AttachmentGroup aria-label={t("attachments.group")}>
                {files.map((f) => (
                  <Attachment
                    key={f.name}
                    {...f}
                    onRemove={() => setFiles((all) => all.filter((x) => x.name !== f.name))}
                  />
                ))}
              </AttachmentGroup>
            </Composer.Attachments>
          ) : null}
          <Composer.TextArea placeholder={t("attachments.placeholder")} />
          <Composer.Toolbar>
            <Composer.ToolbarStart>
              <Composer.Action
                aria-label={t("attachments.attach")}
                onClick={() =>
                  setFiles((all) => [...all, { name: `file-${all.length + 1}.txt`, size: 900 }])
                }
              >
                {PlusIcon}
              </Composer.Action>
            </Composer.ToolbarStart>
            <Composer.ToolbarEnd>
              <Composer.Send />
            </Composer.ToolbarEnd>
          </Composer.Toolbar>
        </Composer.Shell>
      </Composer>
    </div>
  );
}

export default function ComposerPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Composer</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Composer } from "@skeinui/ui";

<Composer onSubmit={send}>
  <Composer.Shell>
    <Composer.TextArea placeholder="What do you want to know?" />
    <Composer.Toolbar>
      <Composer.ToolbarStart />
      <Composer.ToolbarEnd>
        <Composer.Send />
      </Composer.ToolbarEnd>
    </Composer.Toolbar>
  </Composer.Shell>
  <Composer.Footer>AI can make mistakes.</Composer.Footer>
</Composer>`}
      >
        <BasicDemo />
      </Example>

      <Example
        id="streaming"
        code={`<Composer status={status} onSubmit={send} onStop={stop}>…</Composer>`}
      >
        <StreamingDemo />
      </Example>

      <Example
        id="attachments"
        code={`<Composer canSubmit={text.trim() !== "" || files.length > 0} …>
  <Composer.Shell>
    <Composer.Attachments><AttachmentGroup>…</AttachmentGroup></Composer.Attachments>
    <Composer.TextArea />
    <Composer.Toolbar>
      <Composer.ToolbarStart>
        <Composer.Action aria-label="Attach file">+</Composer.Action>
      </Composer.ToolbarStart>
      <Composer.ToolbarEnd><Composer.Send /></Composer.ToolbarEnd>
    </Composer.Toolbar>
  </Composer.Shell>
</Composer>`}
      >
        <AttachmentsDemo />
      </Example>

      <Example
        id="triggers"
        code={`<Composer.TextArea
  triggers={{
    "@": ["ada", "grace"],
    "/": [{ value: "summarize", label: "Summarize this chat" }],
  }}
  onTriggerSelect={(option, prefix) => …}
/>`}
      >
        <TriggersDemo />
      </Example>

      <Example id="submit-on" code={`<Composer submitOn="mod-enter" …>…</Composer>`}>
        <div style={{ width: 560, maxWidth: "100%" }}>
          <Composer submitOn="mod-enter" onSubmit={() => {}}>
            <Composer.Shell>
              <Composer.TextArea placeholder={t("submit-on.placeholder")} />
              <Composer.Toolbar>
                <Composer.ToolbarStart />
                <Composer.ToolbarEnd>
                  <Composer.Send />
                </Composer.ToolbarEnd>
              </Composer.Toolbar>
            </Composer.Shell>
          </Composer>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <PropsTable
          first={t("api.part")}
          second={t("api.element")}
          rows={PARTS.map((p) => ({
            name: p.name,
            type: p.element,
            description: t.rich(`api.parts.${p.key}`),
          }))}
        />
        <h4>Composer</h4>
        <ApiReference component="Composer" />
        <h4>Composer.TextArea</h4>
        <ApiReference component="Composer.TextArea" />
        <h4>Composer.Action</h4>
        <ApiReference component="Composer.Action" />
        <h4>Composer.Send</h4>
        <ApiReference component="Composer.Send" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
