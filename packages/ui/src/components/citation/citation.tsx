import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { useState } from "react";
import type { ReactNode } from "react";
import type { CitationType } from "../../contract.ts";
import { isSafeUrl } from "../markdown/url.ts";
import { PreviewCard } from "../preview-card/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface CitationProps {
  /** Link of the source (url sources), opened in a new tab (`noopener noreferrer`); non-http(s) addresses do not become links. */
  href?: string;
  /** Displayed title, defaults to the link's domain. */
  title?: string;
  /** When a description is given, hover / focus shows a preview card (title, description, domain). */
  description?: string;
  /** Address of the site icon (not fetched automatically); if missing or failing to load, shows the first letter of the title. */
  faviconUrl?: string;
  /** url: web source (default, when href is given), document: an uploaded document. */
  sourceType?: CitationType;
  /** When a document source is clicked (e.g. to open a document preview). */
  onClick?: () => void;
}

const hostOf = (href: string | undefined): string | undefined => {
  if (!href) return undefined;
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
};

function CitationIcon({
  type,
  faviconUrl,
  label,
}: {
  type: CitationType;
  faviconUrl?: string;
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span data-slot="citation-icon" aria-hidden="true">
      {type === "document" ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8" />
        </svg>
      ) : faviconUrl && !failed ? (
        <img data-slot="citation-favicon" src={faviconUrl} alt="" onError={() => setFailed(true)} />
      ) : (
        <span data-slot="citation-fallback">{label.charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

/**
 * A small pill for a citation source: icon + title, click opens the link (new tab, with `noopener noreferrer`).
 * Given a `description`, a preview card appears on hover / focus. A document source (`sourceType="document"`) is not a link;
 * with `onClick` it is a button.
 */
export function Citation({
  href,
  title,
  description,
  faviconUrl,
  sourceType,
  onClick,
}: CitationProps) {
  const t = useLabels("citation");
  const type: CitationType = sourceType ?? (href ? "url" : "document");
  const host = hostOf(href);
  const label = title ?? host ?? href ?? t.source;
  const link = type === "url" && href && /^https?:/i.test(href) && isSafeUrl(href) ? href : null;
  const content = (
    <>
      <CitationIcon type={type} faviconUrl={faviconUrl} label={label} />
      <span data-slot="citation-title">{label}</span>
    </>
  );

  if (link) {
    const pill = (
      <a
        data-slot="citation"
        data-type="url"
        href={link}
        target="_blank"
        rel="noopener noreferrer"
      />
    );
    if (!description) {
      return (
        <a
          data-slot="citation"
          data-type="url"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      );
    }
    return (
      <PreviewCard>
        <PreviewCard.Trigger
          render={pill}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          data-slot="citation"
          data-type="url"
        >
          {content}
        </PreviewCard.Trigger>
        <PreviewCard.Content side="top">
          <div data-slot="citation-preview">
            <div data-slot="citation-preview-head">
              <CitationIcon type="url" faviconUrl={faviconUrl} label={label} />
              <span data-slot="citation-preview-host">{host ?? link}</span>
            </div>
            <PreviewCard.Title>{label}</PreviewCard.Title>
            <PreviewCard.Description>{description}</PreviewCard.Description>
          </div>
        </PreviewCard.Content>
      </PreviewCard>
    );
  }
  if (onClick) {
    return (
      <button type="button" data-slot="citation" data-type={type} onClick={onClick}>
        {content}
      </button>
    );
  }
  return (
    <span data-slot="citation" data-type={type}>
      {content}
    </span>
  );
}

export interface CitationMarkerProps extends Omit<CitationProps, "sourceType" | "onClick"> {
  /** Number on the marker (starting from 1). */
  index: number;
}

/**
 * Citation marker in the reply body: a small numbered badge (`[1]`); click opens the source, and with a `description` hover / focus shows a preview card.
 * Its name is "Source 1: title", so screen readers know what it is. Used in the `citations` of `Markdown`, or on its own.
 */
export function CitationMarker({
  index,
  href,
  title,
  description,
  faviconUrl,
}: CitationMarkerProps) {
  const t = useLabels("citation");
  const host = hostOf(href);
  const label = title ?? host ?? href ?? t.numbered(index);
  const link = href && /^https?:/i.test(href) && isSafeUrl(href) ? href : null;
  const name = t.named(index, label);
  if (!link) {
    return (
      <span data-slot="citation-marker" aria-label={name} role="img">
        {index}
      </span>
    );
  }
  if (!description) {
    return (
      <a
        data-slot="citation-marker"
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={name}
      >
        {index}
      </a>
    );
  }
  return (
    <PreviewCard>
      <PreviewCard.Trigger
        render={<a />}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={name}
        data-slot="citation-marker"
      >
        {index}
      </PreviewCard.Trigger>
      <PreviewCard.Content side="top">
        <div data-slot="citation-preview">
          <div data-slot="citation-preview-head">
            <CitationIcon type="url" faviconUrl={faviconUrl} label={label} />
            <span data-slot="citation-preview-host">{host ?? link}</span>
          </div>
          <PreviewCard.Title>{label}</PreviewCard.Title>
          <PreviewCard.Description>{description}</PreviewCard.Description>
        </div>
      </PreviewCard.Content>
    </PreviewCard>
  );
}

export interface CitationsProps extends Without<BaseCollapsible.Root.Props> {
  /** Text on the trigger, e.g. "3 sources". */
  label: ReactNode;
  /** A group of `Citation`s. */
  children?: ReactNode;
}

/** Gathers many sources into one group: the trigger is "3 sources", and expanding shows a row of `Citation`s. Collapsed by default. */
export function Citations({ label, children, ...rest }: CitationsProps) {
  return (
    <BaseCollapsible.Root {...rest} data-slot="citations">
      <BaseCollapsible.Trigger data-slot="citations-trigger">
        <span>{label}</span>
        <span data-slot="citations-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel data-slot="citations-panel">
        <div data-slot="citations-list">{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
