import { Flex, Spinner } from "@skeinui/ui";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * What a page that shows one thing from one query is in each state: a spinner while it loads, `notFound` when the request failed (a 404, no
 * permission), and `children` with the data once it is there. Keep the data's own states out of the page body.
 */
export function QueryBoundary<T>({
  query,
  notFound,
  children,
}: {
  query: Pick<UseQueryResult<T>, "data" | "error" | "isPending">;
  /** Shown when the request failed: usually a `Text` or an `Empty` saying it is not found. */
  notFound: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.error) return <>{notFound}</>;
  if (query.isPending || query.data === undefined)
    return (
      <Flex justify="center">
        <Spinner />
      </Flex>
    );
  return <>{children(query.data)}</>;
}
