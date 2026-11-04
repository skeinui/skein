{{#if i18n}}
import { use{{Name}}Translation } from "./locales";
{{/if}}

export function {{Name}}() {
{{#if i18n}}
  const { t } = use{{Name}}Translation();
  return <div>{t("label")}</div>;
{{else}}
  return <div>{{title}}</div>;
{{/if}}
}
