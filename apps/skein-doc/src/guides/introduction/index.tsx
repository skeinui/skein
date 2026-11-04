import { GuideSection, GuideTable, Lead, P } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

export default function IntroductionGuide() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">{t("title")}</h1>
      <Lead />

      <GuideSection id="what">
        <P k="what.p1" />
        <P k="what.p2" />
      </GuideSection>

      <GuideSection id="split">
        <P k="split.p1" />
        <GuideTable
          head={["split.side", "split.owns"]}
          rows={[
            ["`@skeinui/ui`", "split.ui"],
            ["`@skeinui/themes`", "split.themes"],
          ]}
        />
        <P k="split.p2" />
      </GuideSection>

      <GuideSection id="packages">
        <GuideTable
          head={["packages.name", "packages.what"]}
          rows={[
            ["`@skeinui/ui`", "packages.ui"],
            ["`@skeinui/themes`", "packages.themes"],
            ["`@skeinui/cli`", "packages.cli"],
            ["`create-skein`", "packages.create"],
            ["`skeinui`", "packages.alias"],
          ]}
        />
      </GuideSection>

      <GuideSection id="conventions">
        <P k="conventions.style" />
        <P k="conventions.data" />
        <P k="conventions.state" />
        <P k="conventions.overlay" />
      </GuideSection>

      <GuideSection id="next">
        <P k="next.p1" />
      </GuideSection>
    </article>
  );
}
