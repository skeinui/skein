import type { ComponentPropsWithoutRef } from "react";
import type { SkeletonShape, UIRadius, UISize } from "../../contract.ts";

export interface SkeletonProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "className" | "style" | "children"
> {
  /**
   * text: one line of text high; circle: a perfect circle (avatar); rect: a block that fills its parent, sized by the parent.
   * Callers cannot set width or height directly (there is no style entry point); to set a size, put the Skeleton inside a sized container.
   * @default "text"
   */
  shape?: SkeletonShape;
  /**
   * Size step: the line height of text / the diameter of a circle.
   * @default "md"
   */
  size?: UISize;
  /** Corner radius; the theme style decides when it is not passed. */
  radius?: UIRadius;
  /**
   * Number of lines when shape is text; the last line is shorter.
   * @default 1
   */
  lines?: number;
}

/**
 * Skeleton: a grey placeholder in the shape of content that is still loading (`shape` text / rect / circle; `lines` of text).
 * Render it in place of the content until the data arrives. For a small spinning indicator use Spinner.
 *
 * Theme style: the animation is decided by the theme style and stops when prefers-reduced-motion is on.
 */
export function Skeleton({
  shape = "text",
  size = "md",
  radius,
  lines = 1,
  ...rest
}: SkeletonProps) {
  if (shape === "text" && lines > 1) {
    return (
      <div {...rest} data-slot="skeleton-group" aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            data-slot="skeleton"
            data-shape="text"
            data-size={size}
            data-radius={radius}
            data-last={i === lines - 1 ? "" : undefined}
          />
        ))}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      {...rest}
      data-slot="skeleton"
      data-shape={shape}
      data-size={size}
      data-radius={radius}
    />
  );
}
