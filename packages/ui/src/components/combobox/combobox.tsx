import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import type { ReactNode } from "react";
import type { FieldVariant, OverlayAlign, OverlaySide, UISize } from "../../contract.ts";
import { useFieldDefaults } from "../field/context.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface ComboboxOption {
  value: string;
  /** Plain text: used for filtering and display in the input. */
  label: string;
  disabled?: boolean;
}

export interface ComboboxOptionGroup {
  /** Group heading shown above its options (not selectable). */
  label: string;
  /** The options in this group. */
  options: ComboboxOption[];
}

export interface ComboboxProps {
  /** Options: a plain option, or a group with a label. Described with data, consistent with Select. */
  options: (ComboboxOption | ComboboxOptionGroup)[];
  /** Value of the selected item; null means nothing selected. Controlled. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  /** Message shown when there are no matches. */
  emptyText?: ReactNode;
  variant?: FieldVariant;
  size?: UISize;
  /** @default false */
  fullWidth?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  name?: string;
  "aria-label"?: string;
  /**
   * Which side of the input the popup opens on.
   * @default "bottom"
   */
  side?: OverlaySide;
  /**
   * How the popup is aligned with the input along that side.
   * @default "start"
   */
  align?: OverlayAlign;
  /**
   * Gap in pixels between the input and the popup.
   * @default 4
   */
  sideOffset?: number;
}

const isGroup = (o: ComboboxOption | ComboboxOptionGroup): o is ComboboxOptionGroup =>
  "options" in o;

function Check() {
  return (
    <svg viewBox="0 0 17 18" aria-hidden="true">
      <polyline
        points="1 9 7 14 15 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function renderItem(item: ComboboxOption) {
  return (
    <BaseCombobox.Item
      key={item.value}
      value={item}
      disabled={item.disabled}
      data-slot="select-item"
    >
      <span data-slot="select-item-text">{item.label}</span>
      <BaseCombobox.ItemIndicator data-slot="select-item-indicator">
        <Check />
      </BaseCombobox.ItemIndicator>
    </BaseCombobox.Item>
  );
}

/**
 * Searchable single-select: type in the input to filter the options, then pick one; the value must be one of the options.
 * Pass `options` (`{ value, label }`, or groups `{ label, options }`), and `value` / `onValueChange` (a string, null when nothing is selected);
 * `emptyText` is shown when nothing matches. For a short list without typing use Select; when free text is allowed and options are only suggestions use Autocomplete.
 *
 * Theme style: the input look reuses Input (slot is input-group), and the popup reuses the Select slots,
 * so the two are automatically consistent in every theme style. Filtering, keyboard navigation and accessibility come from Base UI's Combobox.
 */
export function Combobox({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  emptyText: emptyTextProp,
  variant,
  size,
  fullWidth = false,
  invalid,
  disabled,
  open,
  defaultOpen,
  onOpenChange,
  name,
  "aria-label": ariaLabel,
  side = "bottom",
  align = "start",
  sideOffset = 4,
}: ComboboxProps) {
  const t = useLabels("combobox");
  const c = useLabels("common");
  const emptyText = emptyTextProp ?? c.noResults;
  const field = useFieldDefaults();
  const flat = options.flatMap((o) => (isGroup(o) ? o.options : [o]));
  const find = (v: string | null | undefined) =>
    v == null ? null : (flat.find((o) => o.value === v) ?? null);
  const items = options.map((o, i) =>
    isGroup(o) ? { value: `group-${i}`, label: o.label, items: o.options } : o,
  );
  const grouped = options.some(isGroup);
  return (
    <BaseCombobox.Root
      items={items}
      {...(value !== undefined ? { value: find(value) } : null)}
      {...(defaultValue !== undefined ? { defaultValue: find(defaultValue) } : null)}
      onValueChange={(next) => onValueChange?.((next as ComboboxOption | null)?.value ?? null)}
      disabled={disabled}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      name={name}
      itemToStringLabel={(item) => (item as ComboboxOption).label}
      isItemEqualToValue={(a, b) => (a as ComboboxOption).value === (b as ComboboxOption).value}
    >
      <BaseCombobox.InputGroup
        data-slot="input-group"
        data-variant={variant ?? field?.variant ?? "outline"}
        data-size={size ?? field?.size ?? "md"}
        data-full-width={fullWidth ? "" : undefined}
      >
        <BaseCombobox.Input
          data-slot="input-group-input"
          aria-label={ariaLabel}
          placeholder={placeholder}
          {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
        />
        <span data-slot="input-group-suffix">
          <BaseCombobox.Trigger data-slot="combobox-trigger" aria-label={t.open}>
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
              <path d="m6 9 6 6 6-6" />
            </svg>
          </BaseCombobox.Trigger>
        </span>
      </BaseCombobox.InputGroup>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner
          data-slot="select-positioner"
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseCombobox.Popup data-slot="select">
            <BaseCombobox.Empty data-slot="combobox-empty">{emptyText}</BaseCombobox.Empty>
            <BaseCombobox.List data-slot="select-list">
              {(
                entry: ComboboxOption | { value: string; label: string; items: ComboboxOption[] },
              ) =>
                grouped && "items" in entry ? (
                  <BaseCombobox.Group
                    key={entry.value}
                    items={entry.items}
                    data-slot="select-group"
                  >
                    <BaseCombobox.GroupLabel data-slot="select-group-label">
                      {entry.label}
                    </BaseCombobox.GroupLabel>
                    <BaseCombobox.Collection>{renderItem}</BaseCombobox.Collection>
                  </BaseCombobox.Group>
                ) : (
                  renderItem(entry as ComboboxOption)
                )
              }
            </BaseCombobox.List>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  );
}
