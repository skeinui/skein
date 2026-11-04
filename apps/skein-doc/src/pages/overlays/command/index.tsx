import { useState } from "react";
import { Button, Command, CommandDialog, Kbd, Text } from "@skeinui/ui";
import type { CommandEntry } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "command / command-input-wrap / command-input" },
  { key: "list", name: "command-list / command-group / command-group-title" },
  { key: "item", name: "command-item" },
  { key: "empty", name: "command-empty" },
  { key: "dialog", name: "command-backdrop / command-dialog" },
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
const FILE = "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5";
const USER = "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6";
const GEAR = "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3";
const HOME = "M3 11 12 3l9 8M5 10v10h14V10";

/** The demo commands; labels are the page's `demo.<key>` messages. */
const commandItems = (t: (key: string) => string): CommandEntry[] => [
  {
    key: "home",
    label: t("demo.home"),
    icon: <Icon d={HOME} />,
    shortcut: "G D",
    keywords: ["overview"],
  },
  {
    type: "group",
    key: "files",
    label: t("demo.files"),
    items: [
      {
        key: "new-file",
        label: t("demo.new-file"),
        icon: <Icon d={FILE} />,
        shortcut: "⌘N",
        keywords: ["create", "add"],
      },
      { key: "open-file", label: t("demo.open-file"), icon: <Icon d={FILE} />, shortcut: "⌘O" },
      { key: "archive", label: t("demo.archive"), icon: <Icon d={FILE} />, disabled: true },
    ],
  },
  {
    type: "group",
    key: "account",
    label: t("demo.account"),
    items: [
      {
        key: "profile",
        label: t("demo.profile"),
        icon: <Icon d={USER} />,
        keywords: ["name", "avatar"],
      },
      { key: "settings", label: t("demo.settings"), icon: <Icon d={GEAR} />, shortcut: "⌘," },
    ],
  },
];

function DialogDemo() {
  const t = usePageT();
  const ITEMS = commandItems(t);
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="pg-stack pg-stack--start">
      <div className="pg-row">
        <Button variant="outline" onClick={() => setOpen(true)}>
          {t("dialog.open")}
        </Button>
        <Text tone="secondary">
          {t("dialog.press")} <Kbd>⌘</Kbd> <Kbd>J</Kbd> / <Kbd>Ctrl</Kbd> <Kbd>J</Kbd>{" "}
          {t("dialog.onPage")}
        </Text>
      </div>
      <Text tone="secondary">{t("demo.last", { key: last ?? "—" })}</Text>
      <CommandDialog
        items={ITEMS}
        open={open}
        onOpenChange={setOpen}
        hotkey="mod+j"
        onSelect={(key) => setLast(key)}
      />
    </div>
  );
}

export default function CommandPage() {
  const t = usePageT();
  const ITEMS = commandItems(t);
  const [last, setLast] = useState<string | null>(null);
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Command</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="inline"
        code={`import { Command } from "@skeinui/ui";

<Command aria-label="Commands" onSelect={(key) => run(key)} items={[
  { key: "home", label: "Go to dashboard", shortcut: "G D" },
  { type: "group", key: "files", label: "Files", items: [
    { key: "new", label: "New file", shortcut: "⌘N", keywords: ["create"] },
  ]},
]} />`}
      >
        <div className="pg-stack">
          <div className="pg-cmd-frame">
            <Command
              aria-label={t("inline.label")}
              items={ITEMS}
              onSelect={(key) => setLast(key)}
            />
          </div>
          <Text tone="secondary">{t("demo.last", { key: last ?? "—" })}</Text>
        </div>
      </Example>

      <Example
        id="dialog"
        code={`<CommandDialog items={items} open={open} onOpenChange={setOpen} hotkey="mod+j" />`}
      >
        <DialogDemo />
      </Example>

      <Example id="search" code={`{ key: "new", label: "New file", keywords: ["create", "add"] }`}>
        <div className="pg-cmd-frame">
          <Command aria-label={t("search.label")} items={ITEMS} emptyText={t("search.empty")} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <p className="pg-desc">{t.rich("api.entries")}</p>
        <ApiReference component="Command" />
        <h4>
          <code>CommandDialog</code>
        </h4>
        <ApiReference component="CommandDialog" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <PropsTable
          first={t("styling.hook")}
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
