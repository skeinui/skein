import {
  Button,
  TOAST_LAYOUTS,
  TOAST_POSITIONS,
  Toaster,
  toast,
  type ToastLayout,
  type ToastPosition,
} from "@skeinui/ui";
import { useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The `toast` functions; their descriptions are the page's `api.<key>` messages. */
const FUNCTIONS = [
  { key: "toast", name: "toast(options)", type: "(options | ReactNode) => id" },
  {
    key: "typed",
    name: "toast.info / success / warning / danger",
    type: "(title, options?) => id",
  },
  { key: "loading", name: "toast.loading(title, options?)", type: "(title, options?) => id" },
  { key: "promise", name: "toast.promise(promise, { loading, success, error })", type: "Promise" },
  { key: "update", name: "toast.update / toast.close", type: "(id, …) / (id?)" },
];

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "viewport", name: "toast-viewport", type: "slot" },
  { key: "toast", name: "toast", type: "slot" },
  { key: "icon", name: "toast-icon / toast-content", type: "slot" },
  { key: "text", name: "toast-title / toast-description", type: "slot" },
  { key: "buttons", name: "toast-action / toast-close", type: "slot" },
  { key: "rich", name: "data-rich-colors", type: "state" },
  { key: "states", name: "data-starting-style / data-ending-style / data-swiping", type: "state" },
];

function PositionDemo({
  position,
  setPosition,
}: {
  position: ToastPosition;
  setPosition: (p: ToastPosition) => void;
}) {
  const t = usePageT();
  return (
    <div className="pg-stack pg-stack--start">
      <div className="pg-flex pg-flex--loose">
        {TOAST_POSITIONS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === position ? "solid" : "outline"}
            onClick={() => {
              setPosition(p);
              toast({ title: p, description: t("position.switched") });
            }}
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function ToastPage() {
  const t = usePageT();
  const [position, setPosition] = useState<ToastPosition>("bottom-right");
  const [layout, setLayout] = useState<ToastLayout>("list");
  return (
    <article className="pg-doc">
      <Toaster position={position} layout={layout} />
      <h1 className="pg-doc-title">Toast</h1>
      <Lead />
      <Example
        id="usage"
        code={`import { Toaster, toast } from "@skeinui/ui";

// once, at the app root
<Toaster />

// call from anywhere
toast("Event created");`}
      >
        <Button variant="outline" onClick={() => toast("Event created")}>
          Show toast
        </Button>
      </Example>

      <DocHeading id="examples" />

      <Example
        id="types"
        code={`toast.info("Heads up");
toast.success("Saved");
toast.warning("Disk almost full");
toast.danger("Request failed");`}
      >
        <div className="pg-flex pg-flex--loose">
          <Button variant="outline" onClick={() => toast.info("Heads up")}>
            info
          </Button>
          <Button variant="outline" color="success" onClick={() => toast.success("Saved")}>
            success
          </Button>
          <Button
            variant="outline"
            color="warning"
            onClick={() => toast.warning("Disk almost full")}
          >
            warning
          </Button>
          <Button variant="outline" color="danger" onClick={() => toast.danger("Request failed")}>
            danger
          </Button>
        </div>
      </Example>

      <Example
        id="rich"
        code={`// every typed toast
<Toaster richColors />

// or one toast
toast.success("Saved", { richColors: true });`}
      >
        <div className="pg-flex pg-flex--loose">
          <Button variant="outline" onClick={() => toast.info("Heads up", { richColors: true })}>
            info
          </Button>
          <Button
            variant="outline"
            color="success"
            onClick={() =>
              toast.success("Saved", { description: "Your changes are live.", richColors: true })
            }
          >
            success
          </Button>
          <Button
            variant="outline"
            color="warning"
            onClick={() => toast.warning("Disk almost full", { richColors: true })}
          >
            warning
          </Button>
          <Button
            variant="outline"
            color="danger"
            onClick={() => toast.danger("Request failed", { richColors: true })}
          >
            danger
          </Button>
        </div>
      </Example>

      <Example
        id="description"
        code={`toast.success("Profile updated", { description: "Your changes are live." });`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast.success("Profile updated", { description: "Your changes are live." })
          }
        >
          Show toast
        </Button>
      </Example>

      <Example
        id="action"
        code={`toast("Message archived", {
  action: { label: "Undo", onClick: () => … },
});`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast({
              title: "Message archived",
              action: { label: "Undo", onClick: () => toast.success("Restored") },
            })
          }
        >
          Show toast
        </Button>
      </Example>

      <Example
        id="promise"
        code={`toast.promise(save(), {
  loading: "Saving…",
  success: "Saved",
  error: "Could not save",
});`}
      >
        <div className="pg-flex pg-flex--loose">
          <Button
            variant="outline"
            onClick={() =>
              toast.promise(new Promise((r) => setTimeout(r, 1500)), {
                loading: "Saving…",
                success: "Saved",
                error: "Could not save",
              })
            }
          >
            Succeeds
          </Button>
          <Button
            variant="outline"
            color="danger"
            onClick={() =>
              toast
                .promise(new Promise((_, reject) => setTimeout(reject, 1500)), {
                  loading: "Saving…",
                  success: "Saved",
                  error: "Could not save",
                })
                .catch(() => undefined)
            }
          >
            Fails
          </Button>
        </div>
      </Example>

      <Example
        id="loading"
        code={`const id = toast.loading("Uploading…");
// when done:
toast.update(id, { type: "success", title: "Uploaded", timeout: 5000 });`}
      >
        <Button
          variant="outline"
          onClick={() => {
            const id = toast.loading("Uploading…");
            setTimeout(
              () => toast.update(id, { type: "success", title: "Uploaded", timeout: 5000 }),
              1500,
            );
          }}
        >
          Show loading
        </Button>
      </Example>

      <Example
        id="layout"
        code={`<Toaster layout="list" />   // list: one row each
<Toaster layout="stack" />  // stack: expands on hover or focus`}
      >
        <div className="pg-flex pg-flex--loose">
          {TOAST_LAYOUTS.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={l === layout ? "solid" : "outline"}
              onClick={() => setLayout(l)}
            >
              {l}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              toast.info("First");
              toast.success("Second", { description: t("layout.stacked") });
              toast.warning("Third");
              toast.danger("Fourth");
            }}
          >
            Fire 4 toasts
          </Button>
        </div>
      </Example>

      <Example id="position" code={`<Toaster position="top-center" />`}>
        <PositionDemo position={position} setPosition={setPosition} />
      </Example>

      <Example
        id="persistent"
        code={`toast({ title: "Stays until closed", timeout: 0 });
toast.close(); // close all`}
      >
        <div className="pg-flex pg-flex--loose">
          <Button
            variant="outline"
            onClick={() => toast({ title: "Stays until closed", timeout: 0 })}
          >
            Show persistent
          </Button>
          <Button variant="ghost" onClick={() => toast.close()}>
            Close all
          </Button>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Toaster" />
        <p className="pg-desc">{t.rich("api.functions")}</p>
        <PropsTable
          first={t("api.function")}
          rows={FUNCTIONS.map((f) => ({
            name: f.name,
            type: f.type,
            description: t.rich(`api.${f.key}`),
          }))}
        />
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
