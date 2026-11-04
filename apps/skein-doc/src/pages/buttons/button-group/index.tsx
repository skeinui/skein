import { BUTTON_VARIANTS, Button, ButtonGroup, COLORS, RADII } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { HERO_VARIANTS } from "@/doc/hero-variants.ts";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeIcon,
  PlusIcon,
  TrashIcon,
} from "@/doc/icons.tsx";

const Sep = ButtonGroup.Separator;

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "slot", name: "data-slot", type: "button-group | button-group-separator" },
  { key: "orientation", name: "data-orientation", type: "horizontal | vertical" },
  { key: "variants", name: "data-variant / data-color / data-size / data-radius" },
  { key: "states", name: "data-full-width / data-disabled", type: "boolean attribute" },
  { key: "position", name: ":first-child / :last-child", typeKey: "pseudoClass" },
];

/** A "label + group" demo row, consistent with how the docs write it */
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pg-labeled">
      <p className="pg-labeled-label">{label}</p>
      {children}
    </div>
  );
}

const threeButtons = (
  <>
    <Button>First</Button>
    <Button>
      <Sep />
      Second
    </Button>
    <Button>
      <Sep />
      Third
    </Button>
  </>
);

export default function ButtonGroupPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Button Group</h1>
      <Lead />

      <Example
        id="usage"
        code={`import { Button, ButtonGroup } from "@skeinui/ui";

<ButtonGroup variant="soft" color="neutral">
  <Button startContent={<ChevronLeftIcon />}>Previous</Button>
  <Button endContent={<ChevronRightIcon />}>Next</Button>
</ButtonGroup>

<ButtonGroup>
  <Button>Merge pull request</Button>
  <Button iconOnly aria-label="More options">
    <ButtonGroup.Separator />
    <ChevronDownIcon />
  </Button>
</ButtonGroup>`}
      >
        <div className="pg-stack pg-stack--start">
          <ButtonGroup>
            <Button>Merge pull request</Button>
            <Button iconOnly aria-label="More options">
              <Sep />
              <ChevronDownIcon />
            </Button>
          </ButtonGroup>
          <ButtonGroup variant="soft" color="neutral">
            <Button startContent={<ChevronLeftIcon />}>Previous</Button>
            <Button endContent={<ChevronRightIcon />}>Next</Button>
          </ButtonGroup>
          <ButtonGroup variant="soft" color="neutral">
            <Button iconOnly aria-label="Align left">
              <AlignLeftIcon />
            </Button>
            <Button iconOnly aria-label="Align center">
              <AlignCenterIcon />
            </Button>
            <Button iconOnly aria-label="Align right">
              <AlignRightIcon />
            </Button>
            <Button iconOnly aria-label="Justify">
              <AlignJustifyIcon />
            </Button>
          </ButtonGroup>
        </div>
      </Example>

      <Example
        id="anatomy"
        code={`<ButtonGroup>
  <Button>First</Button>
  <Button>
    <ButtonGroup.Separator />
    Second
  </Button>
  <Button>
    <ButtonGroup.Separator />
    Third
  </Button>
</ButtonGroup>`}
      >
        <ButtonGroup>{threeButtons}</ButtonGroup>
      </Example>

      <DocHeading id="examples" />

      <Example
        id="variants"
        code={`${HERO_VARIANTS.slice(0, 6)
          .map(
            (v) =>
              `<ButtonGroup variant="${v.props.variant}" color="${v.props.color}">…</ButtonGroup> // ${v.label}`,
          )
          .join("\n")}`}
      >
        <div className="pg-stack pg-stack--start">
          {HERO_VARIANTS.slice(0, 6).map((v) => (
            <Labeled key={v.label} label={v.label}>
              <ButtonGroup {...v.props}>{threeButtons}</ButtonGroup>
            </Labeled>
          ))}
        </div>
      </Example>

      <Example
        id="sizes"
        code={`<ButtonGroup size="sm" variant="soft" color="secondary">…</ButtonGroup>
<ButtonGroup size="md" variant="soft" color="secondary">…</ButtonGroup>
<ButtonGroup size="lg" variant="soft" color="secondary">…</ButtonGroup>`}
      >
        <div className="pg-stack pg-stack--start">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Labeled key={size} label={t(`sizes.${size}`)}>
              <ButtonGroup size={size} variant="soft" color="secondary">
                {threeButtons}
              </ButtonGroup>
            </Labeled>
          ))}
        </div>
      </Example>

      <Example
        id="orientation"
        code={`<ButtonGroup orientation="horizontal" variant="soft" color="neutral">…</ButtonGroup>
<ButtonGroup orientation="vertical" variant="soft" color="neutral">…</ButtonGroup>`}
      >
        <div className="pg-flex pg-flex--start pg-flex--loose">
          {(["horizontal", "vertical"] as const).map((orientation) => (
            <Labeled key={orientation} label={t(`orientation.${orientation}`)}>
              <ButtonGroup orientation={orientation} variant="soft" color="neutral">
                <Button iconOnly aria-label="Align left">
                  <AlignLeftIcon />
                </Button>
                <Button iconOnly aria-label="Align center">
                  <Sep />
                  <AlignCenterIcon />
                </Button>
                <Button iconOnly aria-label="Align right">
                  <Sep />
                  <AlignRightIcon />
                </Button>
                <Button iconOnly aria-label="Justify">
                  <Sep />
                  <AlignJustifyIcon />
                </Button>
              </ButtonGroup>
            </Labeled>
          ))}
        </div>
      </Example>

      <Example
        id="with-icons"
        code={`<ButtonGroup variant="soft" color="secondary">
  <Button startContent={<GlobeIcon />}>Search</Button>
  <Button startContent={<PlusIcon />}><ButtonGroup.Separator />Add</Button>
  <Button startContent={<TrashIcon />}><ButtonGroup.Separator />Delete</Button>
