import {
  Button,
  Input,
  InputGroup,
  PasswordInput,
  SearchInput,
  TagInput,
  Textarea,
} from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { EyeIcon, EyeOffIcon, GlobeIcon, MailIcon, SearchIcon } from "@/doc/icons.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  {
    key: "slot",
    name: "data-slot",
    type: "input | textarea | input-group | input-group-input | input-group-prefix | input-group-suffix | input-group-action | input-group-tags",
  },
  { key: "variants", name: "data-variant / data-size / data-full-width" },
  {
    key: "states",
    name: "data-invalid / data-disabled / data-filled / data-focused",
    type: "boolean attribute",
  },
  { key: "pseudoClasses", name: ":focus / :hover / :read-only", pseudo: true },
];

function PasswordDemo() {
  const [show, setShow] = useState(false);
  return (
    <InputGroup>
      <InputGroup.Prefix>
        <MailIcon />
      </InputGroup.Prefix>
      <InputGroup.Input
        aria-label="Password"
        type={show ? "text" : "password"}
        defaultValue="secret-password"
      />
      <InputGroup.Suffix>
        <Button
          iconOnly
          size="sm"
          variant="ghost"
          color="neutral"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((v) => !v)}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      </InputGroup.Suffix>
    </InputGroup>
  );
}

function SearchDemo() {
  const [last, setLast] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="pg-stack">
      <SearchInput
        aria-label="Search"
        placeholder="Search…"
        loading={loading}
        onSearch={(q, source) => {
          setLast(`${source}: "${q}"`);
          setLoading(true);
          setTimeout(() => setLoading(false), 800);
        }}
      />
      <p className="pg-desc">onSearch → {last || "—"}</p>
    </div>
  );
}

function ControlledDemo() {
  const t = usePageT();
  const [value, setValue] = useState("");
  return (
    <div className="pg-stack pg-stack--start">
      <Input
        aria-label="Name"
        placeholder="Type something"
        value={value}
        onValueChange={setValue}
      />
      <p className="pg-desc">
        {t("controlled.current")} <code>{value === "" ? t("controlled.empty") : value}</code>
      </p>
    </div>
  );
}

export default function InputPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Input</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Input } from "@skeinui/ui";

export function Basic() {
  return <Input aria-label="Email" placeholder="Enter your email" />;
}`}
      >
        <Input aria-label="Email" placeholder="Enter your email" />
      </Example>

      <DocHeading id="examples" />

      <Example
        id="variants"
        code={`<Input aria-label="Outline" placeholder="Outline" />
<Input aria-label="Filled" variant="filled" placeholder="Filled" />`}
      >
        <div className="pg-flex">
          <Input aria-label="Outline" placeholder="Outline" />
          <Input aria-label="Filled" variant="filled" placeholder="Filled" />
        </div>
      </Example>

      <Example
        id="sizes"
        code={`<Input size="sm" placeholder="Small" />
<Input size="md" placeholder="Medium" />
<Input size="lg" placeholder="Large" />`}
      >
        <div className="pg-flex pg-flex--center">
          <Input aria-label="Small" size="sm" placeholder="Small" />
          <Input aria-label="Medium" size="md" placeholder="Medium" />
          <Input aria-label="Large" size="lg" placeholder="Large" />
        </div>
      </Example>

      <Example
        id="types"
        code={`<Input type="email" placeholder="Email" />
<Input type="password" placeholder="Password" />
<Input type="number" placeholder="Number" />
<Input type="search" placeholder="Search" />`}
      >
        <div className="pg-flex">
          <Input aria-label="Email" type="email" placeholder="Email" />
          <Input aria-label="Password" type="password" placeholder="Password" />
          <Input aria-label="Number" type="number" placeholder="Number" />
          <Input aria-label="Search" type="search" placeholder="Search" />
        </div>
      </Example>

      <Example
        id="disabled"
        code={`<Input disabled placeholder="Disabled" />
<Input disabled variant="filled" defaultValue="Disabled with value" />`}
      >
        <div className="pg-flex">
          <Input aria-label="Disabled" disabled placeholder="Disabled" />
          <Input
            aria-label="Disabled filled"
            disabled
            variant="filled"
            defaultValue="Disabled with value"
          />
        </div>
      </Example>

      <Example
        id="invalid"
        code={`<Input invalid defaultValue="not-an-email" />
