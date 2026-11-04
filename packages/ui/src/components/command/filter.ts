/** Score a command can get: 0 means no match, larger ranks higher. */
export function score(query: string, label: string, keywords: readonly string[] = []): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const text = label.toLowerCase();
  if (text === q) return 100;
  if (text.startsWith(q)) return 80;
  // Word-start match: "new file" gets the earlier weight when hit by "nf" or "file"
  if (text.split(/[\s\-_/]+/).some((word) => word.startsWith(q))) return 60;
  if (text.includes(q)) return 40;
  if (keywords.some((k) => k.toLowerCase().includes(q))) return 30;
  // Subsequence: letters appearing in order count ("ntf" matches "New Tab Foo")
  let i = 0;
  for (const ch of text) if (ch === q[i]) i++;
  return i === q.length ? 10 : 0;
}
