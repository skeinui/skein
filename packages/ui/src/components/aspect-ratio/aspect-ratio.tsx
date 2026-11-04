import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type { UIRadius } from "../../contract.ts";

export interface AspectRatioProps {
  /**
   * Width / height: 16 / 9, 1, 4 / 3... can also be a string like "16/9".
   * @default 1
   */
  ratio?: number | string;
  /** Border radius, none by default. */
  radius?: UIRadius;
  children?: ReactNode;
}

const toNumber = (ratio: number | string) => {
  if (typeof ratio === "number") return ratio;
  const [w, h] = ratio.split("/").map((part) => Number(part.trim()));
  return h ? w! / h : (w ?? 1);
};

/**
 * AspectRatio: a box that keeps a fixed width-to-height ratio; the width fills the parent and the height follows from `ratio`.
 * The content inside (image, video, map, placeholder) fills it, so there is no need to set a height. `ratio` is a number
 * (16 / 9) or a string ("16/9"), `radius` rounds the corners. For an image with loading / fallback / preview use Image.
 *
 * Theme style: the ratio is written as the CSS variable --ar-ratio; the layout and cropping live in the theme style.
 */
export function AspectRatio({ ratio = 1, radius, children }: AspectRatioProps) {
  const ref = useRef<HTMLDivElement>(null);
  const value = toNumber(ratio);
  useEffect(() => {
    ref.current?.style.setProperty(
      "--ar-ratio",
      String(Number.isFinite(value) && value > 0 ? value : 1),
    );
  }, [value]);
  return (
    <div ref={ref} data-slot="aspect-ratio" data-radius={radius}>
      {children}
    </div>
  );
}
