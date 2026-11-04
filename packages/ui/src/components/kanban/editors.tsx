import { useId, useRef, useState } from "react";
import { COLORS } from "../../contract.ts";
import type { UIColor } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { Dialog } from "../dialog/index.ts";
import { Field } from "../field/index.ts";
import { Input, Textarea } from "../input/index.ts";
import type { KanbanLabels } from "./kanban.tsx";
import type { KanbanCard, KanbanCardChanges, KanbanLabel } from "./move.ts";

/** A card's footer can only be edited in the edit box when it is a string (or absent); a node is kept as is. */
const footerEditable = (card: KanbanCard) =>
  card.footer === undefined || card.footer === null || typeof card.footer === "string";

/** Whether anything changed after editing compared with the original (title, description, tags, progress, footer). */
export function sameCard(card: KanbanCard, changes: KanbanCardChanges) {
  const before = card.labels ?? [];
  return (
    changes.title === card.title &&
    changes.description === (card.description ?? "") &&
    changes.progress === card.progress &&
    changes.footer === card.footer &&
    changes.labels.length === before.length &&
    changes.labels.every(
      (l, i) =>
        l.label === before[i]?.label && (l.color ?? "neutral") === (before[i]?.color ?? "neutral"),
    )
  );
}

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/**
 * Card edit dialog (like opening a card in Trello): title, description, tags (add / remove, pick a color), progress, footer.
 * Enter (in the title) / Ctrl·⌘ + Enter (in the description) / Save submits; Enter in the tag input adds a tag and does not submit.
 * Inputs inside the white dialog use filled (gray background): outline is a white background + a very faint shadow, which would blend in.
 */
