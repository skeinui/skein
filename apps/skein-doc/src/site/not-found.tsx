import { ArrowIcon } from "@/doc/icons.tsx";
import { useSiteT } from "@/site/i18n.tsx";
import { PgLink } from "@/site/nav.tsx";

/** A path with no page: served by Cloudflare with a 404 status (404.html, scripts/prerender.ts), not indexed. */
export function NotFound({ onSearch }: { onSearch: () => void }) {
  const t = useSiteT();
  return (
    <div className="pg-not-found">
      <p className="pg-not-found-code">404</p>
      <h1>{t("notFound.title")}</h1>
      <p>{t("notFound.text")}</p>
      <div className="pg-not-found-actions">
        <PgLink to="/" className="pg-not-found-primary">
          {t("notFound.home")} <ArrowIcon />
        </PgLink>
        <PgLink to="/introduction">{t("notFound.docs")}</PgLink>
        <button type="button" onClick={onSearch}>
          {t("notFound.search")}
        </button>
      </div>
    </div>
  );
}
