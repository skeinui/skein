{{#if query}}
import { useQuery } from "@tanstack/react-query";
{{/if}}
{{#if shell}}
import { Page } from "@/skein-shell";
{{/if}}
{{#if query}}
import { {{camel}}Keys, fetch{{Name}} } from "./api";
{{/if}}
{{#if i18n}}
import { use{{Name}}Translation } from "./locales";
{{/if}}

export function {{Name}}Page() {
{{#if i18n}}
  const { t } = use{{Name}}Translation();
{{/if}}
{{#if query}}
  const { data } = useQuery({ queryKey: {{camel}}Keys.all, queryFn: fetch{{Name}} });
{{/if}}
  return (
{{#if shell}}
    <Page title={{#if i18n}}{t("title")}{{else}}"{{title}}"{{/if}}>
{{#if query}}
      <pre>{JSON.stringify(data, null, 2)}</pre>
{{/if}}
    </Page>
{{else}}
    <main>
      <h1>{{#if i18n}}{t("title")}{{else}}{{title}}{{/if}}</h1>
    </main>
{{/if}}
  );
}
