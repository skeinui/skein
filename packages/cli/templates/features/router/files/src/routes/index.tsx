{{#if shell}}
import { createFileRoute, redirect } from "@tanstack/react-router";
import { settings } from "@/settings";

export const Route = createFileRoute("/")({
  beforeLoad() {
    throw redirect({ to: settings.homePath });
  },
});
{{else}}
import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/home";

export const Route = createFileRoute("/")({
  component: HomePage,
});
{{/if}}
