import { createContext, useContext, useId } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Button } from "../button/index.ts";
import type { ButtonProps } from "../button/index.ts";
import { Segmented } from "../segmented/index.ts";
import type { SegmentedProps } from "../segmented/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

const TitleContext = createContext<string | undefined>(undefined);

export type ArtifactProps = Without<ComponentPropsWithoutRef<"section">>;

/**
 * Artifact panel: the area next to the conversation that shows things the model generated (documents, code, web pages): a header (title, view switch, actions) plus a content area.
 * The root is a `section` (region) named by the title, and the content area is a focusable scroll region. Put it in a parent with a height; it fills it and scrolls the content inside.
 */
function ArtifactRoot(props: ArtifactProps) {
  const titleId = useId();
  return (
    <TitleContext.Provider value={titleId}>
      <section aria-labelledby={titleId} {...props} data-slot="artifact" />
    </TitleContext.Provider>
  );
}

const ArtifactHeader = (props: Without<ComponentPropsWithoutRef<"div">>) => (
  <div {...props} data-slot="artifact-header" />
);

/** Title (also the name of the whole panel). */
function ArtifactTitle(props: Without<ComponentPropsWithoutRef<"h2">>) {
  const id = useContext(TitleContext);
  return <h2 id={id} {...props} data-slot="artifact-title" />;
}

/** A short note next to the title ("Document · v2"). */
const ArtifactMeta = (props: Without<ComponentPropsWithoutRef<"span">>) => (
  <span {...props} data-slot="artifact-meta" />
);

/** A row of action buttons (copy, download, close...), right-aligned. */
function ArtifactActions(props: Without<ComponentPropsWithoutRef<"div">>) {
  const t = useLabels("artifact");
  return (
    <div
      {...props}
      role="group"
      aria-label={props["aria-label"] ?? t.actions}
      data-slot="artifact-actions"
    />
  );
}

export interface ArtifactActionProps extends Omit<
  ButtonProps,
  "variant" | "color" | "size" | "iconOnly" | "children" | "aria-label"
> {
  /** Icon only, so the name is required. */
  "aria-label": string;
  children?: ReactNode;
}

/** An icon button in the header: a small, subtle `Button`. */
function ArtifactAction(props: ArtifactActionProps) {
  return <Button variant="ghost" color="neutral" size="sm" iconOnly type="button" {...props} />;
}

export type ArtifactCloseProps = Omit<ArtifactActionProps, "aria-label" | "children"> & {
  /** Name of the close button, default "Close". */
  "aria-label"?: string;
};

/** Close button (name defaults to "Close"). */
function ArtifactClose({ "aria-label": labelProp, ...rest }: ArtifactCloseProps) {
  const c = useLabels("common");
  const label = labelProp ?? c.close;
  return (
    <ArtifactAction aria-label={label} {...rest}>
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </ArtifactAction>
  );
}

export type ArtifactViewsProps = Pick<
  SegmentedProps,
  "options" | "value" | "defaultValue" | "onValueChange"
> & {
  /** Name of the view switch, for screen readers, default "View". */
  "aria-label"?: string;
};

/** View switch (preview / code): a group of segmented buttons, using the library's `Segmented`. */
function ArtifactViews({ "aria-label": labelProp, ...rest }: ArtifactViewsProps) {
  const t = useLabels("artifact");
  const label = labelProp ?? t.views;
  return <Segmented size="sm" aria-label={label} {...rest} />;
}

export interface ArtifactBodyProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Name of the content area, for screen readers, default "Content". */
  "aria-label"?: string;
}

/** Content area: keyboard focusable, scrolls inside when content overflows. */
function ArtifactBody({ "aria-label": labelProp, ...rest }: ArtifactBodyProps) {
  const t = useLabels("artifact");
  const label = labelProp ?? t.content;
  return <div {...rest} role="region" aria-label={label} tabIndex={0} data-slot="artifact-body" />;
}

export interface ArtifactCardProps {
  /** Title of the artifact. */
  title: string;
  /** The line below the title ("Code · v2", "Document"). */
  meta?: string;
  /** Icon on the left, a document icon by default. */
  icon?: ReactNode;
  /**
   * This artifact is currently open in the right panel.
   * @default false
   */
  selected?: boolean;
  /** Click (open / switch to this artifact). */
  onOpen?: () => void;
}

/** A small card in the conversation pointing to an artifact: clicking it opens `Artifact` beside it. It is a button, and `aria-pressed` indicates whether it is currently open. */
export function ArtifactCard({ title, meta, icon, selected = false, onOpen }: ArtifactCardProps) {
  return (
    <button
      type="button"
      data-slot="artifact-card"
      data-selected={selected ? "" : undefined}
      aria-pressed={selected}
      onClick={onOpen}
    >
      <span data-slot="artifact-card-icon" aria-hidden="true">
        {icon ?? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" />
          </svg>
        )}
      </span>
      <span data-slot="artifact-card-text">
        <span data-slot="artifact-card-title">{title}</span>
        {meta ? <span data-slot="artifact-card-meta">{meta}</span> : null}
      </span>
    </button>
  );
}

export const Artifact = Object.assign(ArtifactRoot, {
  Header: ArtifactHeader,
  Title: ArtifactTitle,
  Meta: ArtifactMeta,
  Views: ArtifactViews,
  Actions: ArtifactActions,
  Action: ArtifactAction,
  Close: ArtifactClose,
  Body: ArtifactBody,
});
