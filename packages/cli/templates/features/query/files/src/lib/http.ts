{{#if auth}}
import { useAuthStore } from "@/store/auth-store";

{{/if}}
/**
 * A small fetch wrapper. Requests go to `VITE_API_BASE_URL` + the path; JSON in, JSON out. A response of
 * the form `{ data }` is unwrapped, so `http.get<User>(…)` resolves to the user itself.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/** A non-2xx response: the status and the parsed body, so callers can tell errors apart. */
export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message = (body as { message?: unknown } | undefined)?.message;
    super(typeof message === "string" ? message : `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

type Params = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  /** Query string; empty values are left out. */
  params?: Params;
}

function queryString(params?: Params) {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length > 0 ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : "";
}

async function request<T>(method: string, url: string, body?: unknown, options: RequestOptions = {}) {
  const { params, headers, ...init } = options;
{{#if auth}}
  const token = useAuthStore.getState().token;
{{/if}}
  const res = await fetch(`${BASE_URL}${url}${queryString(params)}`, {
    ...init,
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
{{#if auth}}
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
{{/if}}
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }
  if (!res.ok) {
{{#if auth}}
    // The session is gone (expired / revoked): sign out and go to the login page
    if (res.status === 401 && token) {
      useAuthStore.getState().reset();
      window.location.assign("/login");
    }
{{/if}}
    throw new HttpError(res.status, json);
  }
  const unwrap = json !== null && typeof json === "object" && "data" in json;
  return (unwrap ? (json as { data: unknown }).data : json) as T;
}

const http = {
  get: <T>(url: string, options?: RequestOptions) => request<T>("GET", url, undefined, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>("POST", url, body, options),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", url, body, options),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", url, body, options),
  delete: <T>(url: string, options?: RequestOptions) => request<T>("DELETE", url, undefined, options),
};

export default http;
