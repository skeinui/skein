{{#if router}}
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/router";
{{else}}
import { HomePage } from "@/pages/home";
{{/if}}
import { AppProviders } from "@/providers";

export function App() {
  return (
    <AppProviders>
{{#if router}}
      <RouterProvider router={router} />
{{else}}
      <HomePage />
{{/if}}
    </AppProviders>
  );
}
