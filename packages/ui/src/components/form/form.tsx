import { useImperativeHandle, useMemo, useRef, useState } from "react";
import type { FocusEvent, FormEvent, ReactNode, RefObject } from "react";
import type { FieldVariant, UISize } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { Checkbox, CheckboxGroup } from "../checkbox/index.ts";
import { DatePicker } from "../date-picker/index.ts";
import { Field } from "../field/index.ts";
import { Input, Textarea } from "../input/index.ts";
import { NumberField } from "../number-field/index.ts";
import { Radio, RadioGroup } from "../radio/index.ts";
import { Rating } from "../rating/index.ts";
import { Segmented } from "../segmented/index.ts";
import { Select } from "../select/index.ts";
import { TimePicker } from "../time-picker/index.ts";
import { Slider } from "../slider/index.ts";
import { Switch } from "../switch/index.ts";
import { DEFAULT_MESSAGES, validateValue } from "./validate.ts";
import type { FormMessages, ValidationRules } from "./validate.ts";
import { getIn, setIn } from "./values.ts";
import type { FormValues } from "./values.ts";
import { useLabels } from "../../locales/use-labels.ts";

export type FormFieldType =
  | "text"
  | "password"
  | "email"
  | "url"
  | "tel"
  | "search"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "checkbox-group"
  | "switch"
  | "slider"
  | "rating"
  | "date"
  | "time"
  | "datetime"
  | "segmented"
  | "custom";

export interface FormOption {
  value: string;
  /** Text shown for the option. */
  label: ReactNode;
  disabled?: boolean;
}

/** What render of the custom type receives: just wire them to your own control. */
export interface FormControlContext {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  invalid: boolean;
  disabled: boolean;
  field: FormField;
}

export interface FormField extends ValidationRules {
  /** Field name, also the key in the values object; supports dot paths "address.city" for nesting. */
  name: string;
  /** Control type, default text. To use another control choose custom and provide render. */
  type?: FormFieldType;
  /** Label shown with the control (on top or on the left, per Form `layout`). */
  label?: ReactNode;
  /** Description text below the control. */
  description?: ReactNode;
  placeholder?: string;
  defaultValue?: unknown;
  disabled?: boolean | ((values: FormValues) => boolean);
  /**
   * Conditional display: when it returns true this field is not shown, not validated and not part of the submitted values (the value itself is kept and restored when shown again).
   */
  hidden?: boolean | ((values: FormValues) => boolean);
  /**
   * Names of other fields it depends on: when those fields' values change, this field is validated again (e.g. "confirm password" depends on "password").
   * Only fields that have already been validated are re-validated (blurred, submitted, or already with an error); untouched fields do not suddenly show errors because of changes elsewhere.
   */
  dependencies?: readonly string[];
  /** Number of columns it spans in a multi-column layout (Form columns > 1), default 1. */
  span?: number;
  /** Options for select / radio / checkbox-group / segmented. */
  options?: readonly FormOption[];
  /** Props passed directly to the control (e.g. rows of textarea, step of number, allowHalf of rating). */
  props?: Record<string, unknown>;
  /** Used to render the control when type is custom. */
  render?: (control: FormControlContext) => ReactNode;
}

/** Imperative interface obtained through instanceRef. */
export interface FormInstance {
  /** Validate and submit; returns whether the submit succeeded (false if validation failed). */
  submit: () => Promise<boolean>;
  /** Validate all fields (or one specified field), and return whether all passed. */
  validate: (name?: string) => Promise<boolean>;
  reset: () => void;
  getValues: () => FormValues;
  setValues: (values: FormValues) => void;
  /** Set field errors, often used to show validation results returned by the server. */
  setErrors: (errors: Record<string, string>) => void;
  focus: (name: string) => void;
}

