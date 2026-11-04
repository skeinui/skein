import { useRef } from "react";
import { FloatButton, Text } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "button", name: "floatbutton", type: "slot" },
  { key: "group", name: "floatbutton-group", type: "slot" },
  { key: "parts", name: "floatbutton-icon / floatbutton-label", type: "slot" },
];

const Icon = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
const HELP = "M12 17h.01M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z";
const CHAT = "M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z";
const PLUS = "M12 5v14M5 12h14";

/** Fixed-position buttons are contained in the example box: the stage has a transform, so fixed inside it is relative to the stage. */
const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="pg-fb-stage">{children}</div>
);

function BackTopDemo() {
  const t = usePageT();
  const box = useRef<HTMLDivElement>(null);
  return (
    <Stage>
      <div
        ref={box}
        className="pg-fb-scroll"
        tabIndex={0}
        role="region"
        aria-label={t("back-top.area")}
      >
        {Array.from({ length: 24 }, (_, i) => (
          <p key={i}>{t("back-top.line", { n: i + 1 })}</p>
        ))}
      </div>
      <FloatButton.BackTop
        target={() => box.current}
        visibilityHeight={120}
        tooltip={t("back-top.tooltip")}
      />
    </Stage>
  );
}

export default function FloatButtonPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Float Button</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { FloatButton } from "@skeinui/ui";

<FloatButton icon={<HelpIcon />} aria-label="Help" tooltip="Help" />`}
      >
        <Stage>
          <Text tone="secondary">{t("basic.note")}</Text>
          <FloatButton
            icon={<Icon d={HELP} />}
            aria-label={t("demo.help")}
            tooltip={t("demo.help")}
          />
        </Stage>
      </Example>

      <Example
        id="shapes"
        code={`<FloatButton variant="primary" icon={…} aria-label="Add" />
<FloatButton shape="square" icon={…} aria-label="Chat" />`}
      >
        <Stage>
          <FloatButton
            corner="bottom-start"
            variant="primary"
            icon={<Icon d={PLUS} />}
            aria-label={t("demo.add")}
          />
          <FloatButton icon={<Icon d={CHAT} />} aria-label={t("demo.chat")} shape="square" />
        </Stage>
      </Example>

      <Example id="group" code={`<FloatButton.Group shape="square">…</FloatButton.Group>`}>
        <Stage>
          <FloatButton.Group corner="bottom-start">
            <FloatButton icon={<Icon d={HELP} />} aria-label={t("demo.help")} />
            <FloatButton icon={<Icon d={CHAT} />} aria-label={t("demo.chat")} />
            <FloatButton icon={<Icon d={PLUS} />} aria-label={t("demo.add")} variant="primary" />
          </FloatButton.Group>
          <FloatButton.Group shape="square" aria-label={t("group.tools")}>
            <FloatButton icon={<Icon d={HELP} />} aria-label={t("demo.help")} />
            <FloatButton icon={<Icon d={CHAT} />} aria-label={t("demo.chat")} />
            <FloatButton icon={<Icon d={PLUS} />} aria-label={t("demo.add")} />
          </FloatButton.Group>
        </Stage>
      </Example>

      <Example
        id="back-top"
        code={`<FloatButton.BackTop visibilityHeight={400} />
<FloatButton.BackTop target={() => scroller.current} />`}
      >
        <BackTopDemo />
      </Example>

      <Example
        id="corner"
        code={`<FloatButton corner="top-end" shape="square" icon={…} label="Chat" />`}
      >
        <Stage>
          <FloatButton
            corner="top-end"
            shape="square"
            icon={<Icon d={CHAT} />}
            label={t("demo.chat")}
          />
          <FloatButton corner="top-start" icon={<Icon d={HELP} />} aria-label={t("demo.help")} />
        </Stage>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="FloatButton" />
        <h4>FloatButton.Group</h4>
        <ApiReference component="FloatButton.Group" />
        <h4>FloatButton.BackTop</h4>
        <ApiReference component="FloatButton.BackTop" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
