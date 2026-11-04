import { Button, Tour } from "@skeinui/ui";
import type { TourStep } from "@skeinui/ui";
import { useRef, useState } from "react";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "tour", type: "slot" },
  { key: "mask", name: "tour-mask / tour-spotlight", type: "slot" },
  { key: "center", name: "tour-center", type: "slot" },
  { key: "card", name: "tour-card", type: "slot" },
  { key: "parts", name: "tour-close / tour-cover / tour-title / tour-description", type: "slot" },
  {
    key: "footer",
    name: "tour-footer / tour-indicators / tour-indicator / tour-actions",
    type: "slot",
  },
];

function Targets({
  refs,
}: {
  refs: [
    React.RefObject<HTMLButtonElement | null>,
    React.RefObject<HTMLButtonElement | null>,
    React.RefObject<HTMLButtonElement | null>,
  ];
}) {
  return (
    <div className="pg-row">
      <Button ref={refs[0]} variant="outline">
        Upload
      </Button>
      <Button ref={refs[1]} color="primary">
        Save
      </Button>
      <Button ref={refs[2]} variant="ghost">
        More
      </Button>
    </div>
  );
}

function useSteps() {
  const refs: [
    React.RefObject<HTMLButtonElement | null>,
    React.RefObject<HTMLButtonElement | null>,
    React.RefObject<HTMLButtonElement | null>,
  ] = [useRef(null), useRef(null), useRef(null)];
  const steps: TourStep[] = [
    {
      target: refs[0],
      title: "Upload files",
      description: "Click here to add files to the project.",
    },
    {
      target: refs[1],
      title: "Save",
      description: "Your changes are saved when you press this.",
      side: "top",
    },
    {
      target: refs[2],
      title: "More actions",
      description: "Everything else lives behind this button.",
    },
  ];
  return { refs, steps };
}

function UsageDemo() {
  const { refs, steps } = useSteps();
  const [open, setOpen] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <Button onClick={() => setOpen(true)}>Begin tour</Button>
      <Targets refs={refs} />
      <Tour steps={steps} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function IntroDemo() {
  const { refs, steps } = useSteps();
  const [open, setOpen] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <Button onClick={() => setOpen(true)}>Begin tour</Button>
      <Targets refs={refs} />
      <Tour
        indicators="count"
        steps={[{ title: "Welcome", description: "A quick look around — three stops." }, ...steps]}
        open={open}
        onOpenChange={setOpen}
        labels={{ next: "Next step", finish: "Got it" }}
      />
    </div>
  );
}

function NoMaskDemo() {
  const { refs, steps } = useSteps();
  const [open, setOpen] = useState(false);
  return (
    <div className="pg-stack pg-stack--start">
      <Button onClick={() => setOpen(true)}>Begin tour</Button>
      <Targets refs={refs} />
      <Tour mask={false} steps={steps} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function ControlledDemo() {
  const { refs, steps } = useSteps();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  return (
    <div className="pg-stack pg-stack--start">
      <Button
        onClick={() => {
          setCurrent(0);
          setOpen(true);
        }}
      >
        Begin tour
      </Button>
      <Targets refs={refs} />
      <p className="pg-desc">
        Step: <code>{current}</code>
      </p>
      <Tour
        steps={steps}
        open={open}
        onOpenChange={setOpen}
        current={current}
        onCurrentChange={setCurrent}
      />
    </div>
  );
}

export default function TourPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Tour</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Tour } from "@skeinui/ui";

const upload = useRef(null);
<Button ref={upload}>Upload</Button>
<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[{ target: upload, title: "Upload files", description: "Click here to add files." }]}
/>`}
      >
        <UsageDemo />
      </Example>

      <Example
        id="intro"
        code={`<Tour
  indicators="count"
  steps={[{ title: "Welcome", description: "…" }, ...steps]} // a step without a target is centered
  labels={{ next: "Next step", finish: "Got it" }}
/>`}
      >
        <IntroDemo />
      </Example>

      <Example id="no-mask" code={`<Tour mask={false} steps={steps} />`}>
        <NoMaskDemo />
      </Example>

      <Example
        id="controlled"
        code={`<Tour current={current} onCurrentChange={setCurrent} steps={steps} open={open} onOpenChange={setOpen} />`}
      >
        <ControlledDemo />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Tour" />
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
