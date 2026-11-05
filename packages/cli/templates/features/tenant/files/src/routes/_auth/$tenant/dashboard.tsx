import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/pages/dashboard";

export const Route = createFileRoute("/_auth/$tenant/dashboard")({
  component: DashboardPage,
});
