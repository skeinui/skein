/** Form values are plain objects, and field names support dot paths ("address.city") for nesting. */
export type FormValues = Record<string, unknown>;

export function getIn(values: FormValues, path: string): unknown {
  let current: unknown = values;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/** Does not mutate the original object: copies each level along the path and puts the new value at the end. */
export function setIn(values: FormValues, path: string, value: unknown): FormValues {
  const keys = path.split(".");
  const walk = (node: unknown, i: number): unknown => {
    const copy: Record<string, unknown> =
      node !== null && typeof node === "object" ? { ...(node as Record<string, unknown>) } : {};
    const key = keys[i]!;
    copy[key] = i === keys.length - 1 ? value : walk(copy[key], i + 1);
    return copy;
  };
  return walk(values, 0) as FormValues;
}

/** "Empty": undefined / null / empty string / empty array / false (unchecked checkbox) / both ends of a range selection empty. */
export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "" || value === false) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    const range = value as { start?: unknown; end?: unknown };
    if ("start" in range || "end" in range) return !range.start && !range.end;
  }
  return false;
}
