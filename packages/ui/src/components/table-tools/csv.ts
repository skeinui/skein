/** What a table export is: the file's name, the header row and the rows. */
export interface CsvData {
  filename: string;
  headers: readonly string[];
  rows: readonly (readonly unknown[])[];
}

/** `rows` as CSV text. A text a spreadsheet would run as a formula (`=`, `+`, `-`, `@` first) is made plain text; numbers stay numbers. */
export function toCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const cell = (value: unknown) => {
    let text =
      typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
          ? String(value)
          : typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : "";
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}

/** Downloads `rows` as a CSV file: UTF-8 with a byte order mark, which Excel needs to read Chinese. Call it from an event handler. */
export function downloadCsv(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", toCsv(headers, rows)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
