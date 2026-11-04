import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface WatermarkFont {
  /** Text color; if omitted, the current text color of the content area is used, faded to 15% opacity (works in both light and dark). */
  color?: string;
  /** Font size in px, default 16. */
  fontSize?: number;
  /** CSS font weight (e.g. 600 or "bold"), default "normal". */
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic";
  /** CSS font family; the content area's font if omitted. */
  fontFamily?: string;
}

export interface WatermarkProps {
  /** Watermark text; an array means multiple lines. */
  content?: string | readonly string[];
  /** Image URL; when given, the image is drawn (text is no longer drawn). Use a same-origin or CORS-enabled image, otherwise it cannot be drawn. */
  image?: string;
  /** Width and height (pixels) of each watermark. For text, sized by the text if omitted; images default to 120 × 64. */
  width?: number;
  /** Height (pixels) of each watermark; see `width`. */
  height?: number;
  /**
   * Rotation angle.
   * @default -22
   */
  rotate?: number;
  /**
   * Horizontal / vertical gap between watermarks.
   * @default [100, 100]
   */
  gap?: readonly [number, number];
  /**
   * Overall offset.
   * @default [0, 0]
   */
  offset?: readonly [number, number];
  /** Text style of a text watermark: `{ color, fontSize, fontWeight, fontStyle, fontFamily }`. Without `color` it takes the content's text color faded to 15%, which works in light and dark. */
  font?: WatermarkFont;
  /**
   * z-index of the watermark layer (above the content but below overlays).
   * @default 9
   */
  zIndex?: number;
  /**
   * Automatically restore the watermark layer when it is removed or its attributes are changed.
   * @default true
   */
  antiTamper?: boolean;
  children?: ReactNode;
}

const DEFAULT_GAP = [100, 100] as const;
const DEFAULT_OFFSET = [0, 0] as const;

interface Tile {
  url: string;
  /** CSS pixel size of the tile (it contains two staggered watermarks). */
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Draws one tile: two watermarks staggered along the diagonal (checkerboard), so the tiling does not look rigidly row by row.
 * Returns null when it cannot draw (no canvas, image failed to load), and the watermark layer is not shown.
 */
async function drawTile(
  host: HTMLElement,
  opts: Required<Pick<WatermarkProps, "rotate">> &
    Pick<WatermarkProps, "content" | "image" | "width" | "height" | "font"> & {
      gap: readonly [number, number];
    },
): Promise<Tile | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const ratio = window.devicePixelRatio || 1;
  const computed = getComputedStyle(host);
  const font = opts.font ?? {};
  const fontSize = font.fontSize ?? 16;
  const fontFamily = font.fontFamily ?? computed.fontFamily ?? "sans-serif";
  const fontSpec = `${font.fontStyle ?? "normal"} ${font.fontWeight ?? "normal"} ${fontSize}px ${fontFamily}`;
  const lines = opts.image
    ? []
    : (typeof opts.content === "string" ? [opts.content] : [...(opts.content ?? [])]).filter(
        (line) => line !== "",
      );

  let img: HTMLImageElement | null = null;
  let markW: number;
  let markH: number;
  if (opts.image) {
    img = await loadImage(opts.image);
    if (!img) return null;
    markW = opts.width ?? 120;
    markH = opts.height ?? 64;
  } else {
    if (lines.length === 0) return null;
    ctx.font = fontSpec;
    const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
    markW = opts.width ?? Math.ceil(widest);
    markH = opts.height ?? Math.ceil(lines.length * fontSize * 1.2);
  }

  const unitW = markW + opts.gap[0];
  const unitH = markH + opts.gap[1];
  canvas.width = unitW * 2 * ratio;
  canvas.height = unitH * 2 * ratio;
  ctx.scale(ratio, ratio);

  const drawMark = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((Math.PI / 180) * opts.rotate);
    if (img) {
      ctx.drawImage(img, -markW / 2, -markH / 2, markW, markH);
    } else {
      ctx.font = fontSpec;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (font.color) {
        ctx.fillStyle = font.color;
      } else {
        ctx.fillStyle = computed.color;
        ctx.globalAlpha = 0.15;
      }
      const lineHeight = fontSize * 1.2;
      lines.forEach((line, i) => {
        ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineHeight);
      });
    }
    ctx.restore();
  };
  drawMark(unitW / 2, unitH / 2);
  drawMark(unitW * 1.5, unitH * 1.5);
  return { url: canvas.toDataURL(), width: unitW * 2, height: unitH * 2 };
}

