import { Mentions } from "@skeinui/ui";
import type { MentionOption } from "@skeinui/ui";
import { useRef, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "mentions" },
  { key: "list", name: "mentions-list" },
  { key: "option", name: "mentions-option" },
];

const PEOPLE = [
  "Ada Lovelace",
  "Alan Turing",
  "Grace Hopper",
  "Linus Torvalds",
  "Margaret Hamilton",
];

const initial = (name: string) => (
  <>
    <span aria-hidden="true" className="pg-avatar-dot">
      {name[0]}
    </span>
    {name}
  </>
);

function AsyncDemo() {
  const t = usePageT();
  const [options, setOptions] = useState<MentionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <div className="pg-stack pg-stack--start">
      <Mentions
        aria-label="Async"
        placeholder="Type @ and a name…"
        filterOption={false}
        options={options}
        onSearch={(query) => {
          clearTimeout(timer.current);
          setLoading(true);
          timer.current = setTimeout(() => {
            setOptions(
              PEOPLE.filter((p) => p.toLowerCase().includes(query.toLowerCase())).map((p) => ({
                value: p.replace(/\s+/g, ""),
                label: p,
              })),
            );
            setLoading(false);
          }, 400);
        }}
      />
      <p className="pg-desc">{t(loading ? "async.searching" : "async.hint")}</p>
    </div>
  );
}

function SelectDemo() {
  const t = usePageT();
  const [text, setText] = useState("Hi @");
  const [last, setLast] = useState<string>("—");
  return (
    <div className="pg-stack pg-stack--start">
      <Mentions
        aria-label="Message"
        value={text}
        onValueChange={setText}
        options={PEOPLE.map((p) => p.replace(/\s+/g, ""))}
        onSelect={(option, prefix) => setLast(prefix + option.value)}
      />
      <p className="pg-desc">
        {t("controlled.last")} <code>{last}</code>
      </p>
    </div>
  );
}

export default function MentionsPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Mentions</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Mentions } from "@skeinui/ui";

<Mentions aria-label="Message" placeholder="Type @ to mention" options={["Ada", "Alan", "Grace"]} />`}
      >
        <Mentions
          aria-label="Message"
          placeholder="Type @ to mention"
          options={["Ada", "Alan", "Grace"]}
        />
      </Example>

      <Example
        id="controlled"
        code={`<Mentions
  value={text}
  onValueChange={setText}
  onSelect={(option, prefix) => setLast(prefix + option.value)}
  options={[...]}
/>`}
      >
        <SelectDemo />
      </Example>

      <Example id="prefix" code={`<Mentions prefix={["@", "#"]} options={[...]} />`}>
        <Mentions
          aria-label="Prefixes"
          prefix={["@", "#"]}
          placeholder="@ or #"
          options={["Ada", "Alan", "design", "bug"]}
        />
      </Example>

      <Example id="single" code={`<Mentions multiline={false} options={[...]} />`}>
        <Mentions
          aria-label="Single line"
          multiline={false}
          placeholder="Type @"
          options={["Ada", "Alan", "Grace"]}
        />
      </Example>

      <Example
        id="rich"
        code={`<Mentions options={[{ value: "Ada", label: <><Avatar />Ada</> }, ...]} />`}
      >
        <Mentions
          aria-label="Rich"
          placeholder="Type @"
          options={[
            ...PEOPLE.map((p) => ({ value: p.replace(/\s+/g, ""), label: initial(p) })),
            { value: "Disabled", label: "Disabled user", disabled: true },
          ]}
        />
      </Example>

      <Example
        id="async"
        code={`<Mentions
  filterOption={false}
  options={options}
  onSearch={(query) => fetchUsers(query).then(setOptions)}
/>`}
      >
        <AsyncDemo />
      </Example>

      <Example id="states" code={`<Mentions disabled />`}>
        <div className="pg-stack pg-stack--start">
          <Mentions aria-label="Disabled" disabled defaultValue="@Ada" options={["Ada"]} />
          <Mentions aria-label="Read only" readOnly defaultValue="@Ada" options={["Ada"]} />
          <Mentions aria-label="Invalid" invalid defaultValue="@" options={["Ada"]} />
          {(["sm", "lg"] as const).map((size) => (
            <Mentions
              key={size}
              size={size}
              multiline={false}
              aria-label={size}
              placeholder={size}
              options={["Ada"]}
            />
          ))}
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Mentions" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
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
