/**
 * Caret position in the viewport: use an invisible mirror div to copy the input's layout, put the text before the caret into it,
 * put a marker span at the end, and measure its position. Used as an anchor for the overlay.
 */
const MIRRORED = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "fontVariant",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "textIndent",
  "tabSize",
] as const;

export function caretRect(field: HTMLInputElement | HTMLTextAreaElement, index: number): DOMRect {
  const fieldRect = field.getBoundingClientRect();
  const doc = field.ownerDocument;
  const style = doc.defaultView?.getComputedStyle(field);
  if (!style) return fieldRect;
  const multiline = field instanceof HTMLTextAreaElement;
  const mirror = doc.createElement("div");
  for (const key of MIRRORED) mirror.style[key] = style[key];
  Object.assign(mirror.style, {
    position: "absolute",
    visibility: "hidden",
    top: "0",
    left: "-9999px",
    overflow: "hidden",
    whiteSpace: multiline ? "pre-wrap" : "pre",
    overflowWrap: multiline ? "break-word" : "normal",
  });
  mirror.textContent = field.value.slice(0, index);
  const marker = doc.createElement("span");
  marker.textContent = field.value.slice(index) || ".";
  mirror.appendChild(marker);
  doc.body.appendChild(mirror);
  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;
  const x = marker.offsetLeft - field.scrollLeft;
  const y = marker.offsetTop - field.scrollTop;
  mirror.remove();
  return new DOMRect(fieldRect.left + x, fieldRect.top + y, 0, lineHeight);
}
