import { useState } from "react";
import { Button, Card, MessageComposer, MessageThread, toast } from "@skeinui/ui";
import type { ComposerMode, MessageKind, ThreadMessage } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

const AGENTS = ["Ada Lin", "Ben Carter", "Chen Yu"];
const HOUR = 3_600_000;

function useKinds(): Record<string, MessageKind> {
  const t = usePageT();
  return {
    customer: { label: t("kinds.customer") },
    agent: { label: t("kinds.agent"), variant: "soft", color: "primary" },
    note: { label: t("kinds.note"), variant: "dashed", color: "warning" },
  };
}

function useMessages(): ThreadMessage[] {
  const t = usePageT();
  const now = Date.now();
  return [
    {
      id: 1,
      kind: "customer",
      author: "Priya Nair",
      time: now - 30 * HOUR,
      body: t("messages.customer"),
      attachments: [{ name: "invite-error.png", size: 183_000 }],
    },
    { id: 2, kind: "note", author: "Ben Carter", time: now - 5 * HOUR, body: t("messages.note") },
    { id: 3, kind: "agent", author: "Ada Lin", time: now - HOUR, body: t("messages.agent") },
  ];
}

function useModes(): ComposerMode[] {
  const t = usePageT();
  return [
    {
      value: "agent",
      label: t("modes.reply"),
      sendLabel: t("modes.sendReply"),
      placeholder: t("modes.replyPlaceholder"),
    },
    {
      value: "note",
      label: t("modes.note"),
      sendLabel: t("modes.addNote"),
      placeholder: t("modes.notePlaceholder"),
      mentions: AGENTS,
    },
  ];
}

function ComposerDemo({ onSend }: { onSend: (value: string, mode: string) => void }) {
  const t = usePageT();
  const modes = useModes();
  const [mode, setMode] = useState("agent");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  return (
    <MessageComposer
      modes={modes}
      mode={mode}
      onModeChange={setMode}
      value={drafts[mode] ?? ""}
      onValueChange={(v) => setDrafts((d) => ({ ...d, [mode]: v }))}
      onSend={(value, m) => {
        onSend(value, m);
        setDrafts((d) => ({ ...d, [m]: "" }));
      }}
      toolbar={(m) =>
        m === "agent" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDrafts((d) => ({ ...d, agent: t("composer.suggestion") }))}
          >
            {t("composer.useSuggestion")}
          </Button>
        ) : null
      }
    />
  );
}

function Conversation() {
  const t = usePageT();
  const kinds = useKinds();
  const [messages, setMessages] = useState(useMessages());
  return (
    <Card>
      <Card.Body>
        <div className="pg-stack">
          <MessageThread messages={messages} kinds={kinds} mentions={AGENTS} />
          <ComposerDemo
            onSend={(value, mode) => {
              setMessages((all) => [
                ...all,
                {
                  id: all.length + 1,
                  kind: mode,
                  author: "Ada Lin",
                  time: Date.now(),
                  body: value,
                },
              ]);
              toast.success(t("conversation.sent"));
            }}
          />
        </div>
      </Card.Body>
    </Card>
  );
}

export default function MessageThreadPage() {
  const t = usePageT();
  const kinds = useKinds();
  const messages = useMessages();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Message Thread</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`<MessageThread
  messages={[
    { id: 1, kind: "customer", author: "Priya Nair", time: sentAt, body: "How do I invite a teammate?", attachments: [{ name: "error.png", size: 183000 }] },
    { id: 2, kind: "note", author: "Ben Carter", time: noteAt, body: "@Ada Lin can you look at this one?" },
  ]}
  kinds={{
    customer: { label: "Customer" },
    agent: { label: "Agent", variant: "soft", color: "primary" },
    note: { label: "Internal note", variant: "dashed", color: "warning" },
  }}
  mentions={["Ada Lin", "Ben Carter"]}
/>`}
      >
        <MessageThread messages={messages} kinds={kinds} mentions={AGENTS} />
      </Example>

      <Example
        id="relative"
        code={`<MessageThread messages={messages} kinds={kinds} relativeTime />`}
      >
        <MessageThread messages={messages} kinds={kinds} mentions={AGENTS} relativeTime />
      </Example>

      <Example
        id="composer"
        code={`<MessageComposer
  modes={[
    { value: "agent", label: "Reply", sendLabel: "Send reply" },
    { value: "note", label: "Internal note", sendLabel: "Add note", mentions: ["Ada Lin", "Ben Carter"] },
  ]}
  mode={mode}
  onModeChange={setMode}
  value={drafts[mode] ?? ""}
  onValueChange={(v) => setDrafts({ ...drafts, [mode]: v })}
  onSend={(value, mode) => send(value, mode)}
  toolbar={(mode) => (mode === "agent" ? <Button size="sm" variant="ghost">Use the suggestion</Button> : null)}
/>`}
      >
        <ComposerDemo onSend={(value, mode) => toast(t("composer.sent", { mode, value }))} />
      </Example>

      <Example
        id="conversation"
        code={`<MessageThread messages={messages} kinds={kinds} mentions={agentNames} />
<MessageComposer modes={modes} mode={mode} onModeChange={setMode} value={draft} onValueChange={setDraft} onSend={send} />`}
      >
        <Conversation />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="MessageThread" />
      </section>

      <section id="composerApi" className="pg-example">
        <h3>{t("composerApi.title")}</h3>
        <ApiReference component="MessageComposer" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
      </section>
    </article>
  );
}
