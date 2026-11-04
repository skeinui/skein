const SAFE_LINK = /^(?:https?:|mailto:|tel:)/i;

/** Links only allow http(s) / mailto / tel and relative addresses without a protocol; anything like javascript: is rejected. */
export function isSafeUrl(url: string, kind: "link" | "image" = "link"): boolean {
  // oxlint-disable-next-line no-control-regex -- control characters are stripped on purpose ("java\tscript:")
  const u = url.trim().replace(/[\u0000-\u001f\u007f\s]+/g, "");
  if (u === "") return false;
  if (kind === "image") return /^https?:/i.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u);
  return SAFE_LINK.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u);
}
