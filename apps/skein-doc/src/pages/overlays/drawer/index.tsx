import {
  Button,
  DRAWER_SIDES,
  DRAWER_SIZES,
  Drawer,
  type DrawerSide,
  type DrawerSize,
} from "@skeinui/ui";
import { useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "dialog", name: "dialog-backdrop / dialog-close", type: "slot" },
  { key: "drawer", name: "drawer-viewport / drawer / drawer-content", type: "slot" },
  { key: "states", name: "data-starting-style / data-ending-style / data-swiping", type: "state" },
];

function Demo({
  side,
  size,
  label = "Open drawer",
  long = false,
}: {
  side?: DrawerSide;
  size?: DrawerSize;
  label?: string;
  long?: boolean;
}) {
  return (
    <Drawer side={side}>
      <Drawer.Trigger render={<Button variant="outline" />}>{label}</Drawer.Trigger>
      <Drawer.Content size={size}>
        <Drawer.Title>Settings</Drawer.Title>
        <Drawer.Description>Manage your preferences.</Drawer.Description>
        <Drawer.Body>
          {Array.from({ length: long ? 24 : 2 }, (_, i) => (
            <p key={i} style={{ margin: "0 0 12px" }}>
              Paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          ))}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close render={<Button variant="ghost" />}>Cancel</Drawer.Close>
          <Drawer.Close render={<Button />}>Save</Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

function ControlledDemo() {
  const t = usePageT();
  const [open, setOpen] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open
      </Button>
      <p className="pg-desc">
        open: <code>{String(open)}</code>
      </p>
      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Title>Controlled</Drawer.Title>
          <Drawer.Body>{t("controlled.body")}</Drawer.Body>
          <Drawer.Footer>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </div>
  );
}

export default function DrawerPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Drawer</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Button, Drawer } from "@skeinui/ui";

<Drawer>
  <Drawer.Trigger render={<Button variant="outline" />}>Open drawer</Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Title>Settings</Drawer.Title>
    <Drawer.Body>…</Drawer.Body>
    <Drawer.Footer>…</Drawer.Footer>
  </Drawer.Content>
</Drawer>`}
      >
        <Demo />
      </Example>

      <Example id="sides" code={`<Drawer side="left">…</Drawer>`}>
        <div className="pg-flex pg-flex--loose">
          {DRAWER_SIDES.map((s) => (
            <Demo key={s} side={s} label={s} />
          ))}
        </div>
      </Example>

      <Example id="sizes" code={`<Drawer.Content size="lg">…</Drawer.Content>`}>
        <div className="pg-flex pg-flex--loose">
          {DRAWER_SIZES.map((s) => (
            <Demo key={s} size={s} label={s} />
          ))}
        </div>
      </Example>

      <Example id="scroll" code={`<Drawer.Body>…long content…</Drawer.Body>`}>
        <Demo long label="Long content" />
      </Example>

      <Example id="controlled" code={`<Drawer open={open} onOpenChange={setOpen}>…</Drawer>`}>
        <ControlledDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Drawer" />
        <h4>Drawer.Trigger</h4>
        <ApiReference component="Drawer.Trigger" />
        <h4>Drawer.Content</h4>
        <ApiReference component="Drawer.Content" />
        <p className="pg-desc">{t.rich("api.parts")}</p>
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({ ...h, description: t.rich(`styling.${h.key}`) }))}
        />
      </section>
    </article>
  );
}