</ButtonGroup>

<ButtonGroup variant="soft" color="neutral">
  <Button iconOnly aria-label="Search"><GlobeIcon /></Button>
  …
</ButtonGroup>`}
      >
        <div className="pg-stack pg-stack--start">
          <Labeled label={t("with-icons.withIcons")}>
            <ButtonGroup variant="soft" color="secondary">
              <Button startContent={<GlobeIcon />}>Search</Button>
              <Button startContent={<PlusIcon />}>
                <Sep />
                Add
              </Button>
              <Button startContent={<TrashIcon />}>
                <Sep />
                Delete
              </Button>
            </ButtonGroup>
          </Labeled>
          <Labeled label={t("with-icons.iconOnly")}>
            <ButtonGroup variant="soft" color="neutral">
              <Button iconOnly aria-label="Search">
                <GlobeIcon />
              </Button>
              <Button iconOnly aria-label="Add">
                <Sep />
                <PlusIcon />
              </Button>
              <Button iconOnly aria-label="Delete">
                <Sep />
                <TrashIcon />
              </Button>
            </ButtonGroup>
          </Labeled>
        </div>
      </Example>

      <Example
        id="full-width"
        code={`<div className="w-[400px] space-y-3">
  <ButtonGroup fullWidth>…</ButtonGroup>
  <ButtonGroup fullWidth>…</ButtonGroup>
</div>`}
      >
        <div className="pg-stack" style={{ width: "min(400px, 100%)" }}>
          <ButtonGroup fullWidth>{threeButtons}</ButtonGroup>
          <ButtonGroup fullWidth variant="soft" color="neutral">
            <Button iconOnly aria-label="Align left">
              <AlignLeftIcon />
            </Button>
            <Button iconOnly aria-label="Align center">
              <AlignCenterIcon />
            </Button>
            <Button iconOnly aria-label="Align right">
              <AlignRightIcon />
            </Button>
          </ButtonGroup>
        </div>
      </Example>

      <Example
        id="disabled-state"
        code={`<ButtonGroup disabled>…</ButtonGroup>

<ButtonGroup disabled>
  <Button>First</Button>
  <Button>Second</Button>
  <Button disabled={false}>Third (enabled)</Button>
</ButtonGroup>`}
      >
        <div className="pg-stack pg-stack--start">
          <Labeled label={t("disabled-state.all")}>
            <ButtonGroup disabled>{threeButtons}</ButtonGroup>
          </Labeled>
          <Labeled label={t("disabled-state.override")}>
            <ButtonGroup disabled>
              <Button>First</Button>
              <Button>
                <Sep />
                Second
              </Button>
              <Button disabled={false}>
                <Sep />
                Third (enabled)
              </Button>
            </ButtonGroup>
          </Labeled>
        </div>
      </Example>

      <Example
        id="without-separator"
        code={`<ButtonGroup>
  <Button>First</Button>
  <Button>Second</Button>
  <Button>Third</Button>
</ButtonGroup>`}
      >
        <ButtonGroup>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </ButtonGroup>
      </Example>

      <DocHeading id="beyond" />

      <Example
        id="colors"
        code={`{BUTTON_VARIANTS.map((variant) =>
  COLORS.map((color) => <ButtonGroup variant={variant} color={color}>…</ButtonGroup>),
)}`}
      >
        <div className="pg-matrix">
          {BUTTON_VARIANTS.map((variant) => (
            <div key={variant} className="pg-row">
              <span className="pg-row-label">{variant}</span>
              {COLORS.map((color) => (
                <ButtonGroup key={color} variant={variant} color={color} size="sm">
                  <Button>One</Button>
                  <Button>
                    <Sep />
                    Two
                  </Button>
                </ButtonGroup>
              ))}
            </div>
          ))}
        </div>
      </Example>

      <Example
        id="radius"
        code={`{RADII.map((radius) => <ButtonGroup radius={radius}>…</ButtonGroup>)}`}
      >
        <div className="pg-matrix">
          {RADII.map((radius) => (
            <div key={radius} className="pg-row">
              <span className="pg-row-label">{radius}</span>
              <ButtonGroup radius={radius}>{threeButtons}</ButtonGroup>
              <ButtonGroup radius={radius} variant="soft" color="neutral">
                {threeButtons}
              </ButtonGroup>
            </div>
          ))}
        </div>
      </Example>

      <Example
        id="overrides"
        code={`<ButtonGroup variant="solid">
  <Button>Mixed</Button>
  <Button variant="outline" color="danger">override</Button>
  <Button loading>loading</Button>
</ButtonGroup>`}
      >
        <ButtonGroup variant="solid">
          <Button>Mixed</Button>
          <Button variant="outline" color="danger">
            override
          </Button>
          <Button loading>loading</Button>
        </ButtonGroup>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <h4>ButtonGroup</h4>
        <ApiReference component="ButtonGroup" />
        <h4>ButtonGroup.Separator</h4>
        <p className="pg-desc">{t.rich("api.separator")}</p>
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type ?? t(`styling.${h.typeKey ?? "sameAsProps"}`),
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
