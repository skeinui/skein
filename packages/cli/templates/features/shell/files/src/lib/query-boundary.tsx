import { Flex, Spinner } from "@skeinui/ui";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * What a part of a page that shows one query's data is in each state: a spinner while it loads, `notFound` when the request failed (a 404, no
 * permission; nothing when not given), `empty` when the data is an empty list (given: `null` for nothing), and `children` with the data once it
 * is there. Keep the data's own states out of the page body.
 */
export function QueryBoundary<T>({
  query,
  notFound,
  empty,
  children,
}: {
  query: Pick<UseQueryResult<T>, "data" | "error" | "isPending">;
  /** Shown when the request failed: usually a `Text` or an `Empty` saying it is not found. */
  notFound?: ReactNode;
  /** Shown instead of `children` when the data is an empty array. */
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.error) return <>{notFound}</>;
  if (query.isPending || query.data === undefined)
    return (
      <Flex justify="center">
        <Spinner />
      </Flex>
    );
  if (empty !== undefined && Array.isArray(query.data) && query.data.length === 0)
    return <>{empty}</>;
  return <>{children(query.data)}</>;
}
