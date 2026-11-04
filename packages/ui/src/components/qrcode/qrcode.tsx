import { useLayoutEffect, useMemo, useRef } from "react";
import { Button } from "../button/index.ts";
import { encodeQR } from "./qr.ts";
import type { QRErrorLevel } from "./qr.ts";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

export type QRCodeStatus = "active" | "loading" | "expired" | "scanned";

export interface QRCodeProps {
  /** Text to encode (usually a URL); nothing is drawn when it is too long for the largest version the error level allows. */
  value: string;
  /**
   * Side length of the whole component (pixels, including border and padding, consistent with antd); the QR code itself is that minus the border and padding.
   * @default 160
   */
  size?: number;
  /**
   * Color of dark modules. Scanning is sensitive to contrast ratio, so when changing colors keep dark on a light background.
   * @default "black"
   */
  color?: string;
  /**
   * Background color.
   * @default "white"
   */
  bgColor?: string;
  /** Error correction level, default M; H when an icon is set and none is specified (the icon covers part of the middle). */
  errorLevel?: QRErrorLevel;
  /** Small icon in the middle (image URL). */
  icon?: string;
  /** Icon side length (pixels, scaled relative to the side length of the whole component), default 1/5 of size. */
  iconSize?: number;
  /**
   * With border and padding (look decided by the theme style).
   * @default true
   */
  bordered?: boolean;
  /**
   * Status: loading shows a spinner, expired shows an expiry notice with a refresh button, scanned shows a scanned notice.
   * @default "active"
   */
  status?: QRCodeStatus;
  /** Callback when "Refresh" is clicked, usually to fetch a new QR code link. */
  onRefresh?: () => void;
  /** Status notice text, used when switching language. */
  labels?: Partial<QRCodeLabels>;
  /** Accessible name, when there is no visible label. */
  "aria-label"?: string;
}

/** Status notice text. */
export interface QRCodeLabels {
  expired: string;
  refresh: string;
  scanned: string;
}

/** Row by row, merge adjacent dark modules into a horizontal line, so the whole QR code is a single path, small in size and sharp when scaled up. */
function modulesPath(modules: boolean[][]): string {
  const parts: string[] = [];
  modules.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      if (!row[x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < row.length && row[end]) end++;
      parts.push(`M${x} ${y}h${end - x}v1h-${end - x}z`);
      x = end;
    }
  });
  return parts.join("");
}

/**
 * QR code that encodes a string (usually a URL) as a scannable SVG image, sharp at any scale and rendered on the server too.
 * `value` is the text, `size` the side length in px, `icon` an image URL placed in the middle (raises the error level to H).
 * `status` shows loading / expired / scanned overlays; with "expired" a refresh button calls `onRefresh`, so a login QR can be renewed.
 * `color` / `bgColor` are functional scanning colors and do not follow the theme: black on white by default has the most reliable contrast (white background in dark themes too).
 * When `value` is too long for the largest version the error level allows, nothing is drawn.
 *
 * Theme style: the encoding is implemented in qr.ts with no library dependency; the root carries `--qr-bg` / `--qr-size`, and when nothing can be drawn it is marked data-error.
 */
export function QRCode({
  value,
  size = 160,
  color = "black",
  bgColor = "white",
  errorLevel,
  icon,
  iconSize,
  bordered = true,
  status = "active",
  onRefresh,
  labels: labelsProp,
  ...aria
}: QRCodeProps) {
  const config = useConfig();
  const labels = { ...en.labels.qrcode, ...config.labels?.qrcode, ...labelsProp };
  const level = errorLevel ?? (icon ? "H" : "M");
  const rootRef = useRef<HTMLDivElement>(null);

  const matrix = useMemo(() => {
    try {
      return encodeQR(value, level);
    } catch {
      return null;
    }
  }, [value, level]);
  const path = useMemo(() => (matrix ? modulesPath(matrix.modules) : ""), [matrix]);

  // The ring of border padding must have the same background as the QR code; sizes are also dynamic values: write them all as variables and read them in the theme style
  useLayoutEffect(() => {
    rootRef.current?.style.setProperty("--qr-bg", bgColor);
    rootRef.current?.style.setProperty("--qr-size", String(size));
  }, [bgColor, size]);

  const iconNode = (() => {
    if (!icon || !matrix) return null;
    const px = iconSize ?? size / 5;
    const side = (px / size) * matrix.size;
    const at = (matrix.size - side) / 2;
    const pad = side * 0.08;
    return (
      <>
        <rect
          data-slot="qrcode-icon-bg"
          x={at - pad}
          y={at - pad}
          width={side + pad * 2}
          height={side + pad * 2}
          rx={side * 0.12}
          fill={bgColor}
        />
        <image data-slot="qrcode-icon" href={icon} x={at} y={at} width={side} height={side} />
      </>
    );
  })();

  return (
    <div
      ref={rootRef}
      data-slot="qrcode"
      data-bordered={bordered ? "" : undefined}
      data-status={status}
      data-error={matrix ? undefined : ""}
    >
      {matrix ? (
        <svg
          data-slot="qrcode-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${matrix.size} ${matrix.size}`}
          shapeRendering="crispEdges"
          // role="img" goes on the graphic rather than the shell: the overlay contains a focusable "Refresh" button, which must not be nested inside an img
          role="img"
          aria-label={aria["aria-label"] ?? "QR code"}
        >
          <rect
            data-slot="qrcode-background"
            width={matrix.size}
            height={matrix.size}
            fill={bgColor}
          />
          <path data-slot="qrcode-modules" d={path} fill={color} />
          {iconNode}
        </svg>
      ) : (
        <span data-slot="qrcode-empty" role="img" aria-label={aria["aria-label"] ?? "QR code"} />
      )}
      {status !== "active" ? (
        <div data-slot="qrcode-mask" data-status={status}>
          {status === "loading" ? (
            <svg data-slot="qrcode-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path
                d="M12 3a9 9 0 0 1 9 9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <>
              <span data-slot="qrcode-status">
                {status === "expired" ? labels.expired : labels.scanned}
              </span>
              {status === "expired" ? (
                <Button variant="ghost" color="primary" onClick={onRefresh}>
                  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
                    <path
                      d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {labels.refresh}
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
