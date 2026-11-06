/** A text of the mock API in the language the request asks for (`Accept-Language`, which lib/http.ts sends): zh or en. */
export const localized = (request: Request, texts: { zh: string; en: string }) =>
  request.headers.get("Accept-Language")?.startsWith("zh") ? texts.zh : texts.en;
