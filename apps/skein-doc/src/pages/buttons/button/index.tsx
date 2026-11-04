import { BUTTON_VARIANTS, Button, COLORS, RADII, type ButtonProps } from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { HERO_VARIANTS } from "@/doc/hero-variants.ts";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import {
  ArrowIcon,
  EllipsisIcon,
  GearIcon,
  GithubIcon,
  GlobeIcon,
  GoogleIcon,
  MailIcon,
  MicrosoftIcon,
  PaperclipIcon,
  PlusIcon,
  TrashIcon,
} from "@/doc/icons.tsx";

const propsCode = (p: Pick<ButtonProps, "variant" | "color">) =>
  `variant="${p.variant}" color="${p.color}"`;

const variantsCode = `import { Button } from "@skeinui/ui";

export function Variants() {
  return (
    <div className="flex flex-wrap gap-3">
${HERO_VARIANTS.map((v) => `      <Button ${propsCode(v.props)}>${v.label}</Button>`).join("\n")}
    </div>
  );
}`;

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slot", name: "data-slot", type: "button | button-start | button-end | button-spinner" },
  { key: "variants", name: "data-variant / data-color / data-size / data-radius" },
  {
    key: "states",
    name: "data-loading / data-icon-only / data-full-width",
    type: "boolean attribute",
  },
  { key: "disabled", name: "data-disabled", type: "boolean attribute" },
];

export default function ButtonPage() {
  const t = usePageT();
  const [pending, setPending] = useState(false);
  const [clicks, setClicks] = useState({ normal: 0, disabled: 0, loading: 0 });
  const bump = (key: keyof typeof clicks) => setClicks((c) => ({ ...c, [key]: c[key] + 1 }));

  const upload = () => {
    setPending(true);
    setTimeout(() => setPending(false), 2000);
  };

  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Button</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Button } from "@skeinui/ui";

export function Basic() {
  return <Button onClick={() => console.log("Button pressed")}>Click me</Button>;
}`}
      >
        <Button onClick={() => console.log("Button pressed")}>Click me</Button>
      </Example>

      <DocHeading id="examples" />

      <Example id="variants" code={variantsCode}>
        <div className="pg-flex">
          {HERO_VARIANTS.map((v) => (
            <Button key={v.label} {...v.props}>
              {v.label}
            </Button>
          ))}
        </div>
      </Example>

      <Example
        id="sizes"
        code={`<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`}
      >
        <div className="pg-flex pg-flex--center">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Example>

      <Example
        id="with-icons"
        code={`<Button startContent={<GlobeIcon />}>Search</Button>
<Button variant="soft" color="secondary" startContent={<PlusIcon />}>Add Member</Button>
<Button variant="soft" color="neutral" startContent={<MailIcon />}>Email</Button>
<Button color="danger" startContent={<TrashIcon />}>Delete</Button>
<Button variant="outline" color="neutral" endContent={<ArrowIcon />}>Continue</Button>`}
      >
        <div className="pg-flex">
          <Button startContent={<GlobeIcon />}>Search</Button>
          <Button variant="soft" color="secondary" startContent={<PlusIcon />}>
            Add Member
          </Button>
          <Button variant="soft" color="neutral" startContent={<MailIcon />}>
            Email
          </Button>
          <Button color="danger" startContent={<TrashIcon />}>
            Delete
          </Button>
          <Button variant="outline" color="neutral" endContent={<ArrowIcon />}>
            Continue
          </Button>
        </div>
      </Example>

      <Example
        id="icon-only"
        code={`<Button iconOnly aria-label="More options" variant="soft" color="neutral"><EllipsisIcon /></Button>
<Button iconOnly aria-label="Settings" variant="soft" color="secondary"><GearIcon /></Button>
<Button iconOnly aria-label="Delete" color="danger"><TrashIcon /></Button>`}
      >
        <div className="pg-flex">
          <Button iconOnly aria-label="More options" variant="soft" color="neutral">
            <EllipsisIcon />
          </Button>
          <Button iconOnly aria-label="Settings" variant="soft" color="secondary">
            <GearIcon />
          </Button>
          <Button iconOnly aria-label="Delete" color="danger">
            <TrashIcon />
          </Button>
        </div>
      </Example>

      <Example id="loading" code={`<Button loading>Uploading...</Button>`}>
        <Button loading>Uploading...</Button>
      </Example>

      <Example
        id="loading-state"
        code={`const [pending, setPending] = useState(false);

