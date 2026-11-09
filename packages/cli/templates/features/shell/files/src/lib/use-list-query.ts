import { useState } from "react";
import type { ListQuery } from "@/lib/list-query";

/** The numbers `Pagination` needs for a list: spread them into it, `<Pagination variant="pages" {...list.pagination(total)} />`. */
export interface ListPagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * The state of a list page: what its next request asks for (the page, the page size, the sort, the keyword and the filter) as a `ListQuery`.
 * A new search or a new sort starts from the first page; a new page size too; the rest of the query stays.
 */
export function useListQuery(initial: Partial<Omit<ListQuery, "page">> = {}) {
  const [query, setQuery] = useState<ListQuery>({ page: 1, pageSize: 10, ...initial });
  return {
    /** What to ask the list for: `useQuery({ queryKey: keys.list(query), queryFn: () => fetchList(query) })`. */
    query,
    /** A new search: the keyword and the filter are replaced by what is given (none clears them), back to the first page; the page size and the sort stay. */
    search: (next: Pick<ListQuery, "keyword" | "filter"> = {}) =>
      setQuery((q) => ({
        page: 1,
        pageSize: q.pageSize,
        ...(q.sort ? { sort: q.sort } : {}),
        ...next,
      })),
    /** A new sort (none clears it), back to the first page. */
    sort: (sort: ListQuery["sort"]) => setQuery((q) => ({ ...q, page: 1, sort })),
    /** The pagination of the list, given how many rows there are in all. */
    pagination: (total: number): ListPagination => ({
      page: query.page,
      pageSize: query.pageSize,
      total,
      onPageChange: (page) => setQuery((q) => ({ ...q, page })),
      onPageSizeChange: (pageSize) => setQuery((q) => ({ ...q, pageSize, page: 1 })),
    }),
  };
}
