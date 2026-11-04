import { Select as BaseSelect } from "@base-ui/react/select";
import type { ReactNode } from "react";
import type { FieldVariant, OverlayAlign, OverlaySide, UISize } from "../../contract.ts";
import { useFieldDefaults } from "../field/context.ts";

export interface SelectOption {
  value: string;
  /** Text shown in the list and, once selected, in the trigger. */
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  /** Group heading shown above its options (not selectable). */
  label: ReactNode;
  /** The options in this group. */
  options: SelectOption[];
}

export interface SelectProps extends Omit<
  BaseSelect.Root.Props<string, false>,
  "children" | "items" | "multiple"
> {
  /**
   * Options: a plain option, or a group with a label. Options are described with data rather than a pile of child elements,
   * so the selected item's text can be read directly, and it is also easier to generate pages from data later.
   */
  options: (SelectOption | SelectOptionGroup)[];
  placeholder?: ReactNode;
  /**
   * Look of the trigger; inside a Field the Field's is used when not passed.
   * @default "outline"
   */
  variant?: FieldVariant;
  /**
   * Size step; inside a Field the Field's is used when not passed.
   * @default "md"
   */
  size?: UISize;
  /**
   * Fills the width of the parent.
   * @default false
   */
  fullWidth?: boolean;
  /** When not inside a Field, mark it manually with invalid; inside a Field the Field's validation state decides. */
  invalid?: boolean;
  "aria-label"?: string;
  /**
   * Side of the trigger the popup opens on.
   * @default "bottom"
   */
  side?: OverlaySide;
  /**
   * Alignment of the popup along the trigger.
   * @default "start"
   */
  align?: OverlayAlign;
  /**
   * Gap between the trigger and the popup, in px.
   * @default 4
   */
  sideOffset?: number;
}

const isGroup = (o: SelectOption | SelectOptionGroup): o is SelectOptionGroup => "options" in o;

function renderOption(option: SelectOption) {
  return (
    <BaseSelect.Item
      key={option.value}
      value={option.value}
      disabled={option.disabled}
      data-slot="select-item"
    >
      <BaseSelect.ItemText data-slot="select-item-text">{option.label}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator data-slot="select-item-indicator">
        <svg viewBox="0 0 17 18" aria-hidden="true">
          <polyline
            points="1 9 7 14 15 4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

/**
 * Dropdown select that picks one value from a list of options; the trigger looks like Input (inside a Field it takes the Field's variant / size).
 * `options` is data: `{ value, label, disabled }` items or `{ label, options }` groups; `value` / `onValueChange` hold the selected value (a string).
 * The keyboard and type-ahead search work out of the box; the popup flips to stay in view and is placed by `side` / `align` / `sideOffset`.
 * To filter by typing use Combobox; for hierarchical options use Cascader or TreeSelect; for a few always-visible choices use RadioGroup or Segmented.
 *
 * Theme style: behavior (keyboard, type-ahead search, collision flipping) comes from Base UI; the options, groups and selection indicator in the popup are decided by the theme style.
 */
export function Select({
  options,
  placeholder,
  variant,
  size,
  fullWidth = false,
  invalid,
  "aria-label": ariaLabel,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  ...root
}: SelectProps) {
  const field = useFieldDefaults();
  const items = options.flatMap((o) => (isGroup(o) ? o.options : [o]));
  return (
    <BaseSelect.Root items={items} {...root}>
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
        data-slot="select-trigger"
        data-variant={variant ?? field?.variant ?? "outline"}
        data-size={size ?? field?.size ?? "md"}
        data-full-width={fullWidth ? "" : undefined}
      >
        <BaseSelect.Value data-slot="select-value" placeholder={placeholder} />
        <BaseSelect.Icon data-slot="select-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          data-slot="select-positioner"
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignItemWithTrigger={false}
        >
          <BaseSelect.Popup data-slot="select">
            <BaseSelect.List data-slot="select-list">
              {options.map((o, i) =>
                isGroup(o) ? (
                  <BaseSelect.Group key={i} data-slot="select-group">
                    <BaseSelect.GroupLabel data-slot="select-group-label">
                      {o.label}
                    </BaseSelect.GroupLabel>
                    {o.options.map(renderOption)}
                  </BaseSelect.Group>
                ) : (
                  renderOption(o)
                ),
              )}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