const upload = () => {
  setPending(true);
  setTimeout(() => setPending(false), 2000);
};

<Button loading={pending} onClick={upload} startContent={<PaperclipIcon />}>
  {pending ? "Uploading..." : "Upload File"}
</Button>`}
      >
        <Button loading={pending} onClick={upload} startContent={<PaperclipIcon />}>
          {pending ? "Uploading..." : "Upload File"}
        </Button>
      </Example>

      <Example
        id="full-width"
        code={`<div className="w-[400px] space-y-3">
  <Button fullWidth>Primary Button</Button>
  <Button fullWidth startContent={<PlusIcon />}>With Icon</Button>
</div>`}
      >
        <div className="pg-stack" style={{ width: "min(400px, 100%)" }}>
          <Button fullWidth>Primary Button</Button>
          <Button fullWidth startContent={<PlusIcon />}>
            With Icon
          </Button>
        </div>
      </Example>

      <Example
        id="disabled-state"
        code={`<Button disabled>Primary</Button>
<Button disabled variant="soft" color="secondary">Secondary</Button>
<Button disabled variant="soft" color="neutral">Tertiary</Button>
<Button disabled variant="outline" color="neutral">Outline</Button>
<Button disabled variant="ghost" color="neutral">Ghost</Button>
<Button disabled color="danger">Danger</Button>`}
      >
        <div className="pg-flex">
          {HERO_VARIANTS.slice(0, 6).map((v) => (
            <Button key={v.label} disabled {...v.props}>
              {v.label}
            </Button>
          ))}
        </div>
      </Example>

      <Example
        id="social-buttons"
        code={`<div className="flex w-full max-w-xs flex-col gap-3">
  <Button fullWidth variant="soft" color="neutral" startContent={<GoogleIcon />}>Sign in with Google</Button>
  <Button fullWidth variant="soft" color="neutral" startContent={<GithubIcon />}>Sign in with GitHub</Button>
  <Button fullWidth variant="soft" color="neutral" startContent={<MicrosoftIcon />}>Sign in with Microsoft</Button>
</div>`}
      >
        <div className="pg-stack" style={{ width: "min(20rem, 100%)" }}>
          <Button fullWidth variant="soft" color="neutral" startContent={<GoogleIcon />}>
            Sign in with Google
          </Button>
          <Button fullWidth variant="soft" color="neutral" startContent={<GithubIcon />}>
            Sign in with GitHub
          </Button>
          <Button fullWidth variant="soft" color="neutral" startContent={<MicrosoftIcon />}>
            Sign in with Microsoft
          </Button>
        </div>
      </Example>

      <Example
        id="render-function"
        code={`<Button nativeButton={false} render={<a href="https://base-ui.com" target="_blank" rel="noreferrer" />}>
  Open Base UI docs
</Button>`}
      >
        <Button
          nativeButton={false}
          variant="outline"
          color="neutral"
          endContent={<ArrowIcon />}
          render={<a href="https://base-ui.com" target="_blank" rel="noreferrer" />}
        >
          Open Base UI docs
        </Button>
      </Example>

      <DocHeading id="beyond" />

      <Example
        id="colors"
        code={`{BUTTON_VARIANTS.map((variant) =>
  COLORS.map((color) => <Button variant={variant} color={color}>{color}</Button>),
)}`}
      >
        <div className="pg-matrix">
          {BUTTON_VARIANTS.map((variant) => (
            <div key={variant} className="pg-row">
              <span className="pg-row-label">{variant}</span>
              {COLORS.map((color) => (
                <Button key={color} variant={variant} color={color}>
                  {color}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </Example>

      <Example
        id="radius"
        code={`{RADII.map((radius) => <Button radius={radius}>{radius}</Button>)}`}
      >
        <div className="pg-flex">
          {RADII.map((radius) => (
            <Button key={radius} radius={radius}>
              {radius}
            </Button>
          ))}
        </div>
      </Example>

      <Example
        id="behaviour"
        code={`<Button onClick={…}>Clickable</Button>
<Button disabled onClick={…}>disabled</Button>
<Button loading onClick={…}>loading</Button>`}
      >
        <div className="pg-flex">
          <Button onClick={() => bump("normal")}>
            {t("behaviour.clickable", { n: clicks.normal })}
          </Button>
          <Button disabled onClick={() => bump("disabled")}>
            disabled {clicks.disabled}
          </Button>
          <Button loading onClick={() => bump("loading")}>
            loading {clicks.loading}
          </Button>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Button" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type ?? t("styling.sameAsProps"),
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
