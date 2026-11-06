import i18n from "@/lib/i18n";
import en from "./locales/messages/en.json";
import zh from "./locales/messages/zh.json";

const NS = "errors";
i18n.addResourceBundle("zh", NS, zh);
i18n.addResourceBundle("en", NS, en);

/**
 * A failed request in words, in the app's language, for when the API said none: the status, or 0 for a
 * request that never got an answer (offline, refused, CORS). The API's own `message` wins over this
 * (it is asked in the same language: `Accept-Language`, lib/http.ts).
 */
export function statusMessage(status: number) {
  const key =
    status === 0
      ? "network"
      : status === 401
        ? "unauthorized"
        : status === 403
          ? "forbidden"
          : status === 404
            ? "notFound"
            : status === 409
              ? "conflict"
              : status >= 500
                ? "server"
                : "unknown";
  return i18n.t(key, { ns: NS });
}
