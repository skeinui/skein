import http from "@/lib/http";
import type { ListQuery, ListResult, QueryAdapter } from "./types";

/** Asks a list endpoint with a `ListQuery`, in the form the backend's adapter says it takes. */
export function fetchList<T>(path: string, query: ListQuery, adapter: QueryAdapter) {
  const { params, body } = adapter.toRequest(query);
  return adapter.method === "POST"
    ? http.post<ListResult<T>>(`${path}${adapter.path ?? "/search"}`, body)
    : http.get<ListResult<T>>(`${path}${adapter.path ?? ""}`, { params });
}
