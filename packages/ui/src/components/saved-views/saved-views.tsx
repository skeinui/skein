import { useState } from "react";
import type { SavedViewsLabels } from "../../locales/messages.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Button } from "../button/index.ts";
import { Dialog } from "../dialog/index.ts";
import { Input } from "../input/index.ts";
import { Flex } from "../layout/index.ts";
import { Text } from "../typography/index.ts";

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
    </>
  );
}
