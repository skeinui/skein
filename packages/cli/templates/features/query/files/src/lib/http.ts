{{#if i18n}}
import { statusMessage } from "@/lib/errors";
import i18n from "@/lib/i18n";
{{/if}}
{{#if auth}}
import { useAuthStore } from "@/store/auth-store";
{{#if tenant}}
import { useTenantStore } from "@/store/tenant-store";
{{/if}}

{{/if}}
/**
 * A small fetch wrapper. Requests go to `VITE_API_BASE_URL` + the path; JSON in, JSON out. A response of
 * the form `{ data }` is unwrapped, so `http.get<User>(…)` resolves to the user itself.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/**
 * A failed request: the status (0 when there was no answer at all) and the parsed body, so callers can tell
 * errors apart. `message` is the API's own{{#if i18n}} (it answers in the app's language), else the status in words{{/if}}.
 */
export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message = (body as { message?: unknown } | undefined)?.message;
    super(typeof message === "string" && message ? message : {{#if i18n}}statusMessage(status){{else}}`HTTP ${status}`{{/if}});
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
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  return entries.length > 0
    ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}`
    : "";
}

{{#if auth}}
/**
 * The session is over (the access token is refused and can't be renewed): back to the login page, which says
 * so and comes back to this page after signing in.
 */
function endSession() {
  const here = window.location.pathname + window.location.search + window.location.hash;
  useAuthStore.getState().expire(here);
  window.location.assign("/login");
}

let renewing: Promise<boolean> | null = null;

/**
 * Asks for a new access token with the refresh token (`POST /api/auth/refresh` → `{ token, refreshToken? }`);
 * false when there is none or the API refuses it. Any number of requests refused at once share one renewal.
 */
function renewToken() {
  renewing ??= (async () => {
    const { refreshToken, setToken } = useAuthStore.getState();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as { data?: unknown };
      const data = (json.data ?? json) as { token?: string; refreshToken?: string };
      if (!data.token) return false;
      setToken(data.token, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    renewing = null;
  });
  return renewing;
}

{{/if}}
async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options: RequestOptions = {},
{{#if auth}}
  /** Sent again after the token was renewed: not a second time. */
  retried = false,
{{/if}}
): Promise<T> {
  const { params, headers, ...init } = options;
{{#if auth}}
  const token = useAuthStore.getState().token;
{{/if}}
  // The caller's headers win over these defaults (HeadersInit: an object, a Headers or [name, value] pairs)
  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("Content-Type"))
    requestHeaders.set("Content-Type", "application/json");
{{#if auth}}
  if (token && !requestHeaders.has("Authorization"))
    requestHeaders.set("Authorization", `Bearer ${token}`);
{{/if}}
{{#if i18n}}
  // The app's language: the API writes its texts (messages, notifications) in it
  if (!requestHeaders.has("Accept-Language")) requestHeaders.set("Accept-Language", i18n.language);
{{/if}}
{{#if tenant}}
  // The tenant picked in the switcher (modules/tenant-switcher): the API answers for that tenant
  const tenantId = useTenantStore.getState().tenantId;
  if (tenantId && !requestHeaders.has("X-Tenant-Id")) requestHeaders.set("X-Tenant-Id", tenantId);
{{/if}}
  const res = await fetch(`${BASE_URL}${url}${queryString(params)}`, {
    ...init,
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch((error: unknown) => {
    // No answer at all (offline, refused, CORS); a cancelled request stays what it is
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new HttpError(0, undefined);
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
    // The access token is refused (expired / revoked): a new one from the refresh token and the request again,
    // else the session is over
    if (res.status === 401 && token) {
      if (!retried && (await renewToken())) return request<T>(method, url, body, options, true);
      endSession();
    }
{{/if}}
    throw new HttpError(res.status, json);
  }
  const unwrap = json !== null && typeof json === "object" && "data" in json;
  return (unwrap ? (json as { data: unknown }).data : json) as T;
}

const http = {
  get: <T>(url: string, options?: RequestOptions) => request<T>("GET", url, undefined, options),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", url, body, options),
  put: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", url, body, options),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", url, body, options),
  delete: <T>(url: string, options?: RequestOptions) =>
    request<T>("DELETE", url, undefined, options),
};

export default http;