<Input invalid variant="filled" defaultValue="not-an-email" />`}
      >
        <div className="pg-flex">
          <Input aria-label="Invalid" invalid defaultValue="not-an-email" />
          <Input aria-label="Invalid filled" invalid variant="filled" defaultValue="not-an-email" />
        </div>
      </Example>

      <Example id="read-only" code={`<Input readOnly defaultValue="Read only value" />`}>
        <Input aria-label="Read only" readOnly defaultValue="Read only value" />
      </Example>

      <Example
        id="full-width"
        code={`<div className="w-[400px]">
  <Input fullWidth placeholder="Full width" />
</div>`}
      >
        <div style={{ width: "min(400px, 100%)" }}>
          <Input aria-label="Full width" fullWidth placeholder="Full width" />
        </div>
      </Example>

      <Example
        id="controlled"
        code={`const [value, setValue] = useState("");

<Input value={value} onValueChange={setValue} placeholder="Type something" />`}
      >
        <ControlledDemo />
      </Example>

      <DocHeading id="textarea-heading" />

      <Example
        id="textarea"
        code={`<Textarea placeholder="Tell us about yourself" />
<Textarea variant="filled" placeholder="Filled" />`}
      >
        <div className="pg-flex">
          <Textarea aria-label="Bio" placeholder="Tell us about yourself" />
          <Textarea aria-label="Bio filled" variant="filled" placeholder="Filled" />
        </div>
      </Example>

      <Example
        id="textarea-rows"
        code={`<Textarea rows={6} placeholder="Six rows" />
<Textarea invalid defaultValue="Too short" />
<Textarea disabled placeholder="Disabled" />`}
      >
        <div className="pg-flex">
          <Textarea aria-label="Six rows" rows={6} placeholder="Six rows" />
          <Textarea aria-label="Invalid" invalid defaultValue="Too short" />
          <Textarea aria-label="Disabled" disabled placeholder="Disabled" />
        </div>
      </Example>

      <Example
        id="textarea-auto"
        code={`<Textarea autoSize />
<Textarea autoSize={{ minRows: 2, maxRows: 5 }} />`}
      >
        <div className="pg-flex">
          <Textarea aria-label="Auto size" autoSize placeholder="Grows as you type" />
          <Textarea
            aria-label="Auto size with limits"
            autoSize={{ minRows: 2, maxRows: 5 }}
            placeholder="2 to 5 rows, then scrolls"
          />
        </div>
      </Example>

      <Example
        id="textarea-count"
        code={`<Textarea showCount maxLength={100} />
<Textarea showCount autoSize />`}
      >
        <div className="pg-flex">
          <Textarea
            aria-label="Counted"
            showCount
            maxLength={100}
            placeholder="Up to 100 characters"
          />
          <Textarea
            aria-label="Counted and auto"
            showCount
            autoSize
            placeholder="Count and auto size"
          />
        </div>
      </Example>

      <DocHeading id="input-group-heading" />

      <Example
        id="input-group"
        code={`<InputGroup>
  <InputGroup.Prefix>https://</InputGroup.Prefix>
  <InputGroup.Input placeholder="example" />
  <InputGroup.Suffix>.com</InputGroup.Suffix>
</InputGroup>`}
      >
        <div className="pg-flex">
          <InputGroup>
            <InputGroup.Prefix>https://</InputGroup.Prefix>
            <InputGroup.Input aria-label="Domain" placeholder="example" />
            <InputGroup.Suffix>.com</InputGroup.Suffix>
          </InputGroup>
          <InputGroup variant="filled">
            <InputGroup.Prefix>$</InputGroup.Prefix>
            <InputGroup.Input aria-label="Amount" placeholder="0.00" />
            <InputGroup.Suffix>USD</InputGroup.Suffix>
          </InputGroup>
        </div>
      </Example>

      <Example
        id="input-group-icons"
        code={`<InputGroup>
  <InputGroup.Prefix><SearchIcon /></InputGroup.Prefix>
  <InputGroup.Input placeholder="Search…" />
