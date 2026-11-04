import { createContext, useContext, useEffect, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Tooltip } from "../tooltip/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export type FloatButtonShape = "circle" | "square";
export type FloatButtonVariant = "default" | "primary";
export type FloatButtonCorner = "bottom-end" | "bottom-start" | "top-end" | "top-start";

const GroupContext = createContext<{ shape: FloatButtonShape } | null>(null);

export interface FloatButtonProps extends Without<ComponentPropsWithoutRef<"button">> {
  /** Icon. When there is only an icon and no `label`, `aria-label` is required. */
  icon?: ReactNode;
  /** Text below the icon (only a square button has room for it; a circular button omits it). */
  label?: ReactNode;
  /** If given, rendered as a link `<a>`. */
  href?: string;
  /** Circle or square. Inside a `FloatButton.Group` it defaults to the Group's shape, otherwise to circle. */
  shape?: FloatButtonShape;
  /**
   * default has a white background (follows the theme style's overlay color), primary has a primary-color background.
   * @default "default"
   */
  variant?: FloatButtonVariant;
  /** Description bubble that appears on the left on hover. */
  tooltip?: ReactNode;
  /**
   * Which corner of the viewport it is fixed to; the margins come from the theme style. Inside a `FloatButton.Group`
   * the Group decides the position.
   * @default "bottom-end"
   */
  corner?: FloatButtonCorner;
}

/**
 * Floating button: a circular / square button fixed at a corner of the viewport, holding global actions (back to top, support, create).
 * Its position uses the theme style's margins and does not accept arbitrary pixels; use `FloatButton.Group` to stack several vertically, and `FloatButton.BackTop` for back to top.
 */
function FloatButtonRoot({
  icon,
  label,
  href,
  shape: shapeProp,
  variant = "default",
  tooltip,
  corner = "bottom-end",
  children,
  ...rest
}: FloatButtonProps) {
  const group = useContext(GroupContext);
  const shape = shapeProp ?? group?.shape ?? "circle";
  const common = {
    "data-slot": "floatbutton",
    "data-shape": shape,
    "data-variant": variant,
    "data-corner": group ? undefined : corner,
    "data-in-group": group ? "" : undefined,
    "data-has-label": label && shape === "square" ? "" : undefined,
  };
  const content = (
    <>
      {icon ? (
        <span data-slot="floatbutton-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {label && shape === "square" ? <span data-slot="floatbutton-label">{label}</span> : null}
      {children}
    </>
  );
  const element = href ? (
    <a {...(rest as ComponentPropsWithoutRef<"a">)} {...common} href={href}>
      {content}
    </a>
  ) : (
    <button type="button" {...rest} {...common}>
      {content}
    </button>
  );
  return tooltip ? (
    <Tooltip content={tooltip} side="left">
      {element}
    </Tooltip>
  ) : (
    element
  );
}

export interface FloatButtonGroupProps extends Without<ComponentPropsWithoutRef<"div">> {
  /**
   * The shape of every button in the group: circles keep a gap between them, squares are joined into one strip.
   * @default "circle"
   */
  shape?: FloatButtonShape;
  /**
   * Which corner of the viewport the group is fixed to.
   * @default "bottom-end"
   */
  corner?: FloatButtonCorner;
}

/** Stacks several floating buttons vertically (the Group sets the shape of the buttons uniformly). */
function FloatButtonGroup({
  shape = "circle",
  corner = "bottom-end",
  ...rest
}: FloatButtonGroupProps) {
  return (
    <GroupContext.Provider value={{ shape }}>
      <div
        role="group"
        {...rest}
        data-slot="floatbutton-group"
        data-shape={shape}
        data-corner={corner}
      />
    </GroupContext.Provider>
  );
}

const UpIcon = () => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" fill="none" aria-hidden="true">
    <path
      d="m3.5 9.5 4.5-4.5 4.5 4.5M8 5.5V13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface FloatButtonBackTopProps extends Omit<FloatButtonProps, "href"> {
  /**
   * Appears only after scrolling past this many pixels.
   * @default 400
   */
  visibilityHeight?: number;
  /** Which scroll container to listen on, defaults to the whole window. */
  target?: () => HTMLElement | null;
}

const reduced = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Back to top: appears only after scrolling past `visibilityHeight`, and one click smoothly scrolls back to the top (jumps directly when the OS requests reduced motion). */
function FloatButtonBackTop({
  visibilityHeight = 400,
  target,
  onClick,
  icon,
  "aria-label": ariaLabelProp,
  ...rest
}: FloatButtonBackTopProps) {
  const t = useLabels("floatButton");
  const ariaLabel = ariaLabelProp ?? t.backToTop;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = target?.() ?? null;
    const scroller: HTMLElement | Window = el ?? window;
    const top = () => (el ? el.scrollTop : window.scrollY || document.documentElement.scrollTop);
    const update = () => setVisible(top() >= visibilityHeight);
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    return () => scroller.removeEventListener("scroll", update);
  }, [target, visibilityHeight]);
  if (!visible) return null;
  return (
    <FloatButtonRoot
      {...rest}
      aria-label={ariaLabel}
      icon={icon ?? <UpIcon />}
      onClick={(event) => {
        const el = target?.() ?? null;
        (el ?? window).scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
        onClick?.(event);
      }}
    />
  );
}

export const FloatButton = Object.assign(FloatButtonRoot, {
  Group: FloatButtonGroup,
  BackTop: FloatButtonBackTop,
});