export function KanbanCardDialog({
  open,
  onOpenChange,
  card,
  columnTitle,
  labels,
  cancelLabel,
  deleteLabel,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: KanbanCard;
  columnTitle: string;
  labels: KanbanLabels;
  cancelLabel: string;
  /** The "Delete" button appears only when `onCardDelete` is given. */
  deleteLabel?: string;
  onSubmit: (changes: KanbanCardChanges) => void;
  onDelete?: () => void;
}) {
  const [invalid, setInvalid] = useState(false);
  const [chips, setChips] = useState<KanbanLabel[]>(() => [...(card.labels ?? [])]);
  const [text, setText] = useState("");
  const [color, setColor] = useState<UIColor>("primary");
  const titleRef = useRef<HTMLInputElement>(null);
  const labelsId = useId();
  const canEditFooter = footerEditable(card);

  /** Add a tag (a tag with the same name is not added twice); returns the list after adding, needed on submit. */
  const withPending = (list: KanbanLabel[]) => {
    const label = text.trim();
    return !label || list.some((l) => l.label === label) ? list : [...list, { label, color }];
  };
  const addChip = () => {
    setChips(withPending(chips));
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content initialFocus={titleRef}>
        <Dialog.Title>{labels.editCardTitle}</Dialog.Title>
        <Dialog.Description>{labels.editInColumn(columnTitle)}</Dialog.Description>
        <form
          data-slot="kanban-card-editor"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const field = (name: string) => {
              const value = data.get(name);
              return typeof value === "string" ? value.trim() : "";
            };
            const title = field("title");
            if (!title) return setInvalid(true);
            const raw = Number(field("progress"));
            onSubmit({
              title,
              description: field("description"),
              labels: withPending(chips),
              progress:
                field("progress") === "" || Number.isNaN(raw)
                  ? undefined
                  : Math.min(100, Math.max(0, Math.round(raw))),
              footer: canEditFooter ? field("footer") || undefined : card.footer,
            });
          }}
        >
          <Dialog.Body>
            <Field variant="filled">
              <Field.Label>{labels.editTitleLabel}</Field.Label>
              <Input
                ref={titleRef}
                name="title"
                fullWidth
                defaultValue={card.title}
                invalid={invalid}
                onValueChange={() => setInvalid(false)}
              />
            </Field>
            <Field variant="filled">
              <Field.Label>{labels.editDescriptionLabel}</Field.Label>
              <Textarea
                name="description"
                fullWidth
                autoSize={{ minRows: 3 }}
                defaultValue={card.description ?? ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </Field>
            <div data-slot="kanban-label-editor" role="group" aria-labelledby={labelsId}>
              <span id={labelsId} data-slot="field-label">
                {labels.editLabels}
              </span>
              {chips.length > 0 ? (
                <ul data-slot="kanban-card-labels">
                  {chips.map((l) => (
                    <li key={l.label} data-slot="kanban-label" data-color={l.color ?? "neutral"}>
                      {l.label}
                      <button
                        type="button"
                        data-slot="kanban-label-remove"
                        aria-label={labels.removeLabel(l.label)}
                        onClick={() => setChips(chips.filter((c) => c.label !== l.label))}
                      >
                        <CloseIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div data-slot="kanban-label-add">
                <Input
                  variant="filled"
                  size="sm"
                  value={text}
                  placeholder={labels.labelPlaceholder}
                  aria-label={labels.labelPlaceholder}
                  onValueChange={setText}
                  onKeyDown={(e) => {
                    // Enter here adds a tag, it does not submit the whole card
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      addChip();
                    }
                  }}
                />
                <div data-slot="kanban-swatches" role="group" aria-label={labels.colorGroup}>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      data-slot="kanban-swatch"
                      data-color={c}
                      aria-pressed={color === c}
                      aria-label={labels.colors[c]}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  color="neutral"
                  disabled={text.trim() === ""}
                  onClick={addChip}
                >
                  {labels.labelAdd}
                </Button>
              </div>
            </div>
            <Field variant="filled">
              <Field.Label>{labels.editProgress}</Field.Label>
              <Input
                name="progress"
                type="number"
                min={0}
                max={100}
                step={1}
                inputMode="numeric"
                fullWidth
                defaultValue={card.progress ?? ""}
              />
              <Field.Description>{labels.editProgressHint}</Field.Description>
            </Field>
            {canEditFooter ? (
              <Field variant="filled">
                <Field.Label>{labels.editFooter}</Field.Label>
                <Input
                  name="footer"
                  fullWidth
                  defaultValue={typeof card.footer === "string" ? card.footer : ""}
                />
              </Field>
            ) : null}
          </Dialog.Body>
          <Dialog.Footer>
            {onDelete ? (
              // Button occupies data-slot itself, so the hook goes on the outer layer
              <span data-slot="kanban-card-delete">
                <Button type="button" variant="ghost" color="danger" onClick={onDelete}>
                  {deleteLabel}
                </Button>
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              color="neutral"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button type="submit">{labels.save}</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}

/**
 * Inline "add" input (used by both cards and columns): Enter adds, the input stays so you can keep typing, Esc or "Cancel" collapses it.
 * Cards use a multi-line input (Shift + Enter inserts a newline), columns use a single line.
 */
export function KanbanComposer({
  multiline = false,
  label,
  placeholder,
  submitLabel,
  cancelLabel,
  onSubmit,
  onClose,
}: {
  multiline?: boolean;
  label: string;
  placeholder: string;
  submitLabel: string;
  cancelLabel: string;
  onSubmit: (title: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const submit = () => {
    const title = value.trim();
    if (!title) return;
    onSubmit(title);
    setValue("");
  };
  return (
    <form
      data-slot="kanban-composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      {multiline ? (
        <Textarea
          autoFocus
          fullWidth
          autoSize={{ minRows: 2 }}
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onValueChange={setValue}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
      ) : (
        <Input
          autoFocus
          fullWidth
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onValueChange={setValue}
        />
      )}
      <div data-slot="kanban-composer-actions">
        <Button type="submit" size="sm" disabled={value.trim() === ""}>
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" color="neutral" onClick={onClose}>
          {cancelLabel}
        </Button>
      </div>
    </form>
  );
}