export interface FormProps {
  /** The fields, in order (`FormField`: `name`, `type`, `label`, validation rules such as `required` / `min` / `pattern`, `options`, `hidden`). */
  fields: readonly FormField[];
  /** Values, controlled; if omitted the Form manages them itself. */
  values?: FormValues;
  defaultValues?: FormValues;
  onValuesChange?: (values: FormValues, changedName: string) => void;
  /**
   * Called after validation passes, with the values (of visible fields). When it returns a Promise the submit button spins and cannot be submitted again before it finishes;
   * if it throws, the error is rethrown (not swallowed), and the state is restored.
   */
  onSubmit?: (values: FormValues) => void | Promise<void>;
  /** Validation failed on submit: the argument is { field name: error }; focus moves to the first field in error. */
  onInvalid?: (errors: Record<string, string>) => void;
  /** Called after the form is reset to its default values (the reset button, or `reset()` of the `instanceRef` instance). */
  onReset?: () => void;
  /** Field errors provided externally (server validation), shown when there is no internal error. */
  errors?: Record<string, string>;
  /**
   * When to validate: submit only on submit; blur when leaving the field; change on every input. A field that has had an error
   * is re-validated on later changes, and choice controls (which have no "leaving") are validated as soon as they change.
   * @default "blur"
   */
  validateOn?: "submit" | "blur" | "change";
  /**
   * vertical: label on top; horizontal: label on the left; inline: laid out in one row.
   * @default "vertical"
   */
  layout?: "vertical" | "horizontal" | "inline";
  /**
   * Columns per row (1–4); fields use span to span columns.
   * @default 1
   */
  columns?: number;
  /** Default size of every field. */
  size?: UISize;
  /** Default variant of every field. */
  variant?: FieldVariant;
  /**
   * Disables every field and the submit button.
   * @default false
   */
  disabled?: boolean;
  /** Submit button text; the reset button is shown only if resetLabel is given. */
  submitLabel?: ReactNode;
  /** Text of the reset button; the button is shown only when this is given. */
  resetLabel?: ReactNode;
  /**
   * Fully customize the bottom action area (replaces the default buttons); `false` leaves the area out, for a form whose
   * buttons are elsewhere (a button outside it submits with `form={id}`).
   */
  actions?: ReactNode;
  /** The `id` of the `<form>`: another element's `form` attribute (a submit button in a drawer's footer) refers to it. */
  id?: string;
  /** Validation message text (for changing language); only pass the ones to change. */
  messages?: Partial<FormMessages>;
  /** Ref filled with the imperative `FormInstance` (`submit`, `validate`, `reset`, `getValues`, `setValues`, `setErrors`, `focus`). */
  instanceRef?: RefObject<FormInstance | null>;
}

const MAX_COLUMNS = 4;
const CHANGE_VALIDATED = new Set<FormFieldType>([
  "select",
  "radio",
  "checkbox",
  "checkbox-group",
  "switch",
  "slider",
  "rating",
  "date",
  "time",
  "datetime",
  "segmented",
  "custom",
]);

function defaultFor(field: FormField): unknown {
  if (field.defaultValue !== undefined) return field.defaultValue;
  switch (field.type ?? "text") {
    case "number":
    case "select":
    case "radio":
    case "date":
    case "time":
    case "datetime":
    case "segmented":
      return null;
    case "checkbox":
    case "switch":
      return false;
    case "checkbox-group":
      return [];
    case "slider":
      return typeof field.props?.min === "number" ? field.props.min : 0;
    case "rating":
      return 0;
    case "custom":
      return undefined;
    default:
      return "";
  }
}

const resolve = <T,>(
  value: T | ((values: FormValues) => T) | undefined,
  values: FormValues,
  fallback: T,
): T =>
  typeof value === "function" ? (value as (v: FormValues) => T)(values) : (value ?? fallback);

function rulesOf(field: FormField): ValidationRules {
  const type = field.type ?? "text";
  return {
    required: field.required,
    format: type === "email" || type === "url" ? type : field.format,
    minLength: field.minLength,
    maxLength: field.maxLength,
    min: field.min,
    max: field.max,
    pattern: field.pattern,
    validate: field.validate,
    messages: field.messages,
  };
}

function buildInitial(fields: readonly FormField[], defaults: FormValues | undefined): FormValues {
  let values: FormValues = { ...defaults };
  for (const field of fields) {
    const given = defaults ? getIn(defaults, field.name) : undefined;
    values = setIn(values, field.name, given !== undefined ? given : defaultFor(field));
  }
  return values;
}

/** Value of text-like controls: strings as is, numbers / booleans converted to strings, anything else (empty values, objects) treated as empty. */
const asText = (value: unknown): string =>
  typeof value === "string"
    ? value
    : typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : "";

