import { isEmpty } from "./values.ts";
import type { FormValues } from "./values.ts";

/** Validation message text. {n} is replaced by the number in the rule; Form takes them from the locale (ConfigProvider), `messages` of Form replaces any of them. */
export interface FormMessages {
  /** Shown when a `required` field is empty. */
  required: string;
  /** Text / list shorter than `minLength`; {n} is the minimum. */
  minLength: string;
  /** Text / list longer than `maxLength`; {n} is the maximum. */
  maxLength: string;
  /** Number below `min`; {n} is the minimum. */
  min: string;
  /** Number above `max`; {n} is the maximum. */
  max: string;
  /** Text not matching `pattern`. */
  pattern: string;
  /** Text that is not an email address (`format: "email"`). */
  email: string;
  /** Text that is not an http(s) URL (`format: "url"`). */
  url: string;
}

export const DEFAULT_MESSAGES: FormMessages = {
  required: "This field is required",
  minLength: "Must be at least {n} characters",
  maxLength: "Must be at most {n} characters",
  min: "Must be at least {n}",
  max: "Must be at most {n}",
  pattern: "Invalid format",
  email: "Enter a valid email address",
  url: "Enter a valid URL",
};

export interface ValidationRules {
  /** true uses the default message; a string is used as the message. */
  required?: boolean | string;
  /** Built-in format checks: email / url. */
  format?: "email" | "url";
  /** Minimum length of a text value (characters) or of a list value (items). */
  minLength?: number;
  /** Maximum length of a text value (characters) or of a list value (items). */
  maxLength?: number;
  /** Minimum of a number value. */
  min?: number;
  /** Maximum of a number value. */
  max?: number;
  /** Regular expression a text value must match (a string is compiled with `new RegExp`; g / y flags are ignored). */
  pattern?: RegExp | string;
  /**
   * Custom validation: returning error text means failure, returning undefined / an empty string means pass; may be async.
   * The second argument is the current values of the whole form (e.g. "confirm password" must be compared with "password").
   */
  validate?: (
    value: unknown,
    values: FormValues,
  ) => string | undefined | void | Promise<string | undefined | void>;
  /** Per-field message overrides for the built-in rules (on top of Form's `messages`). */
  messages?: Partial<FormMessages>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const fill = (template: string, n: number) => template.replace("{n}", String(n));

/**
 * Validate a value, returning the first failing message, or undefined if it passes.
 * Order: required → format → length → size → regex → custom. When empty (and not required) the built-in rules above are skipped, but custom validation is still called.
 */
export async function validateValue(
  value: unknown,
  values: FormValues,
  rules: ValidationRules,
  base: FormMessages = DEFAULT_MESSAGES,
): Promise<string | undefined> {
  const messages = { ...base, ...rules.messages };
  const empty = isEmpty(value);

  // A text of only spaces is no answer to a required field (it still is a value for the other rules)
  const blank = typeof value === "string" && value.trim() === "";
  if (rules.required && (empty || blank)) {
    return typeof rules.required === "string" ? rules.required : messages.required;
  }
  if (!empty) {
    const text = typeof value === "string" ? value : undefined;
    if (rules.format === "email" && text !== undefined && !EMAIL.test(text)) return messages.email;
    if (rules.format === "url" && text !== undefined && !isUrl(text)) return messages.url;

    const length =
      text !== undefined ? text.length : Array.isArray(value) ? value.length : undefined;
    if (length !== undefined) {
      if (rules.minLength !== undefined && length < rules.minLength) {
        return fill(messages.minLength, rules.minLength);
      }
      if (rules.maxLength !== undefined && length > rules.maxLength) {
        return fill(messages.maxLength, rules.maxLength);
      }
    }

    if (typeof value === "number") {
      if (rules.min !== undefined && value < rules.min) return fill(messages.min, rules.min);
      if (rules.max !== undefined && value > rules.max) return fill(messages.max, rules.max);
    }

    if (rules.pattern !== undefined && text !== undefined) {
      const regex = typeof rules.pattern === "string" ? new RegExp(rules.pattern) : rules.pattern;
      // A regex with the g / y flag has lastIndex state, so copy it before testing
      if (!new RegExp(regex.source, regex.flags.replace(/[gy]/g, "")).test(text))
        return messages.pattern;
    }
  }

  const custom = await rules.validate?.(value, values);
  return custom ? custom : undefined;
}
