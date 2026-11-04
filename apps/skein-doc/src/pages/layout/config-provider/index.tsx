import { Calendar, Carousel, ConfigProvider, Pagination } from "@skeinui/ui";
import type { ConfigLabels } from "@skeinui/ui";
import { useMemo } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead } from "@/doc/doc.tsx";

export default function ConfigProviderPage() {
  const t = usePageT();
  // The demo's labels, in the language of another locale; memoised so the reference stays stable
  const previous = t("locale.previous");
  const next = t("locale.next");
  const previousSlide = t("locale.previousSlide");
  const nextSlide = t("locale.nextSlide");
  const labels = useMemo<ConfigLabels>(
    () => ({
      pagination: { previous, next },
      carousel: { previous: previousSlide, next: nextSlide },
    }),
    [previous, next, previousSlide, nextSlide],
  );

  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Config Provider</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="root"
        code={`import { ConfigProvider } from "@skeinui/ui";

const labels = { pagination: { next: "Next page" } }; // module level, so the reference is stable

<ConfigProvider themeStyle="antd" mode="system" themeColor="contrast" locale="zh-CN" labels={labels}>
  <App />
</ConfigProvider>`}
      >
        <p className="pg-doc-lead">{t("root.note")}</p>
      </Example>

      <Example
        id="locale"
        code={`const DE: ConfigLabels = {
  pagination: { previous: "Zurück", next: "Weiter" },
  carousel: { previous: "Vorheriges Bild", next: "Nächstes Bild" },
};

<ConfigProvider locale="de-DE" labels={DE}>
  <Calendar /> <Pagination … /> <Carousel …>…</Carousel>
</ConfigProvider>`}
      >
        <ConfigProvider locale={t("locale.locale")} labels={labels}>
          <div className="pg-stack">
            <Calendar defaultMonth="2026-03" />
            <Pagination total={50} pageSize={10} page={2} onPageChange={() => {}} />
            <Carousel aria-label={t("locale.carousel")}>
              <div style={{ padding: "2rem" }}>1</div>
              <div style={{ padding: "2rem" }}>2</div>
            </Carousel>
          </div>
        </ConfigProvider>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="ConfigProvider" />
        <p className="pg-desc">{t.rich("api.useConfig")}</p>
      </section>
    </article>
  );
}
