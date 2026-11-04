import type { ReactNode } from "react";
import type { PaginationVariant, UISize } from "../../contract.ts";
import { Button } from "../button/index.ts";
import { Select } from "../select/index.ts";
import { getPageItems } from "./pages.ts";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

export interface PaginationLabels {
  total: (total: number) => ReactNode;
  selected: (count: number) => ReactNode;
  page: (current: number, pageCount: number) => ReactNode;
  pageSize: (size: number) => string;
  first: string;
  previous: string;
  next: string;
  last: string;
  /** Name of the whole pagination navigation, name of the page number buttons (`Page 3`), name of the page-size select. */
  navigation: string;
  pageLink: (page: number) => string;
  pageSizeSelect: string;
}

export interface PaginationProps {
  /** Current page, starting from 1. */
  page: number;
  /** Items per page; with `total` it determines the page count. */
  pageSize: number;
  /** Total number of items. */
  total: number;
  onPageChange: (page: number) => void;
  /** The "items per page" dropdown is shown only when passed. */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Choices of the "items per page" dropdown (shown only with `onPageSizeChange`).
   * @default [10, 20, 50, 100]
   */
  pageSizeOptions?: number[];
  /**
   * Number of selected rows, shown on the left when greater than 0.
   * @default 0
   */
  selectedCount?: number;
  /**
   * simple: first / previous / next / last + "Page x / y"; pages: with page numbers.
   * @default "simple"
   */
  variant?: PaginationVariant;
  /**
   * In the pages variant, how many pages are shown on each side of the current page.
   * @default 1
   */
  siblings?: number;
  /**
   * Size of the buttons.
   * @default "md"
   */
  size?: UISize;
  /**
   * Disables the whole pagination.
   * @default false
   */
  disabled?: boolean;
  /** Copy text; English is used if not passed. Each field can be overridden separately. */
  labels?: Partial<PaginationLabels>;
}

const Chevron = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

/**
 * Pagination: page navigation for a list or table. Pass `page`, `total` (items) and `pageSize`; it calls `onPageChange`
 * (and `onPageSizeChange` with `pageSizeOptions`) and you load that page, so it works for server- and client-side paging.
 * `variant="simple"` shows first / previous / next / last and "Page x / y" instead of page numbers.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  selectedCount = 0,
  variant = "simple",
  siblings = 1,
  size = "md",
  disabled = false,
  labels,
}: PaginationProps) {
  const config = useConfig();
  const l = { ...en.labels.pagination, ...config.labels?.pagination, ...labels };
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), pageCount);
  const canPrev = !disabled && current > 1;
  const canNext = !disabled && current < pageCount;
  const btn = { variant: "ghost", color: "neutral", size, iconOnly: true } as const;

  return (
    <nav data-slot="pagination" data-variant={variant} data-size={size} aria-label={l.navigation}>
      <div data-slot="pagination-info">
        {selectedCount > 0 ? <span>{l.selected(selectedCount)} · </span> : null}
        <span>{l.total(total)}</span>
      </div>
      <div data-slot="pagination-controls">
        {variant === "simple" ? (
          <span data-slot="pagination-page-info">{l.page(current, pageCount)}</span>
        ) : null}
        <div data-slot="pagination-nav">
          {variant === "simple" ? (
            <Button
              {...btn}
              aria-label={l.first}
              disabled={!canPrev}
              onClick={() => onPageChange(1)}
            >
              <Chevron d="m11 17-5-5 5-5M18 17l-5-5 5-5" />
            </Button>
          ) : null}
          <Button
            {...btn}
            aria-label={l.previous}
            disabled={!canPrev}
            onClick={() => onPageChange(current - 1)}
          >
            <Chevron d="m15 18-6-6 6-6" />
          </Button>
          {variant === "pages" ? (
            <div data-slot="pagination-pages">
              {getPageItems(current, pageCount, siblings).map((item, i) =>
                item === "ellipsis" ? (
                  <span key={`e${i}`} data-slot="pagination-ellipsis" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === current ? "solid" : "ghost"}
                    color={item === current ? "primary" : "neutral"}
                    size={size}
                    iconOnly
                    disabled={disabled}
                    aria-label={l.pageLink(item)}
                    aria-current={item === current ? "page" : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ),
              )}
            </div>
          ) : null}
          <Button
            {...btn}
            aria-label={l.next}
            disabled={!canNext}
            onClick={() => onPageChange(current + 1)}
          >
            <Chevron d="m9 18 6-6-6-6" />
          </Button>
          {variant === "simple" ? (
            <Button
              {...btn}
              aria-label={l.last}
              disabled={!canNext}
              onClick={() => onPageChange(pageCount)}
            >
              <Chevron d="m13 17 5-5-5-5M6 17l5-5-5-5" />
            </Button>
          ) : null}
        </div>
        {onPageSizeChange ? (
          <div data-slot="pagination-size">
            <Select
              size="sm"
              aria-label={l.pageSizeSelect}
              disabled={disabled}
              value={String(pageSize)}
              onValueChange={(v) => v && onPageSizeChange(Number(v))}
              options={pageSizeOptions.map((n) => ({ value: String(n), label: l.pageSize(n) }))}
            />
          </div>
        ) : null}
      </div>
    </nav>
  );
}
