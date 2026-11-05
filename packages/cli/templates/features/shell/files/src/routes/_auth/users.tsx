{{#if tenant}}
{{else}}
import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/pages/users";

export const Route = createFileRoute("/_auth/users")({
  component: UsersPage,
});
{{/if}}
