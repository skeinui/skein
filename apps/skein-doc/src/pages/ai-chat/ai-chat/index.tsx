import {
  Artifact,
  ArtifactCard,
  Attachment,
  AttachmentGroup,
  ChatThread,
  ChatTurn,
  Citation,
  Citations,
  Composer,
  ContextMeter,
  DiffView,
  Feedback,
  ImageGrid,
  Markdown,
  ModelPicker,
  Plan,
  Queue,
  Quote,
  QuoteSelection,
  Reasoning,
  Suggestions,
  Terminal,
  ThreadList,
  ToolCall,
  Typing,
  WebPreview,
} from "@skeinui/ui";
import type { ImageGridItem } from "@skeinui/ui";
import { useEffect, useRef, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { DocHeading, Example, Lead } from "@/doc/doc.tsx";

type Phase = "typing" | "thinking" | "tool" | "answering" | "done" | "stopped";

interface Msg {
  id: number;
  role: "user" | "assistant";
  text: string;
  files?: { name: string; size: number }[];
  phase?: Phase;
  steps?: number;
  toolDone?: boolean;
  /** Other reply versions after regenerating; version is the one currently viewed (0 is the original streamed reply). */
  alternates?: string[];
  version?: number;
  sentAt?: number;
  quote?: string;
  /** If set, it is a reply that generates images: text + a set of images with status. */
  images?: ImageGridItem[];
}

/** The demo's texts are the page's `full.*` messages. */
type T = ReturnType<typeof usePageT>;

const sources = (t: T) => [
  { href: "https://base-ui.com", title: "Base UI", description: t("full.baseUi") },
  { href: "https://react.dev", title: "React" },
];

const ALTERNATES = ["full.alternate1", "full.alternate2"];

const models = (t: T) => [
  { id: "fast", name: t("full.fast"), description: t("full.fastText"), badge: t("full.new") },
  { id: "smart", name: t("full.smart"), description: t("full.smartText") },
];

/** The reasoning steps: `full.<key>` and `full.<key>Text`. */
const STEPS = ["understand", "search", "plan"];

const OLD_CODE = `export function validate(input: unknown) {
  return input;
}
`;
const NEW_CODE = `import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export function validate(input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? result.data : result.error.flatten();
}
`;
const E = "\u001b";
const TEST_OUTPUT = [
  `${E}[32m ✓ ${E}[0mvalidate.test.ts ${E}[2m(3 tests)${E}[0m`,
  `${E}[1m Tests ${E}[0m ${E}[32m3 passed${E}[0m (3)`,
].join("\n");
const PREVIEW_HTML = `<!doctype html><body style="font-family:system-ui;padding:16px"><h3>Sign up</h3><input placeholder="email" style="padding:6px"> <button>Submit</button></body>`;

const IMAGE_HUES = [10, 70, 160, 250];
const swatch = (hue: number, n: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 80% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 75% 42%)"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="215" font-size="64" text-anchor="middle" fill="white" font-family="system-ui" font-weight="700">${n}</text></svg>`,
  )}`;

/** The starter prompts: `full.<id>` and `full.<id>Text`. */
const SUGGESTIONS = ["generateImages", "validateForm", "explainSkins", "planWeek"];

const threads = (t: T) =>
  ["1", "2"].map((n) => ({
    id: `t${n}`,
    title: t(`full.thread${n}`),
    preview: t(`full.thread${n}Text`),
    meta: t(`full.thread${n}Meta`),
  }));

function AssistantTurn({
  msg,
  first,
  onRegenerate,
  onVersion,
  onQuote,
  onOpenArtifact,
  artifactOpen,
  onRetryImage,
  onRemoveImage,
}: {
  msg: Msg;
  first: boolean;
  onRegenerate: () => void;
  onVersion: (index: number) => void;
  onQuote: (text: string) => void;
  onOpenArtifact: () => void;
  artifactOpen: boolean;
  onRetryImage: (item: ImageGridItem) => void;
  onRemoveImage: (item: ImageGridItem) => void;
}) {
  const t = usePageT();
  const phase = msg.phase ?? "done";
  const steps = msg.steps ?? 0;
  const reasoning = phase === "thinking";
  const versions = [msg.text, ...(msg.alternates ?? [])];
  const index = msg.version ?? 0;
  const shown = versions[index] ?? msg.text;
  return (
    <ChatTurn.Assistant>
      <ChatTurn.Avatar alt={t("full.assistant")} fallback="AI" show={first} />
      <ChatTurn.Body>
        {phase === "typing" ? <Typing /> : null}
        {steps > 0 ? (
          <Reasoning streaming={reasoning} defaultOpen={false}>
            <Reasoning.Trigger>
              {reasoning ? t("full.thinking") : t("full.thought")}
            </Reasoning.Trigger>
            <Reasoning.Content>
              <Reasoning.Steps>
                {STEPS.slice(0, steps).map((s, i) => (
                  <Reasoning.Step
                    key={s}
                    label={t(`full.${s}`)}
                    status={reasoning && i === steps - 1 ? "active" : "done"}
                  >
                    {t(`full.${s}Text`)}
                  </Reasoning.Step>
                ))}
              </Reasoning.Steps>
            </Reasoning.Content>
          </Reasoning>
        ) : null}
        {steps > 0 ? (
          <Plan
            title={t("full.plan")}
            defaultOpen
            items={[
              {
                id: "1",
                label: t("full.planSearch"),
                status: msg.toolDone
                  ? "done"
                  : phase === "tool"
                    ? "active"
                    : steps > 0
                      ? "active"
                      : "pending",
              },
              {
                id: "2",
                label: t("full.planWrite"),
                status: phase === "answering" ? "active" : phase === "done" ? "done" : "pending",
              },
              { id: "3", label: t("full.planTest"), status: phase === "done" ? "done" : "pending" },
            ]}
          />
        ) : null}
        {phase === "tool" || msg.toolDone ? (
          <ToolCall
            toolName="searchDocs"
            triggerPrefix={t("full.usedTool")}
            state={msg.toolDone ? "output-available" : "input-available"}
            input={{ query: "form validation" }}
            output={msg.toolDone ? { matches: 3 } : undefined}
          />
        ) : null}
        {shown ? (
          <ChatTurn.Content>
            <QuoteSelection onQuote={onQuote}>
              <Markdown citations={sources(t)} streaming={phase === "answering"}>
                {shown}
              </Markdown>
            </QuoteSelection>
          </ChatTurn.Content>
        ) : null}
        {msg.images ? (
          <div style={{ maxWidth: 360 }}>
            <ImageGrid
              aria-label={t("full.images")}
              items={msg.images}
              onRetry={onRetryImage}
              onRemove={phase === "done" ? onRemoveImage : undefined}
            />
          </div>
        ) : null}
        {phase === "done" && !msg.images ? (
          <>
            <Terminal
              title="pnpm test"
              command="pnpm test"
              status="done"
              exitCode={0}
              output={TEST_OUTPUT}
              maxLines={6}
            />
            <ArtifactCard
              title="validate.ts"
              meta={t("full.artifactMeta")}
              selected={artifactOpen}
              onOpen={onOpenArtifact}
            />
            <Citations label={t("full.sources")}>
              <Citation
                href="https://base-ui.com"
                title="Base UI"
                description={t("full.baseUiShort")}
              />
              <Citation sourceType="document" title="validation-notes.md" />
            </Citations>
            <ChatTurn.Actions>
              <ChatTurn.Pager index={index} count={versions.length} onIndexChange={onVersion} />
              <ChatTurn.Action aria-label={t("full.regenerate")} onClick={onRegenerate}>
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
              </ChatTurn.Action>
              <ChatTurn.Action
                aria-label={t("full.copy")}
                onClick={() => navigator.clipboard?.writeText(shown)}
              >
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
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </ChatTurn.Action>
            </ChatTurn.Actions>
            <Feedback reasons={[t("full.inaccurate"), t("full.notHelpful"), t("full.tooLong")]} />
          </>
        ) : null}
        {phase === "stopped" ? <ChatTurn.Content>{t("full.stopped")}</ChatTurn.Content> : null}
      </ChatTurn.Body>
    </ChatTurn.Assistant>
  );
}

function FullChat() {
  const t = usePageT();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [files, setFiles] = useState<{ name: string; size: number }[]>([]);
  const [thread, setThread] = useState("t1");
  const [model, setModel] = useState("fast");
  const [editing, setEditing] = useState<number | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [artifact, setArtifact] = useState(false);
  const [artifactView, setArtifactView] = useState("diff");
  const [queued, setQueued] = useState<{ id: string; text: string }[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(1);

  const clear = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const streaming = messages.some((m) => m.phase && !["done", "stopped"].includes(m.phase));
  // The assistant finished replying, the first message in the queue is sent next
  useEffect(() => {
    if (!streaming && queued.length > 0 && messages.length > 0) {
      const [first, ...rest] = queued;
      setQueued(rest);
      send(first!.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);
  const patch = (id: number, p: Partial<Msg>) =>
    setMessages((all) => all.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));

  const send = (text: string, keep?: Msg[], quote?: string) => {
    const userId = nextId.current++;
    const aId = nextId.current++;
    setMessages((all) => [
      ...(keep ?? all),
      { id: userId, role: "user", text, files, sentAt: Date.now(), quote },
      { id: aId, role: "assistant", text: "", phase: "typing" },
    ]);
    setFiles([]);
    later(700, () => patch(aId, { phase: "thinking", steps: 1 }));
    later(1500, () => patch(aId, { steps: 2 }));
    later(2300, () => patch(aId, { steps: 3 }));
    later(3100, () => patch(aId, { phase: "tool" }));
    later(4100, () => {
      patch(aId, { phase: "answering", toolDone: true });
      const answer = t("full.answer");
      let n = 0;
      const tick = () => {
        n += 4;
        patch(aId, { text: answer.slice(0, n) });
        if (n < answer.length) later(30, tick);
        else patch(aId, { phase: "done" });
      };
      tick();
    });
  };
  /** Generate images: four each show their own progress and appear in turn; the third fails and succeeds after clicking retry. */
  const generate = (text: string) => {
    const userId = nextId.current++;
    const aId = nextId.current++;
    setMessages((all) => [
      ...all,
      { id: userId, role: "user", text, sentAt: Date.now() },
      { id: aId, role: "assistant", text: "", phase: "typing" },
    ]);
    later(700, () =>
      patch(aId, {
        phase: "answering",
        text: t("full.imagesText"),
        images: IMAGE_HUES.map((_, i) => ({
          id: `${aId}-${i}`,
          alt: t("full.option", { n: i + 1 }),
          status: "loading",
          progress: 0,
        })),
      }),
    );
    IMAGE_HUES.forEach((_, i) => runImage(aId, i, i === 2));
  };
  const setImage = (msgId: number, index: number, p: Partial<ImageGridItem>) =>
    setMessages((all) => {
      const next = all.map((m) =>
        m.id === msgId && m.images
          ? { ...m, images: m.images.map((it, k) => (k === index ? { ...it, ...p } : it)) }
          : m,
      );
      return next.map((m) =>
        m.id === msgId && m.images?.every((it) => it.status !== "loading")
          ? { ...m, phase: "done" as const }
          : m,
      );
    });
  const runImage = (msgId: number, index: number, fail: boolean) => {
    const base = 900 + index * 350;
    later(base - 100, () =>
      setImage(msgId, index, { status: "loading", progress: 0, error: undefined }),
    );
    [25, 60, 90].forEach((progress, k) =>
      later(base + k * 450, () => setImage(msgId, index, { progress })),
    );
    later(base + 1500, () =>
      fail
        ? setImage(msgId, index, { status: "error", error: t("full.blocked") })
        : setImage(msgId, index, {
            status: "ready",
            src: swatch(IMAGE_HUES[index]!, index + 1),
            progress: undefined,
          }),
    );
  };
  const retryImage = (item: ImageGridItem) => {
    const [msgId, index] = item.id.split("-").map(Number) as [number, number];
    patch(msgId, { phase: "answering" });
    runImage(msgId, index, false);
  };
  const removeImage = (item: ImageGridItem) => {
    const [msgId] = item.id.split("-").map(Number) as [number];
    setMessages((all) =>
      all.map((m) =>
        m.id === msgId ? { ...m, images: m.images?.filter((it) => it.id !== item.id) } : m,
      ),
    );
  };
  /** Edit a user message: keep the messages before it and send it again with the new text. */
  const resend = (id: number, text: string) => {
    clear();
    const at = messages.findIndex((m) => m.id === id);
    setEditing(null);
    send(text, messages.slice(0, Math.max(at, 0)));
  };
  const regenerate = (id: number) =>
    setMessages((all) =>
      all.map((m) => {
        if (m.id !== id) return m;
        const alternates = [...(m.alternates ?? [])];
        alternates.push(t(ALTERNATES[alternates.length % ALTERNATES.length]!));
        return { ...m, alternates, version: alternates.length };
      }),
    );
  const stop = () => {
    clear();
    setMessages((all) =>
      all.map((m) =>
        m.phase && !["done", "stopped"].includes(m.phase)
          ? {
              ...m,
              phase: "stopped",
              images: m.images?.map((it) =>
                it.status === "loading"
                  ? { ...it, status: "error", error: t("full.stoppedImage") }
                  : it,
              ),
            }
          : m,
      ),
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: artifact
          ? "minmax(0, 1fr) minmax(0, 26rem)"
          : "minmax(0, 14rem) minmax(0, 1fr)",
        height: 560,
        width: "100%",
        border: "1px solid var(--ui-border)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--ui-bg)",
      }}
    >
      {artifact ? null : (
        <div
          style={{ borderInlineEnd: "1px solid var(--ui-border)", padding: 8, overflow: "auto" }}
        >
          <ThreadList items={threads(t)} value={thread} onValueChange={setThread} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ChatThread aria-label={t("full.chat")}>
            <ChatThread.Content>
              {messages.length === 0 ? (
                <Suggestions
                  title={t("full.suggestionsTitle")}
                  description={t("full.suggestionsText")}
                  items={SUGGESTIONS.map((id) => ({
                    id,
                    title: t(`full.${id}`),
                    description: t(`full.${id}Text`),
                  }))}
                  onSelect={(item) =>
                    item.id === "generateImages"
                      ? generate(item.title)
                      : send(item.prompt ?? item.title)
                  }
                />
              ) : null}
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <ChatTurn.User key={m.id}>
                    {m.files?.length ? (
                      <AttachmentGroup>
                        {m.files.map((f) => (
                          <Attachment key={f.name} {...f} />
                        ))}
                      </AttachmentGroup>
                    ) : null}
                    {m.quote ? <Quote source={t("full.assistant")}>{m.quote}</Quote> : null}
                    {editing === m.id ? (
                      <ChatTurn.Edit
                        defaultValue={m.text}
                        onSave={(v) => resend(m.id, v)}
                        onCancel={() => setEditing(null)}
                      />
                    ) : (
                      <>
                        <ChatTurn.Bubble>
                          <ChatTurn.Content>{m.text}</ChatTurn.Content>
                        </ChatTurn.Bubble>
                        <ChatTurn.Actions>
                          {m.sentAt ? <ChatTurn.Time value={m.sentAt} /> : null}
                          <ChatTurn.Action
                            aria-label={t("full.edit")}
                            onClick={() => setEditing(m.id)}
                            disabled={streaming}
                          >
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
                              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                            </svg>
                          </ChatTurn.Action>
                        </ChatTurn.Actions>
                      </>
                    )}
                  </ChatTurn.User>
                ) : (
                  <AssistantTurn
                    key={m.id}
                    msg={m}
                    first={messages[i - 1]?.role !== "assistant"}
                    onRegenerate={() => regenerate(m.id)}
                    artifactOpen={artifact}
                    onQuote={setQuote}
                    onOpenArtifact={() => setArtifact((v) => !v)}
                    onRetryImage={retryImage}
                    onRemoveImage={removeImage}
                    onVersion={(version) =>
                      setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, version } : x)))
                    }
                  />
                ),
              )}
            </ChatThread.Content>
            <ChatThread.ScrollButton />
          </ChatThread>
        </div>
        <div style={{ padding: "0 16px 12px" }}>
          {queued.length ? (
            <div style={{ marginBottom: 8 }}>
              <Queue items={queued} onChange={setQueued} />
            </div>
          ) : null}
          <Composer
            status={streaming ? "streaming" : "idle"}
            onSubmit={(text) => {
              send(text, undefined, quote ?? undefined);
              setQuote(null);
            }}
            onStop={stop}
          >
            <Composer.Shell>
              {quote ? (
                <Composer.Attachments>
                  <Quote source={t("full.replyingTo")} onRemove={() => setQuote(null)}>
                    {quote}
                  </Quote>
                </Composer.Attachments>
              ) : null}
              {files.length ? (
                <Composer.Attachments>
                  <AttachmentGroup aria-label={t("full.filesToSend")}>
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
              <Composer.TextArea
                placeholder={t("full.placeholder")}
                triggers={{
                  "@": ["ada", "grace", "linus"],
                  "/": [
                    { value: "summarize", label: t("full.summarize") },
                    { value: "translate", label: t("full.translate") },
                  ],
                }}
              />
              <Composer.Toolbar>
                <Composer.ToolbarStart>
                  <Composer.Action
                    aria-label={t("full.attach")}
                    onClick={() =>
                      setFiles((all) => [
                        ...all,
                        { name: `notes-${all.length + 1}.md`, size: 2400 },
                      ])
                    }
                  >
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
                  </Composer.Action>
                  <ModelPicker models={models(t)} value={model} onValueChange={setModel} />
                  {streaming ? (
                    <Composer.Action
                      aria-label={t("full.queueLabel")}
                      onClick={() =>
                        setQueued((all) => [
                          ...all,
                          {
                            id: String(nextId.current++),
                            text: t("full.followUp", { n: all.length + 1 }),
                          },
                        ])
                      }
                    >
                      {t("full.queue")}
                    </Composer.Action>
                  ) : null}
                </Composer.ToolbarStart>
                <Composer.ToolbarEnd>
                  <ContextMeter
                    used={messages.length * 3200 + files.length * 1500}
                    max={32000}
                    segments={[
                      { id: "messages", label: t("full.messages"), tokens: messages.length * 3200 },
                      { id: "files", label: t("full.files"), tokens: files.length * 1500 },
                    ]}
                  />
                  <Composer.Send />
                </Composer.ToolbarEnd>
              </Composer.Toolbar>
            </Composer.Shell>
            <Composer.Footer>{t("full.footer")}</Composer.Footer>
          </Composer>
        </div>
      </div>
      {artifact ? (
        <div
          style={{ borderInlineStart: "1px solid var(--ui-border)", minHeight: 0, display: "flex" }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Artifact>
              <Artifact.Header>
                <Artifact.Title>validate.ts</Artifact.Title>
                <Artifact.Views
                  value={artifactView}
                  onValueChange={setArtifactView}
                  options={[
                    { value: "diff", label: t("full.diff") },
                    { value: "preview", label: t("full.preview") },
                  ]}
                />
                <Artifact.Actions>
                  <Artifact.Close onClick={() => setArtifact(false)} />
                </Artifact.Actions>
              </Artifact.Header>
              <Artifact.Body aria-label={t("full.artifactContent", { name: "validate.ts" })}>
                {artifactView === "diff" ? (
                  <div style={{ padding: 12 }}>
                    <DiffView
                      fileName="validate.ts"
                      language="ts"
                      oldText={OLD_CODE}
                      newText={NEW_CODE}
                    />
                  </div>
                ) : (
                  <div style={{ padding: 12 }}>
                    <WebPreview html={PREVIEW_HTML} title={t("full.formPreview")} height={240} />
                  </div>
                )}
              </Artifact.Body>
            </Artifact>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AiChatPage() {
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">AI Chat</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="full"
        code={`<ThreadList … />
<ChatThread>
  <ChatThread.Content>
    <Suggestions … />
    <ChatTurn.User>…</ChatTurn.User>
    <ChatTurn.Assistant>
      <ChatTurn.Avatar … />
      <ChatTurn.Body>
        <Reasoning>…</Reasoning>
        <ToolCall … />
        <ChatTurn.Content><Markdown>{text}</Markdown></ChatTurn.Content>
        <Citations>…</Citations>
        <ChatTurn.Actions>…</ChatTurn.Actions>
      </ChatTurn.Body>
    </ChatTurn.Assistant>
  </ChatThread.Content>
  <ChatThread.ScrollButton />
</ChatThread>
<Composer status={streaming ? "streaming" : "idle"} onSubmit={send} onStop={stop}>…</Composer>`}
      >
        <FullChat />
      </Example>
    </article>
  );
}
