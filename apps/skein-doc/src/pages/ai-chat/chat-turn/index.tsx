import { ChatTurn, Markdown } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The parts with props of their own, in the order of the API section; their intros are `api.<part>`. */
const PARTS = [
  "Assistant",
  "User",
  "Avatar",
  "Actions",
  "Action",
  "Edit",
  "Pager",
  "Status",
  "Time",
];

/** The parts without props of their own; descriptions are the page's `api.<part>` messages. */
const PLAIN_PARTS = ["Body", "Bubble", "Content"];

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "chat-turn" },
  { key: "avatar", name: "chat-turn-avatar" },
  { key: "body", name: "chat-turn-body" },
  { key: "bubble", name: "chat-turn-bubble" },
  { key: "content", name: "chat-turn-content" },
  { key: "actions", name: "chat-turn-actions" },
  { key: "edit", name: "chat-turn-edit / -textarea / -actions" },
  { key: "pager", name: "chat-turn-pager / chat-turn-pager-count" },
  { key: "status", name: "chat-turn-status / chat-turn-status-retry" },
  { key: "time", name: "chat-turn-time" },
];

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    width="16"
    height="16"
  >
    <path d={d} />
  </svg>
);
const COPY = icon("M9 9h11v11H9zM5 15H4V4h11v1");
const RETRY = icon("M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5");
const LIKE = icon("M7 10v11M7 10l4-7a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2l-1.5 7A2 2 0 0 1 17.5 20H7");

function ActionsDemo() {
  const t = usePageT();
  const [liked, setLiked] = useState(false);
  return (
    <ChatTurn.Assistant>
      <ChatTurn.Avatar alt={t("assistant")} fallback="AI" />
      <ChatTurn.Body>
        <ChatTurn.Content>{t("actions.message")}</ChatTurn.Content>
        <ChatTurn.Actions>
          <ChatTurn.Action aria-label={t("actions.copy")}>{COPY}</ChatTurn.Action>
          <ChatTurn.Action aria-label={t("actions.retry")}>{RETRY}</ChatTurn.Action>
          <ChatTurn.Action
            aria-label={t("actions.like")}
            pressed={liked}
            onClick={() => setLiked((v) => !v)}
          >
            {LIKE}
          </ChatTurn.Action>
        </ChatTurn.Actions>
      </ChatTurn.Body>
    </ChatTurn.Assistant>
  );
}

function EditDemo() {
  const t = usePageT();
  const [text, setText] = useState(() => t("usage.question"));
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <ChatTurn.User>
        {editing ? (
          <ChatTurn.Edit
            defaultValue={text}
            onSave={(v) => {
              setText(v);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <ChatTurn.Bubble>
              <ChatTurn.Content>{text}</ChatTurn.Content>
            </ChatTurn.Bubble>
            <ChatTurn.Actions>
              <ChatTurn.Action aria-label={t("edit.edit")} onClick={() => setEditing(true)}>
                {icon("M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z")}
              </ChatTurn.Action>
            </ChatTurn.Actions>
          </>
        )}
      </ChatTurn.User>
    </div>
  );
}

const VERSION_COUNT = 3;

function PagerDemo() {
  const t = usePageT();
  const [index, setIndex] = useState(1);
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <ChatTurn.Assistant>
        <ChatTurn.Avatar alt={t("assistant")} fallback="AI" />
        <ChatTurn.Body>
          <ChatTurn.Content>{t(`pager.v${index}`)}</ChatTurn.Content>
          <ChatTurn.Actions>
            <ChatTurn.Pager index={index} count={VERSION_COUNT} onIndexChange={setIndex} />
            <ChatTurn.Action aria-label={t("pager.regenerate")}>{RETRY}</ChatTurn.Action>
          </ChatTurn.Actions>
        </ChatTurn.Body>
      </ChatTurn.Assistant>
    </div>
  );
}

function StatusDemo() {
  const t = usePageT();
  const [state, setState] = useState<"sending" | "failed" | null>("failed");
  return (
    <div className="pg-stack" style={{ width: 560, maxWidth: "100%" }}>
      <ChatTurn.User>
        <ChatTurn.Bubble>
          <ChatTurn.Content>{t("status.question")}</ChatTurn.Content>
        </ChatTurn.Bubble>
        {state ? (
          <ChatTurn.Status
            state={state}
            onRetry={() => {
              setState("sending");
              setTimeout(() => setState(null), 1200);
            }}
          />
        ) : (
          <ChatTurn.Time value={new Date()} />
        )}
      </ChatTurn.User>
      <p>
        <button type="button" onClick={() => setState("failed")}>
          {t("status.fail")}
        </button>
      </p>
    </div>
  );
}

