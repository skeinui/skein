/** Generate the page number list: first and last pages, siblings pages on each side of the current page, with "ellipsis" as a placeholder in between; the total length is fixed, so it does not jump when paging. */
export function getPageItems(
  page: number,
  pageCount: number,
  siblings = 1,
): (number | "ellipsis")[] {
  const slots = siblings * 2 + 5;
  if (pageCount <= slots) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, pageCount);
  const showLeft = left > 2;
  const showRight = right < pageCount - 1;
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (!showLeft && showRight) {
    return [...range(1, siblings * 2 + 3), "ellipsis", pageCount];
  }
  if (showLeft && !showRight) {
    return [1, "ellipsis", ...range(pageCount - (siblings * 2 + 2), pageCount)];
  }
  return [1, "ellipsis", ...range(left, right), "ellipsis", pageCount];
}