function focusFirstIn(item: Element | null) {
  item
    ?.querySelector<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), [role="slider"], [role="combobox"], [role="radio"]:not([disabled]), button:not([disabled])',
    )
    ?.focus();
}

/**
 * Data-driven form: fields describe each field (name, type, label, validation rules), and Form handles layout, values, validation,
 * error messages and submit state. Values are held by Form (controlled or uncontrolled) and do not depend on whether a control is wired into the native form, so controls like date and rating work the same way.
 * For more freedom use type="custom" with render for a field; to lay out the whole form yourself, use Field plus the controls directly.
 */
export function Form({
  fields,
  values: valuesProp,
  defaultValues,
  onValuesChange,
  onSubmit,
  onInvalid,
  onReset,
  errors: externalErrors,
  validateOn = "blur",
  layout = "vertical",
  columns = 1,
  size,
  variant,
  disabled = false,
  submitLabel: submitLabelProp,
  resetLabel,
  actions,
  id,
  messages: messagesProp,
  instanceRef,
}: FormProps) {
  const t = useLabels("form");
  const submitLabel = submitLabelProp ?? t.submit;
  const messages = useMemo(() => ({ ...DEFAULT_MESSAGES, ...messagesProp }), [messagesProp]);
  const rootRef = useRef<HTMLFormElement>(null);
  const initialRef = useRef<FormValues | null>(null);
  initialRef.current ??= buildInitial(fields, defaultValues);
  const [innerValues, setInnerValues] = useState<FormValues>(initialRef.current);
  const values = valuesProp ?? innerValues;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const [errors, setErrorsState] = useState<Record<string, string>>({});
  const tokens = useRef<Record<string, number>>({});
  /** Fields that have been validated (blurred, submitted or validated once count), and only these are re-validated when a dependent field changes. */
  const validated = useRef<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const read = (field: FormField, source: FormValues = values) => {
    const value = getIn(source, field.name);
    return value !== undefined ? value : defaultFor(field);
  };
  const isHidden = (field: FormField, source: FormValues = valuesRef.current) =>
    resolve(field.hidden, source, false);
  const visible = fields.filter((f) => !isHidden(f, values));

  const check = (field: FormField, source: FormValues) =>
    validateValue(read(field, source), source, rulesOf(field), messages);

  const putError = (name: string, error: string | undefined) =>
    setErrorsState((prev) => {
      if ((prev[name] ?? undefined) === error) return prev;
      const next = { ...prev };
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });

  /** Validate one field; async validations may return out of order, so only the latest result is used. */
  const validateField = async (field: FormField, source: FormValues = valuesRef.current) => {
    validated.current.add(field.name);
    const token = (tokens.current[field.name] = (tokens.current[field.name] ?? 0) + 1);
    const error = await check(field, source);
    if (tokens.current[field.name] === token) putError(field.name, error);
    return error;
  };

  /** Values of some fields changed: fields that depend on them and have already been validated are re-validated. */
  const revalidateDependents = (changed: readonly string[], source: FormValues) => {
    for (const other of fields) {
      if (changed.includes(other.name) || !validated.current.has(other.name)) continue;
      if (!other.dependencies?.some((dep) => changed.includes(dep))) continue;
      if (isHidden(other, source)) continue;
      void validateField(other, source);
    }
  };

  const setValue = (field: FormField, value: unknown) => {
    const next = setIn(valuesRef.current, field.name, value);
    valuesRef.current = next;
    if (valuesProp === undefined) setInnerValues(next);
    onValuesChange?.(next, field.name);
    revalidateDependents([field.name], next);
    const type = field.type ?? "text";
    // A field that has had an error is re-validated right after a change; so is validateOn=change, or a select-type control (which has no "leave" action)
    if (
      errors[field.name] ||
      validateOn === "change" ||
      (validateOn === "blur" && CHANGE_VALIDATED.has(type))
    ) {
      void validateField(field, next);
    }
  };

  const focusField = (name: string) => {
    focusFirstIn(rootRef.current?.querySelector(`[data-field-name="${CSS.escape(name)}"]`) ?? null);
  };

  const validate = async (name?: string): Promise<boolean> => {
    const snapshot = valuesRef.current;
    const targets = fields.filter(
      (f) => !isHidden(f, snapshot) && (name === undefined || f.name === name),
    );
    const results = await Promise.all(targets.map((f) => check(f, snapshot)));
    for (const f of targets) validated.current.add(f.name);
    setErrorsState((prev) => {
      const next = name === undefined ? {} : { ...prev };
      targets.forEach((f, i) => {
        if (results[i]) next[f.name] = results[i]!;
        else delete next[f.name];
      });
      return next;
    });
    return results.every((r) => !r);
  };

  const submit = async (): Promise<boolean> => {
    if (submittingRef.current) return false;
    const snapshot = valuesRef.current;
    const targets = fields.filter((f) => !isHidden(f, snapshot));
    const results = await Promise.all(targets.map((f) => check(f, snapshot)));
    for (const f of targets) validated.current.add(f.name);
    const found: Record<string, string> = {};
    targets.forEach((f, i) => {
      if (results[i]) found[f.name] = results[i]!;
    });
    setErrorsState(found);
    const first = targets.find((f) => found[f.name]);
    if (first) {
      focusField(first.name);
      onInvalid?.(found);
      return false;
    }
    let payload: FormValues = {};
    for (const f of targets) payload = setIn(payload, f.name, read(f, snapshot));
    if (onSubmit) {
      submittingRef.current = true;
      setSubmitting(true);
      try {
        await onSubmit(payload);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
    return true;
  };

  const reset = () => {
    const initial = buildInitial(fields, defaultValues);
    valuesRef.current = initial;
    if (valuesProp === undefined) setInnerValues(initial);
    setErrorsState({});
    tokens.current = {};
    validated.current = new Set();
    onReset?.();
  };

  useImperativeHandle(instanceRef, () => ({
    submit,
    validate,
    reset,
    getValues: () => valuesRef.current,
    setValues: (patch) => {
      let next = valuesRef.current;
      for (const [key, value] of Object.entries(patch)) next = setIn(next, key, value);
      valuesRef.current = next;
      if (valuesProp === undefined) setInnerValues(next);
      revalidateDependents(Object.keys(patch), next);
    },
    setErrors: (map) => setErrorsState(map),
    focus: focusField,
  }));

  const onBlurItem = (field: FormField, event: FocusEvent<HTMLElement>) => {
    // Focus merely moving within the same field (e.g. a Select's trigger and popup) does not count as leaving
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    if (validateOn !== "submit") void validateField(field);
  };

  const renderControl = (field: FormField): ReactNode => {
    const type = field.type ?? "text";
    const value = read(field);
    const fieldDisabled = disabled || resolve(field.disabled, values, false);
    const invalid = !!(errors[field.name] ?? externalErrors?.[field.name]);
    const onChange = (next: unknown) => setValue(field, next);
    const ariaLabel = typeof field.label === "string" ? field.label : undefined;
    const extra = (field.props ?? {}) as Record<string, unknown>;
    const options = field.options ?? [];

    switch (type) {
      case "textarea":
        return (
          <Textarea
            name={field.name}
            value={asText(value)}
            onValueChange={onChange}
            placeholder={field.placeholder}
            fullWidth
            {...extra}
          />
        );
      case "number":
        return (
          <NumberField
            name={field.name}
            value={(value as number | null) ?? null}
            onValueChange={onChange}
            placeholder={field.placeholder}
            fullWidth
            {...extra}
          />
        );
      case "select":
        return (
          <Select
            name={field.name}
            options={[...options]}
            value={(value as string | null) ?? null}
            onValueChange={onChange}
            placeholder={field.placeholder}
            aria-label={ariaLabel}
            fullWidth
            {...extra}
          />
        );
      case "radio":
        return (
          <RadioGroup
            name={field.name}
            value={(value as string | null) ?? null}
            onValueChange={onChange}
            {...extra}
          >
            {options.map((o) => (
              <Radio key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </Radio>
            ))}
          </RadioGroup>
        );
      case "checkbox":
        return (
          <Checkbox name={field.name} checked={!!value} onCheckedChange={onChange} {...extra}>
            {field.label}
          </Checkbox>
        );
      case "checkbox-group":
        return (
          <CheckboxGroup value={(value as string[]) ?? []} onValueChange={onChange} {...extra}>
            {options.map((o) => (
              <Checkbox key={o.value} name={field.name} value={o.value} disabled={o.disabled}>
                {o.label}
              </Checkbox>
            ))}
          </CheckboxGroup>
        );
      case "switch":
        return (
          <Switch name={field.name} checked={!!value} onCheckedChange={onChange} {...extra}>
            {field.label}
          </Switch>
        );
      case "slider":
        return (
          <Slider
            value={value as number | number[]}
            onValueChange={onChange}
            aria-label={ariaLabel}
            {...extra}
          />
        );
      case "rating":
        return (
          <Rating
            value={(value as number) ?? 0}
            onValueChange={onChange}
            aria-label={ariaLabel}
            {...extra}
          />
        );
      case "date":
        return (
          <DatePicker
            value={(value ?? null) as never}
            onValueChange={onChange as never}
            placeholder={field.placeholder}
            aria-label={ariaLabel}
            fullWidth
            {...extra}
          />
        );
      case "time":
        return (
          <TimePicker
            name={field.name}
            value={(value as string | null) ?? null}
            onValueChange={onChange}
            placeholder={field.placeholder}
            aria-label={ariaLabel}
            fullWidth
            {...extra}
          />
        );
      case "datetime":
        return (
          <DatePicker
            value={(value ?? null) as never}
            onValueChange={onChange as never}
            placeholder={field.placeholder}
            aria-label={ariaLabel}
            fullWidth
            {...{ showTime: true, ...extra }}
          />
        );
      case "segmented":
        return (
          <Segmented
            options={options.map((o) => ({ value: o.value, label: o.label, disabled: o.disabled }))}
            value={(value as string | undefined) ?? undefined}
            onValueChange={onChange}
            aria-label={ariaLabel}
            {...extra}
          />
        );
      case "custom":
        return field.render?.({
          value,
          onChange,
          onBlur: () => {
            if (validateOn !== "submit") void validateField(field);
          },
          invalid,
          disabled: fieldDisabled,
          field,
        });
      default:
        return (
          <Input
            name={field.name}
            type={type}
            value={asText(value)}
            onValueChange={onChange}
            placeholder={field.placeholder}
            fullWidth
            {...extra}
          />
        );
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Errors thrown during submit are not swallowed: rethrown on the next tick so global error reporting can see them
    submit().catch((error: unknown) => {
      setTimeout(() => {
        throw error;
      });
    });
  };

  const cols = Math.max(1, Math.min(Math.round(columns), MAX_COLUMNS));
  return (
    <form
      ref={rootRef}
      id={id}
      noValidate
      data-slot="form"
      data-layout={layout}
      data-columns={cols}
      aria-busy={submitting || undefined}
      onSubmit={handleSubmit}
      onReset={(event) => {
        event.preventDefault();
        reset();
      }}
    >
      <div data-slot="form-fields">
        {visible.map((field) => {
          const type = field.type ?? "text";
          const error = errors[field.name] ?? externalErrors?.[field.name];
          const fieldDisabled = disabled || resolve(field.disabled, values, false);
          const ownLabel = type === "checkbox" || type === "switch"; // these two carry their own text
          return (
            <div
              key={field.name}
              data-slot="form-item"
              data-field-name={field.name}
              data-span={Math.max(1, Math.min(Math.round(field.span ?? 1), cols))}
              onBlur={(event) => onBlurItem(field, event)}
            >
              <Field
                name={field.name}
                invalid={!!error}
                disabled={fieldDisabled}
                required={!!field.required}
                variant={variant}
                size={size}
              >
                {field.label && !ownLabel ? <Field.Label>{field.label}</Field.Label> : null}
                {renderControl(field)}
                {field.description ? (
                  <Field.Description>{field.description}</Field.Description>
                ) : null}
                {error ? <Field.Error match>{error}</Field.Error> : null}
              </Field>
            </div>
          );
        })}
      </div>
      {actions === false ? null : actions !== undefined ? (
        <div data-slot="form-actions">{actions}</div>
      ) : (
        <div data-slot="form-actions">
          {resetLabel ? (
            <Button
              type="reset"
              variant="outline"
              color="neutral"
              disabled={submitting || disabled}
            >
              {resetLabel}
            </Button>
          ) : null}
          <Button type="submit" color="primary" loading={submitting} disabled={disabled}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
