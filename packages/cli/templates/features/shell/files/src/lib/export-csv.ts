/** Downloads `rows` as a CSV file: UTF-8 with a byte order mark, which Excel needs to read Chinese. */
export function downloadCsv(
  filename: string,
  header: readonly string[],
  rows: readonly (readonly unknown[])[],
) {
  // A text a spreadsheet would run as a formula (=, +, -, @ first) is made plain text; numbers stay numbers
  const cell = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const lines = [header, ...rows].map((row) => row.map(cell).join(","));
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
