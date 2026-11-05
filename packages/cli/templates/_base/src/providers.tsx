{{#if query}}
import { QueryClientProvider } from "@tanstack/react-query";
{{/if}}
import { ConfigProvider{{#if i18n}}, en{{/if}}{{#if shell}}, Toaster{{/if}} } from "@skeinui/ui";
{{#if i18n}}
import { zhCN } from "@skeinui/ui/locales/zh-CN";
{{/if}}
import type { ReactNode } from "react";
{{#if i18n}}
import { useTranslation } from "react-i18next";
{{/if}}
{{#if query}}
import { queryClient } from "@/lib/query-client";
{{/if}}
{{#if shell}}
import { resolveThemeStyle, usePreferencesStore, useThemeStyle } from "@/skein-shell";
{{else}}
import { themeStyle } from "@/skein.theme";
{{/if}}

/** ConfigProvider writes the theme style and the mode to <html>, so overlays portalled to <body> follow. */
export function AppProviders({ children }: { children: ReactNode }) {
{{#if i18n}}
  const { i18n } = useTranslation();
  const zh = i18n.language.startsWith("zh");
{{/if}}
{{#if shell}}
  const mode = usePreferencesStore((s) => s.mode);
  // The theme style picked in the preferences drawer; it takes effect once its CSS has loaded
  const themeStyle = useThemeStyle(
    resolveThemeStyle(usePreferencesStore((s) => s.layout.themeStyle)),
  );
{{/if}}
  return (
{{#if i18n}}
    <ConfigProvider
      themeStyle={themeStyle}
      mode={{#if shell}}{mode}{{else}}"system"{{/if}}
      locale={zh ? "zh-CN" : "en"}
      labels={zh ? zhCN.labels : en.labels}
    >
{{else}}
    <ConfigProvider themeStyle={themeStyle} mode={{#if shell}}{mode}{{else}}"system"{{/if}}>
{{/if}}
{{#if query}}
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
{{else}}
      {children}
{{/if}}
{{#if shell}}
      <Toaster position="top-right" />
{{/if}}
    </ConfigProvider>
  );
}