/**
 * Watermark: overlays repeated semi-transparent text or an image on its `children` without blocking the mouse, e.g. to mark confidential pages with the user's name.
 * `content` is the text (an array for several lines) or `image` an image URL; `rotate`, `gap`, `offset`, `width` / `height` and `font` tune the pattern.
 * `antiTamper` (on by default) restores the layer if it is removed or edited in devtools. The default text color follows the content's text color, so it works in light and dark.
 *
 * Theme style: the pattern is a bitmap drawn with canvas, used as the watermark layer's background;
 * it is a dynamic value, so the component writes no style: a ref sets it as --wm-image / --wm-w / --wm-h / --wm-ox / --wm-oy / --wm-z on the watermark layer,
 * and the theme style handles position and background. It is redrawn when the colour theme or theme style switches (html attribute changes), so the default text color works in both light and dark.
 */
export function Watermark({
  content,
  image,
  width,
  height,
  rotate = -22,
  gap = DEFAULT_GAP,
  offset = DEFAULT_OFFSET,
  font,
  zIndex = 9,
  antiTamper = true,
  children,
}: WatermarkProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [tile, setTile] = useState<Tile | null>(null);
  const [theme, setTheme] = useState(0); // bumped when the theme / theme style changes, to redraw
  const contentKey = typeof content === "string" ? content : (content ?? []).join("\n");
  const fontKey = JSON.stringify(font ?? {});

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme((n) => n + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-theme-style",
        "data-mode",
        "data-theme-color",
        "data-theme-density",
        "class",
      ],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = rootRef.current;
    if (!host) return;
    let cancelled = false;
    void drawTile(host, { content, image, width, height, rotate, gap, font })
      .catch(() => null) // if canvas fails (disabled, too large) there is no watermark, and nothing is thrown to the page
      .then((next) => {
        if (!cancelled) setTile(next);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey, image, width, height, rotate, gap[0], gap[1], fontKey, theme]);

  // The watermark layer is not managed by React: it may be removed directly from the DOM externally, and React unmounting a node that is no longer there later would throw.
  // So it is created imperatively here, variables are written and it is attached to the root; if removed or modified (tamper protection), a new one is created.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !tile) return;
    let layer: HTMLElement | null = null;
    const apply = (el: HTMLElement) => {
      el.style.setProperty("--wm-image", `url("${tile.url}")`);
      el.style.setProperty("--wm-w", String(tile.width));
      el.style.setProperty("--wm-h", String(tile.height));
      el.style.setProperty("--wm-ox", String(offset[0]));
      el.style.setProperty("--wm-oy", String(offset[1]));
      el.style.setProperty("--wm-z", String(zIndex));
    };
    const mount = () => {
      layer?.remove();
      layer = document.createElement("div");
      layer.setAttribute("data-slot", "watermark-layer");
      layer.setAttribute("aria-hidden", "true");
      apply(layer);
      root.appendChild(layer);
      observer?.observe(layer, { attributes: true });
    };
    const observer = antiTamper
      ? new MutationObserver(() => {
          if (
            !layer ||
            !root.contains(layer) ||
            layer.getAttribute("data-slot") !== "watermark-layer"
          ) {
            mount();
          } else {
            // Attributes were modified: clear the extra attributes and the whole style, and rewrite our variables
            for (const name of Array.from(layer.attributes, (attr) => attr.name)) {
              if (name !== "data-slot" && name !== "aria-hidden") layer.removeAttribute(name);
            }
            apply(layer);
          }
          observer?.takeRecords(); // our own change doesn't count
        })
      : null;
    observer?.observe(root, { childList: true });
    mount();
    observer?.takeRecords();
    return () => {
      observer?.disconnect();
      layer?.remove();
    };
  }, [tile, antiTamper, offset[0], offset[1], zIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={rootRef} data-slot="watermark">
      {children}
    </div>
  );
}
