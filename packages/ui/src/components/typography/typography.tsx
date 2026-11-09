import { createElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { LayoutTag, TextSize, TextTone } from "../../contract.ts";
import { copyToClipboard } from "./copy.ts";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

type Without<T> = Omit<T, "className" | "style">;

const MAX_ROWS = 10;

export interface EllipsisConfig {
  /** Maximum number of lines to show, default 1. */
  rows?: number;
  /** Show "expand / collapse" when truncated. */
  expandable?: boolean;
  defaultExpanded?: boolean;
  /** Called when the expand / collapse button is clicked, with the new expanded state. */
  onExpand?: (expanded: boolean) => void;
}

export interface CopyConfig {
  /** Text to copy; if omitted, the displayed text is copied (when children is a string or text can be extracted). */
  text?: string;
  /** Called after the text was copied to the clipboard successfully, with the copied text. */
  onCopy?: (text: string) => void;
}

export interface TypographyLabels {
  copy: string;
  copied: string;
  expand: string;
  collapse: string;
}

interface TextStyleProps {
  /** Color semantics: secondary is muted descriptive text, the others take the theme style's semantic colors, and disabled is grayed out and unavailable. */
  tone?: TextTone;
  /** Bold (wraps the text in <strong>). */
  strong?: boolean;
  /** Italic (<em>). */
  italic?: boolean;
  /** Underline (<u>). */
  underline?: boolean;
  /** Strikethrough (<del>). */
  strikethrough?: boolean;
  /** Inline code style (<code>). */
  code?: boolean;
  /** Highlight mark (<mark>). */
  mark?: boolean;
  /** Truncate with an ellipsis on overflow: true is a single line, an object can specify the line count (1–10) and whether it is expandable. Truncated plain text shows the full text in its `title`. */
  ellipsis?: boolean | EllipsisConfig;
  /** Keep the text on one line, however narrow the space (`white-space: nowrap`): a date, an id. For a line that is cut with an ellipsis use `ellipsis`. */
  nowrap?: boolean;
  /** Keep the line breaks and runs of spaces of the text (`white-space: pre-wrap`), and wrap what is too long, for a message or a note typed by a person. */
  preserveWhitespace?: boolean;
  /** Add a copy button after the text; without `text` it copies the displayed text, and after copying the button shows a check for about 2 seconds. */
  copyable?: boolean | CopyConfig;
  /** Button text (for switching languages). */
  labels?: Partial<TypographyLabels>;
}

/** Wrap the text in semantic elements as needed (strong, em, del...); the theme style writes the styles per element. */
function decorate(children: ReactNode, props: TextStyleProps): ReactNode {
  let node = children;
  if (props.code) node = <code>{node}</code>;
  if (props.mark) node = <mark>{node}</mark>;
  if (props.underline) node = <u>{node}</u>;
  if (props.strikethrough) node = <del>{node}</del>;
  if (props.italic) node = <em>{node}</em>;
  if (props.strong) node = <strong>{node}</strong>;
  return node;
}

const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

interface CoreProps extends TextStyleProps {
  size?: TextSize;
  tag: string;
  slot: "text" | "title" | "paragraph";
  level?: number;
  disabled?: boolean;
  children?: ReactNode;
  rest: Record<string, unknown>;
}

/** Implementation shared by Text / Title / Paragraph: decoration, truncation (including detecting whether it is truncated), expand, copy. */
function Core({
  tag,
  slot,
  level,
  tone,
  size,
  disabled,
  ellipsis,
  nowrap,
  preserveWhitespace,
  copyable,
  labels: labelsProp,
  children,
  rest,
  ...style
}: CoreProps) {
  const config = useConfig();
  const labels = { ...en.labels.typography, ...config.labels?.typography, ...labelsProp };
  const ellipsisConfig: EllipsisConfig | null = ellipsis
    ? ellipsis === true
      ? {}
      : ellipsis
    : null;
  const rows = ellipsisConfig
    ? Math.max(1, Math.min(Math.round(ellipsisConfig.rows ?? 1), MAX_ROWS))
    : undefined;
  const contentRef = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState(ellipsisConfig?.defaultExpanded ?? false);
  const [truncated, setTruncated] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Whether it is really truncated: single line compares width, multiple lines compare height; not measured while expanded (cannot be measured)
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || !ellipsisConfig || expanded) return;
    const measure = () => {
      const over =
        rows === 1 ? el.scrollWidth > el.clientWidth + 1 : el.scrollHeight > el.clientHeight + 1;
      setTruncated(over);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!ellipsisConfig, rows, expanded, children]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copyConfig: CopyConfig | null = copyable ? (copyable === true ? {} : copyable) : null;
  const doCopy = async () => {
    const text =
      copyConfig?.text ??
      (typeof children === "string" ? children : (contentRef.current?.textContent ?? ""));
    if (!(await copyToClipboard(text))) return;
    copyConfig?.onCopy?.(text);
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const showExpand = !!ellipsisConfig?.expandable && (truncated || expanded);
  return createElement(
    tag,
    {
      ...rest,
      "data-slot": slot,
      "data-level": level,
      "data-tone": tone,
      "data-size": size === "md" ? undefined : size,
      "data-disabled": disabled ? "" : undefined,
      "data-ellipsis": ellipsisConfig ? "" : undefined,
      "data-nowrap": nowrap ? "" : undefined,
      "data-pre": preserveWhitespace ? "" : undefined,
      "data-rows": rows,
      "data-expanded": expanded ? "" : undefined,
      "data-truncated": truncated && !expanded ? "" : undefined,
    },
    <span
      ref={contentRef}
      data-slot="text-content"
      title={
        ellipsisConfig && truncated && !expanded && typeof children === "string"
          ? children
          : undefined
      }
    >
      {decorate(children, style)}
    </span>,
    showExpand ? (
      <button
        type="button"
        data-slot="text-expand"
        aria-expanded={expanded}
        onClick={() => {
          setExpanded(!expanded);
          ellipsisConfig?.onExpand?.(!expanded);
        }}
      >
        {expanded ? labels.collapse : labels.expand}
      </button>
    ) : null,
    copyConfig ? (
      <button
        type="button"
        data-slot="text-copy"
        data-copied={copied ? "" : undefined}
        aria-label={copied ? labels.copied : labels.copy}
        title={copied ? labels.copied : labels.copy}
        onClick={() => void doCopy()}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    ) : null,
  );
}

export interface TextProps extends Without<ComponentPropsWithoutRef<"span">>, TextStyleProps {
  /**
   * Type size: `xs` for fine print (a credit, a caption), `sm` for secondary lines, `lg` for lead text; the default is the theme style's body size.
   * @default "md"
   */
  size?: TextSize;
  /** Grayed-out, unavailable look (appearance only, does not affect interaction). */
  disabled?: boolean;
}

/** Inline text: color semantics, bold / italic / underline / strikethrough / code / highlight, can be truncated and copied. */
export function Text({
  tone,
  size,
  disabled,
  strong,
  italic,
  underline,
  strikethrough,
  code,
  mark,
  ellipsis,
  nowrap,
  preserveWhitespace,
  copyable,
  labels,
  children,
  ...rest
}: TextProps) {
  return (
    <Core
      tag="span"
      slot="text"
      {...{
        tone,
        size,
        disabled,
        strong,
        italic,
        underline,
        strikethrough,
        code,
        mark,
        ellipsis,
        nowrap,
        preserveWhitespace,
        copyable,
        labels,
      }}
      rest={rest}
    >
      {children}
    </Core>
  );
}

export interface ParagraphProps extends Without<ComponentPropsWithoutRef<"p">>, TextStyleProps {
  /**
   * Type size: `xs` for fine print (a credit, a caption), `sm` for secondary lines, `lg` for lead text; the default is the theme style's body size.
   * @default "md"
   */
  size?: TextSize;
  /** Grayed-out, unavailable look (appearance only, does not affect interaction). */
  disabled?: boolean;
}

/** Paragraph (<p>): the same styling abilities as Text, often used with multi-line truncation + expand. Spacing between paragraphs is left to Flex, or put them inside Typography. */
export function Paragraph({
  tone,
  size,
  disabled,
  strong,
  italic,
  underline,
  strikethrough,
  code,
  mark,
  ellipsis,
  nowrap,
  preserveWhitespace,
  copyable,
  labels,
  children,
  ...rest
}: ParagraphProps) {
  return (
    <Core
      tag="p"
      slot="paragraph"
      {...{
        tone,
        size,
        disabled,
        strong,
        italic,
        underline,
        strikethrough,
        code,
        mark,
        ellipsis,
        nowrap,
        preserveWhitespace,
        copyable,
        labels,
      }}
      rest={rest}
    >
      {children}
    </Core>
  );
}

export interface TitleProps extends Without<ComponentPropsWithoutRef<"h1">>, TextStyleProps {
  /**
   * 1–5, rendered as h1–h5, with sizes from the theme style's type scale.
   * @default 1
   */
  level?: 1 | 2 | 3 | 4 | 5;
  /** Grayed-out, unavailable look (appearance only, does not affect interaction). */
  disabled?: boolean;
}

/** Title: h1–h5, with the type scale decided by the theme style; spacing above and below headings is left to Flex, or put them inside Typography. */
export function Title({
  level = 1,
  tone,
  disabled,
  strong,
  italic,
  underline,
  strikethrough,
  code,
  mark,
  ellipsis,
  nowrap,
  preserveWhitespace,
  copyable,
  labels,
  children,
  ...rest
}: TitleProps) {
  return (
    <Core
      tag={`h${level}`}
      slot="title"
      level={level}
      {...{
        tone,
        disabled,
        strong,
        italic,
        underline,
        strikethrough,
        code,
        mark,
        ellipsis,
        nowrap,
        preserveWhitespace,
        copyable,
        labels,
      }}
      rest={rest}
    >
      {children}
    </Core>
  );
}

export interface TypographyProps extends Without<ComponentPropsWithoutRef<"div">> {
  /**
   * The container element; native headings, paragraphs, lists, quotes, code, links and tables inside it get suitable typography.
   * @default "div"
   */
  as?: Extract<LayoutTag, "div" | "article" | "section">;
}

/**
 * Content typography container: headings, paragraphs, lists, quotes, code, links, dividers and tables inside automatically get suitable font sizes and spacing,
 * for displaying articles, documentation and content rendered from Markdown. Just write native elements inside, no need to wrap each in Title / Paragraph.
 */
export function Typography({ as = "div", ...rest }: TypographyProps) {
  return createElement(as, { ...rest, "data-slot": "typography" });
}
