import { ChatThread, ChatTurn } from "@skeinui/ui";
import { useEffect, useRef, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "chat-thread" },
  { key: "content", name: "chat-thread-content" },
  { key: "button", name: "chat-thread-scroll-button-wrap" },
];

/** The parts and helpers without props of their own; descriptions are the page's `api.<key>` messages. */
const EXTRA = [
  { key: "content", name: "ChatThread.Content", type: "div" },
  { key: "hook", name: "useChatThread()", type: "{ atBottom, scrollToBottom }" },
];

const QUESTION_COUNT = 6;

function Turn({ index }: { index: number }) {
  const t = usePageT();
  return (
    <>
      <ChatTurn.User>
        <ChatTurn.Bubble>
          <ChatTurn.Content>{t(`usage.questions.q${index % QUESTION_COUNT}`)}</ChatTurn.Content>
        </ChatTurn.Bubble>
      </ChatTurn.User>
      <ChatTurn.Assistant>
        <ChatTurn.Avatar alt={t("assistant")} fallback="AI" />
        <ChatTurn.Body>
          <ChatTurn.Content>{t("usage.answer", { n: index + 1 })}</ChatTurn.Content>
        </ChatTurn.Body>
      </ChatTurn.Assistant>
    </>
  );
}

function ThreadDemo() {
  const t = usePageT();
  const [count, setCount] = useState(4);
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <p>
        <button type="button" onClick={() => setCount((n) => n + 1)}>
          {t("usage.add")}
        </button>
      </p>
      <div
        style={{
          height: 320,
          border: "1px solid var(--ui-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <ChatThread aria-label={t("usage.label")}>
          <ChatThread.Content>
            {Array.from({ length: count }, (_, i) => (
              <Turn key={i} index={i} />
            ))}
          </ChatThread.Content>
          <ChatThread.ScrollButton />
        </ChatThread>
      </div>
    </div>
  );
}

function StreamingDemo() {
  const t = usePageT();
  // Word by word in English, character by character in Chinese (no spaces)
  const source = t("streaming.text");
  const words = source.includes(" ") ? `${source} `.split(/(?<= )/) : Array.from(source);
  const [n, setN] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setN((v) => {
        if (v >= words.length * 4) {
          setRunning(false);
          return v;
        }
        return v + 1;
      });
    }, 60);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, words.length]);
  const text = Array.from({ length: n }, (_, i) => words[i % words.length]).join("");
  return (
    <div style={{ width: 560, maxWidth: "100%" }}>
      <p>
        <button
          type="button"
          onClick={() => {
            setN(0);
            setRunning(true);
          }}
        >
          {t(running ? "streaming.running" : "streaming.start")}
        </button>
      </p>
      <div
        style={{
          height: 200,
          border: "1px solid var(--ui-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <ChatThread aria-label={t("streaming.label")}>
          <ChatThread.Content>
            <ChatTurn.Assistant>
              <ChatTurn.Avatar alt={t("assistant")} fallback="AI" />
              <ChatTurn.Body>
                <ChatTurn.Content>{text || t("streaming.empty")}</ChatTurn.Content>
              </ChatTurn.Body>
            </ChatTurn.Assistant>
          </ChatThread.Content>
          <ChatThread.ScrollButton />
        </ChatThread>
      </div>
    </div>
  );
}

export default function ChatThreadPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Chat Thread</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { ChatThread } from "@skeinui/ui";

<div style={{ height: 320 }}>
  <ChatThread>
    <ChatThread.Content>{messages}</ChatThread.Content>
    <ChatThread.ScrollButton />
  </ChatThread>
</div>`}
      >
        <ThreadDemo />
      </Example>

      <Example
        id="streaming"
        code={`<ChatThread>
  <ChatThread.Content>
    <ChatTurn.Assistant>… {streamingText} …</ChatTurn.Assistant>
  </ChatThread.Content>
  <ChatThread.ScrollButton />
</ChatThread>`}
      >
        <StreamingDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <p className="pg-desc">{t.rich("api.root")}</p>
        <ApiReference component="ChatThread" />
        <h4>ChatThread.ScrollButton</h4>
        <p className="pg-desc">{t.rich("api.scrollButton")}</p>
        <ApiReference component="ChatThread.ScrollButton" />
        <h4>{t("api.more")}</h4>
        <PropsTable
          first={t("api.name")}
          rows={EXTRA.map((e) => ({
            name: e.name,
            type: e.type,
            description: t.rich(`api.${e.key}`),
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