</InputGroup>`}
      >
        <div className="pg-flex">
          <InputGroup>
            <InputGroup.Prefix>
              <SearchIcon />
            </InputGroup.Prefix>
            <InputGroup.Input aria-label="Search" placeholder="Search…" />
          </InputGroup>
          <InputGroup>
            <InputGroup.Prefix>
              <GlobeIcon />
            </InputGroup.Prefix>
            <InputGroup.Input aria-label="Website" placeholder="Website" />
            <InputGroup.Suffix>
              <MailIcon />
            </InputGroup.Suffix>
          </InputGroup>
        </div>
      </Example>

      <Example
        id="input-group-password"
        code={`const [show, setShow] = useState(false);

<InputGroup>
  <InputGroup.Input type={show ? "text" : "password"} />
  <InputGroup.Suffix>
    <Button iconOnly size="sm" variant="ghost" color="neutral" onClick={() => setShow((v) => !v)}>
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </Button>
  </InputGroup.Suffix>
</InputGroup>`}
      >
        <PasswordDemo />
      </Example>

      <Example
        id="input-group-states"
        code={`<InputGroup size="sm">…</InputGroup>
<InputGroup size="lg">…</InputGroup>
<InputGroup><InputGroup.Input invalid /></InputGroup>
<InputGroup><InputGroup.Input disabled /></InputGroup>`}
      >
        <div className="pg-flex pg-flex--center">
          <InputGroup size="sm">
            <InputGroup.Prefix>sm</InputGroup.Prefix>
            <InputGroup.Input aria-label="Small" placeholder="Small" />
          </InputGroup>
          <InputGroup size="lg">
            <InputGroup.Prefix>lg</InputGroup.Prefix>
            <InputGroup.Input aria-label="Large" placeholder="Large" />
          </InputGroup>
          <InputGroup>
            <InputGroup.Prefix>
              <MailIcon />
            </InputGroup.Prefix>
            <InputGroup.Input aria-label="Invalid" invalid defaultValue="bad value" />
          </InputGroup>
          <InputGroup>
            <InputGroup.Prefix>
              <MailIcon />
            </InputGroup.Prefix>
            <InputGroup.Input aria-label="Disabled" disabled placeholder="Disabled" />
          </InputGroup>
        </div>
      </Example>

      <DocHeading id="composed" />

      <Example
        id="password-input"
        code={`<PasswordInput aria-label="Password" placeholder="Password" />
<PasswordInput visibilityToggle={false} />`}
      >
        <div className="pg-flex pg-flex--center">
          <PasswordInput aria-label="Password" placeholder="Password" />
          <PasswordInput
            aria-label="Password filled"
            variant="filled"
            size="lg"
            defaultValue="secret"
          />
        </div>
      </Example>

      <Example
        id="search-input"
        code={`<SearchInput aria-label="Search" onSearch={(q, source) => …} />
<SearchInput loading />`}
      >
        <SearchDemo />
      </Example>

      <Example
        id="tag-input"
        code={`<TagInput aria-label="Keywords" defaultValue={["react"]} max={5} />`}
      >
        <div className="pg-stack">
          <TagInput
            aria-label="Keywords"
            defaultValue={["react", "ui"]}
            placeholder="Add keyword"
            max={5}
          />
          <TagInput
            aria-label="Emails"
            fullWidth
            size="lg"
            placeholder="Emails, comma separated"
            validate={(t) => /^\S+@\S+$/.test(t)}
          />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>Input</h4>
        <ApiReference component="Input" />
        <h4>Textarea</h4>
        <ApiReference component="Textarea" />
        <h4>InputGroup</h4>
        <ApiReference component="InputGroup" />
        <h4>InputGroup.Input</h4>
        <ApiReference component="InputGroup.Input" />
        <p className="pg-desc">{t.rich("api.affixes")}</p>
        <h4>PasswordInput</h4>
        <ApiReference component="PasswordInput" />
        <h4>SearchInput</h4>
        <ApiReference component="SearchInput" />
        <h4>TagInput</h4>
        <ApiReference component="TagInput" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.pseudo ? t("styling.pseudo") : (h.type ?? t("styling.sameAsProps")),
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
