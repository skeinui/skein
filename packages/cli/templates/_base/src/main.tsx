{{#if shell}}
import { usePreferencesStore } from "@/skein-shell/store";
import { loadThemeStyle, resolveThemeStyle } from "@/skein-shell/theme-style";
{{else}}
import "./skein.theme";
{{/if}}
import "./styles/index.css";
{{#if i18n}}
import "@/lib/i18n";
{{/if}}
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

{{#if shell}}
// The theme style the user picked (or the default of settings.ts) is loaded before the first render
await loadThemeStyle(resolveThemeStyle(usePreferencesStore.getState().layout.themeStyle));

{{/if}}
function mount() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

{{#if mock}}
// VITE_ENABLE_MOCK (.env.development) decides whether MSW answers the API requests
if (import.meta.env.VITE_ENABLE_MOCK === "true") {
  void import("./mocks").then(({ startMocking }) => startMocking().then(mount));
} else {
  mount();
}
{{else}}
mount();
{{/if}}
