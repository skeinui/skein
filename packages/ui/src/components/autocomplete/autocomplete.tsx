import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import type { ReactNode } from "react";
import type { FieldVariant, OverlayAlign, OverlaySide, UISize } from "../../contract.ts";
import { useFieldDefaults } from "../field/context.ts";

export interface AutocompleteProps {
  /** Suggestion list, plain strings; the user can pick one, or type any text outside the list. */
  items: string[];
  /** Text in the input. Controlled. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Message shown when no suggestion matches; if not passed, the popup is simply not shown when nothing matches. */
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
   * Which side of the input the suggestion popup opens on.
   * @default "bottom"
   */
  side?: OverlaySide;
  /**
   * How the popup is aligned with the input along that side.
   * @default "start"
   */
  align?: OverlayAlign;
  /**
   * Gap in pixels between the input and the suggestion popup.
   * @default 4
   */
  sideOffset?: number;
}

/**
 * Input with suggestions: unlike Combobox, the value is the text in the input and suggestions are only an aid; picking one of them is not required.
 * Its look reuses Input (input-group), and the popup reuses Select's slots.
 */
export function Autocomplete({
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  emptyText,
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
}: AutocompleteProps) {
  const field = useFieldDefaults();
  return (
    <BaseAutocomplete.Root
      items={items}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next) => onValueChange(next) : undefined}
      disabled={disabled}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      name={name}
    >
      <BaseAutocomplete.InputGroup
        data-slot="input-group"
        data-variant={variant ?? field?.variant ?? "outline"}
        data-size={size ?? field?.size ?? "md"}
        data-full-width={fullWidth ? "" : undefined}
      >
        <BaseAutocomplete.Input
          data-slot="input-group-input"
          aria-label={ariaLabel}
          placeholder={placeholder}
          {...(invalid ? { "data-invalid": "", "aria-invalid": true } : null)}
        />
      </BaseAutocomplete.InputGroup>
      <BaseAutocomplete.Portal>
        <BaseAutocomplete.Positioner
          data-slot="select-positioner"
          side={side}
          align={align}
          sideOffset={sideOffset}
        >
          <BaseAutocomplete.Popup data-slot="select">
            {emptyText ? (
              <BaseAutocomplete.Empty data-slot="combobox-empty">
                {emptyText}
              </BaseAutocomplete.Empty>
            ) : null}
            <BaseAutocomplete.List data-slot="select-list">
              {(item: string) => (
                <BaseAutocomplete.Item key={item} value={item} data-slot="select-item">
                  <span data-slot="select-item-text">{item}</span>
                </BaseAutocomplete.Item>
              )}
            </BaseAutocomplete.List>
          </BaseAutocomplete.Popup>
        </BaseAutocomplete.Positioner>
      </BaseAutocomplete.Portal>
    </BaseAutocomplete.Root>
  );
}
