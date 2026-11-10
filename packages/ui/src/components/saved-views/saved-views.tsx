import { useState } from "react";
import type { SavedViewsLabels } from "../../locales/messages.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Button } from "../button/index.ts";
import { Dialog } from "../dialog/index.ts";
import { Input } from "../input/index.ts";
import { Flex } from "../layout/index.ts";
import { Menu } from "../menu/index.ts";
import { Text } from "../typography/index.ts";

const RemoveIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={14}
    height={14}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

/** The tick of the view in use, in the primary color of the theme style; the others get an empty box of the same size, so the names line up. */
const CheckIcon = ({ checked }: { checked: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    width={14}
    height={14}
    fill="none"
    stroke="var(--ui-c-primary-text, currentColor)"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {checked ? <path d="M20 6 9 17l-5-5" /> : null}
  </svg>
);

/** The trash can of the menu layout, in the danger color of the theme style. */
const TrashIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={14}
    height={14}
    fill="none"
    stroke="var(--ui-c-danger-text, currentColor)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const Chevron = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
    <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** What SavedViews needs of a view: an id and a name. Whatever else it holds (a keyword, a filter, a sort) is yours. */
export interface SavedViewItem {
  id: string;
  name: string;
}

export interface SavedViewsProps<T extends SavedViewItem = SavedViewItem> {
  /** The views to show, in order. Where they are kept (the browser, the server) is yours: this only shows them. */
  views: readonly T[];
  /** The id of the view in use: it is shown as selected. */
  value?: string;
  /** A view was chosen: apply what it holds. */
  onSelect?: (view: T) => void;
  /** The × of a view was pressed: remove it from where you keep them. The × shows when this is given. */
  onDelete?: (view: T) => void;
  /**
   * A name was confirmed in the dialog: keep the current search under it. The "Save as a view" button shows when this is given;
   * when it returns a promise the dialog stays open until it is done (and stays if it fails).
   */
  onSave?: (name: string) => void | Promise<unknown>;
  /** Whether there is something to keep: the save button is off while this is false, e.g. no keyword and no filter. @default true */
  canSave?: boolean;
  /**
   * `row` lists the views next to each other with a save button: it takes a row of its own. `menu` is one button that opens a menu with the views (the one in use is ticked),
   * a × after each one to remove it (Delete on the keyboard) and "Save as a view…": it fits at the end of a toolbar or of a row of tabs.
   * @default "row"
   */
  layout?: "row" | "menu";
  /** Texts for another language; the default follows the `locale` of ConfigProvider. */
  labels?: Partial<SavedViewsLabels>;
}

/**
 * Saved views: the searches a person keeps under a name: a row of them to choose from (and remove), and a button that asks for a name and keeps the current search.
 * It stores nothing and knows nothing of what a view holds: `views` are given, and `onSelect` / `onDelete` / `onSave` hand every change back to you.
 * Put it above a table next to TableToolbar.
 */
export function SavedViews<T extends SavedViewItem = SavedViewItem>({
  views,
  value,
  onSelect,
  onDelete,
  onSave,
  canSave = true,
  layout = "row",
  labels,
}: SavedViewsProps<T>) {
  const t = { ...useLabels("savedViews"), ...labels };
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  if (views.length === 0 && !onSave) return null;

  const close = () => {
    setOpen(false);
    setName("");
  };
  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave?.(trimmed);
      close();
    } catch {
      // The dialog stays open: the failure is for the caller to show
    } finally {
      setSaving(false);
    }
  };

  const dialog = (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <Dialog.Content size="sm">
        <Dialog.Title>{t.save}</Dialog.Title>
        <Dialog.Body>
          <Input
            fullWidth
            aria-label={t.name}
            placeholder={t.namePlaceholder}
            value={name}
            onValueChange={setName}
            // Enter confirms a typed word of an input method too: not then
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && void save()}
          />
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="ghost" color="neutral" onClick={close}>
            {t.cancel}
          </Button>
          <Button loading={saving} disabled={!name.trim()} onClick={() => void save()}>
            {t.confirm}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );

  if (layout === "menu") {
    return (
      <>
        <Menu>
          <Menu.Trigger
            render={<Button size="sm" variant="ghost" color="neutral" endContent={<Chevron />} />}
          >
            {t.title}
          </Menu.Trigger>
          <Menu.Content align="end" aria-label={t.title}>
            {views.map((view) => (
              <Menu.Item
                key={view.id}
                // The view in use is ticked at the start of its row (a checkable item would put its tick at the end, where the trash is)
                role="menuitemradio"
                aria-checked={value === view.id}
                onClick={() => onSelect?.(view)}
                // A keyboard has no trash can to press: Delete on the focused view removes it
                aria-keyshortcuts={onDelete ? "Delete" : undefined}
                onKeyDown={(e) => {
                  if (onDelete && (e.key === "Delete" || e.key === "Backspace")) {
                    e.preventDefault();
                    onDelete(view);
                  }
                }}
              >
                <Flex justify="between" align="center" gap="md" grow>
                  <Flex align="center" gap="xs">
                    <CheckIcon checked={value === view.id} />
                    <span>{view.name}</span>
                  </Flex>
                  {onDelete ? (
                    // Not a button inside a menu item: a mouse affordance, with the keyboard's Delete above
                    <span
                      role="presentation"
                      title={t.remove(view.name)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(view);
                      }}
                      onPointerUp={(e) => e.stopPropagation()}
                      onMouseUp={(e) => e.stopPropagation()}
                    >
                      <TrashIcon />
                    </span>
                  ) : null}
                </Flex>
              </Menu.Item>
            ))}
            {onSave ? (
              <>
                {views.length > 0 ? <Menu.Separator /> : null}
                <Menu.Item disabled={!canSave} onClick={() => setOpen(true)}>
                  {t.save}…
                </Menu.Item>
              </>
            ) : null}
          </Menu.Content>
        </Menu>
        {dialog}
      </>
    );
  }

  return (
    <>
      <Flex gap="xs" align="center" wrap role="group" aria-label={t.title}>
        {views.length > 0 ? <Text tone="secondary">{t.title}</Text> : null}
        {views.map((view) => (
          <Flex key={view.id} gap="xs" align="center">
            <Button
              size="sm"
              variant={value === view.id ? "soft" : "ghost"}
              aria-pressed={value === view.id}
              onClick={() => onSelect?.(view)}
            >
              {view.name}
            </Button>
            {onDelete ? (
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                aria-label={t.remove(view.name)}
                onClick={() => onDelete(view)}
              >
                <RemoveIcon />
              </Button>
            ) : null}
          </Flex>
        ))}
        {onSave ? (
          <Button size="sm" variant="ghost" disabled={!canSave} onClick={() => setOpen(true)}>
            {t.save}
          </Button>
        ) : null}
      </Flex>
      {dialog}
    </>
  );
}