export default function ChatTurnPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Chat Turn</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ChatTurn } from "@skeinui/ui";

<ChatTurn.User>
  <ChatTurn.Bubble>
    <ChatTurn.Content>How do I validate a form?</ChatTurn.Content>
  </ChatTurn.Bubble>
</ChatTurn.User>
<ChatTurn.Assistant>
  <ChatTurn.Avatar alt="Assistant" fallback="AI" />
  <ChatTurn.Body>
    <ChatTurn.Content>Use a schema and validate on submit.</ChatTurn.Content>
  </ChatTurn.Body>
</ChatTurn.Assistant>`}
      >
        <div className="pg-stack" style={{ width: 560, maxWidth: "100%" }}>
          <ChatTurn.User>
            <ChatTurn.Bubble>
              <ChatTurn.Content>{t("usage.question")}</ChatTurn.Content>
            </ChatTurn.Bubble>
          </ChatTurn.User>
          <ChatTurn.Assistant>
            <ChatTurn.Avatar alt={t("assistant")} fallback="AI" />
            <ChatTurn.Body>
              <ChatTurn.Content>{t("usage.answer")}</ChatTurn.Content>
            </ChatTurn.Body>
          </ChatTurn.Assistant>
        </div>
      </Example>

      <Example
        id="markdown"
        code={`<ChatTurn.Assistant>
  <ChatTurn.Avatar alt="Assistant" fallback="AI" />
  <ChatTurn.Body>
    <ChatTurn.Content>
      <Markdown>{response}</Markdown>
    </ChatTurn.Content>
  </ChatTurn.Body>
</ChatTurn.Assistant>`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <ChatTurn.Assistant>
            <ChatTurn.Avatar alt={t("assistant")} fallback="AI" />
            <ChatTurn.Body>
              <ChatTurn.Content>
                <Markdown>{t("markdown.reply")}</Markdown>
              </ChatTurn.Content>
            </ChatTurn.Body>
          </ChatTurn.Assistant>
        </div>
      </Example>

      <Example
        id="actions"
        code={`<ChatTurn.Actions>
  <ChatTurn.Action aria-label="Copy">…</ChatTurn.Action>
  <ChatTurn.Action aria-label="Like" pressed={liked} onClick={…}>…</ChatTurn.Action>
</ChatTurn.Actions>`}
      >
        <div style={{ width: 560, maxWidth: "100%" }}>
          <ActionsDemo />
        </div>
      </Example>

      <Example
        id="grouped"
        code={`<ChatTurn.Avatar alt="Assistant" fallback="AI" />
<ChatTurn.Avatar show={false} />`}
      >
        <div className="pg-stack" style={{ width: 560, maxWidth: "100%" }}>
          <ChatTurn.Assistant>
            <ChatTurn.Avatar alt={t("assistant")} fallback="AI" />
            <ChatTurn.Body>
              <ChatTurn.Content>{t("grouped.first")}</ChatTurn.Content>
            </ChatTurn.Body>
          </ChatTurn.Assistant>
          <ChatTurn.Assistant>
            <ChatTurn.Avatar show={false} />
            <ChatTurn.Body>
              <ChatTurn.Content>{t("grouped.second")}</ChatTurn.Content>
            </ChatTurn.Body>
          </ChatTurn.Assistant>
        </div>
      </Example>

      <Example
        id="edit"
        code={`<ChatTurn.User>
  {editing ? (
    <ChatTurn.Edit defaultValue={text} onSave={save} onCancel={cancel} />
  ) : (
    <ChatTurn.Bubble>…</ChatTurn.Bubble>
  )}
</ChatTurn.User>`}
      >
        <EditDemo />
      </Example>

      <Example
        id="pager"
        code={`<ChatTurn.Actions>
  <ChatTurn.Pager index={index} count={3} onIndexChange={setIndex} />
</ChatTurn.Actions>`}
      >
        <PagerDemo />
      </Example>

      <Example
        id="status"
        code={`<ChatTurn.Status state="failed" onRetry={retry} />
<ChatTurn.Time value={message.createdAt} />`}
      >
        <StatusDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        {PARTS.map((part) => (
          <div key={part}>
            <h4>ChatTurn.{part}</h4>
            <p className="pg-desc">{t.rich(`api.${part}`)}</p>
            <ApiReference component={`ChatTurn.${part}`} />
          </div>
        ))}
        <h4>{t("api.more")}</h4>
        <PropsTable
          first={t("api.name")}
          rows={PLAIN_PARTS.map((part) => ({
            name: `ChatTurn.${part}`,
            type: "div",
            description: t.rich(`api.${part}`),
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
