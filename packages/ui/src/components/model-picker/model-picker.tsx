import { Select as BaseSelect } from "@base-ui/react/select";
import type { ReactNode } from "react";
import type { OverlayAlign, OverlaySide } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface ModelOption {
  /** Unique id; it is the picker's `value`. */
  id: string;
  /** Model name, shown in the trigger and the list. */
  name: string;
  /** A line of description under the name in the list ("Fast, great for everyday tasks"). */
  description?: string;
  /** Small tag after the name ("New", "Beta"). */
  badge?: string;
  /** Icon before the name (vendor logo). */
  icon?: ReactNode;
  disabled?: boolean;
  /** Group name (vendor, series); grouped ones are gathered together in order of appearance. */
  group?: string;
}

export interface ModelPickerProps {
  /** The models to choose from, in display order (models with the same `group` are gathered together). */
  models: readonly ModelOption[];
  /** Id of the current model; controlled. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string) => void;
  /** Text on the trigger when nothing is selected, default "Select model". */
  placeholder?: string;
  disabled?: boolean;
  /** Name of the trigger, for screen readers, default "Model". */
  "aria-label"?: string;
  /**
   * Which side of the trigger the list appears on, default top (placed in the input toolbar and pops up upward).
   * @default "top"
   */
  side?: OverlaySide;
  /**
   * How the list is aligned to the trigger along that side.
   * @default "start"
   */
  align?: OverlayAlign;
}

const Caret = () => (
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
);

function renderItem(model: ModelOption) {
  return (
    <BaseSelect.Item
      key={model.id}
      value={model.id}
      label={model.name}
      disabled={model.disabled}
      data-slot="select-item"
    >
      {model.icon ? (
        <span data-slot="model-picker-item-icon" aria-hidden="true">
          {model.icon}
        </span>
      ) : null}
      <BaseSelect.ItemText data-slot="select-item-text">
        <span data-slot="model-picker-item-body">
          <span data-slot="model-picker-item-name">
            {model.name}
            {model.badge ? <span data-slot="model-picker-item-badge">{model.badge}</span> : null}
          </span>
          {model.description ? (
            <span data-slot="model-picker-item-description">{model.description}</span>
          ) : null}
        </span>
      </BaseSelect.ItemText>
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
 * Model picker for AI chat: a compact trigger (icon + current model name + arrow) that opens a list of models with descriptions, badges and groups.
 * Pass `models` (`{ id, name, description?, badge?, icon?, group? }`) and the selected id via `value` / `onValueChange`;
 * the list opens above the trigger by default (`side`). Put it inside `Composer.ToolbarStart`.
 * For a general-purpose dropdown use Select.
 *
 * Theme style: behavior (keyboard, type-ahead, `aria-expanded`, collision flipping) comes from Base UI's Select, and the list look reuses Select's theme style (`data-model-picker` on the popup).
 */
export function ModelPicker({
  models,
  value,
  defaultValue,
  onValueChange,
  placeholder: placeholderProp,
  disabled,
  "aria-label": labelProp,
  side = "top",
  align = "start",
}: ModelPickerProps) {
  const t = useLabels("modelPicker");
  const label = labelProp ?? t.label;
  const placeholder = placeholderProp ?? t.placeholder;
  const items = models.map((m) => ({ value: m.id, label: m.name }));
  const groups: { name: string | null; models: ModelOption[] }[] = [];
  for (const model of models) {
    const name = model.group ?? null;
    const last = groups[groups.length - 1];
    const existing = name === null ? undefined : groups.find((g) => g.name === name);
    if (existing) existing.models.push(model);
    else if (last && last.name === null && name === null) last.models.push(model);
    else groups.push({ name, models: [model] });
  }
  const byId = new Map(models.map((m) => [m.id, m]));
  return (
    <BaseSelect.Root
      items={items}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onValueChange={(next) => {
        if (typeof next === "string") onValueChange?.(next);
      }}
    >
      <BaseSelect.Trigger aria-label={label} data-slot="model-picker-trigger">
        <BaseSelect.Value data-slot="model-picker-name" placeholder={placeholder}>
          {(id: string | null) => {
            const model = id ? byId.get(id) : undefined;
            return model ? (
              <>
                {model.icon ? (
                  <span data-slot="model-picker-icon" aria-hidden="true">
                    {model.icon}
                  </span>
                ) : null}
                {model.name}
              </>
            ) : (
              placeholder
            );
          }}
        </BaseSelect.Value>
        <BaseSelect.Icon data-slot="model-picker-caret">
          <Caret />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          data-slot="select-positioner"
          side={side}
          align={align}
          sideOffset={6}
          alignItemWithTrigger={false}
        >
          <BaseSelect.Popup data-slot="select" data-model-picker="">
            <BaseSelect.List data-slot="select-list">
              {groups.map((group, i) =>
                group.name === null ? (
                  group.models.map(renderItem)
                ) : (
                  <BaseSelect.Group key={i} data-slot="select-group">
                    <BaseSelect.GroupLabel data-slot="select-group-label">
                      {group.name}
                    </BaseSelect.GroupLabel>
                    {group.models.map(renderItem)}
                  </BaseSelect.Group>
                ),
              )}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
