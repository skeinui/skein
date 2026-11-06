import { createFileRoute } from "@tanstack/react-router";
import { requireAccess } from "@/modules/access";
import { UsersPage } from "@/pages/users";

export const Route = createFileRoute("/_auth/$tenant/users")({
  // Opening the page needs `users:read`; the 403 page otherwise
  beforeLoad: () => requireAccess("users:read"),
  component: UsersPage,
});
