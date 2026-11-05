import { createFileRoute, redirect } from "@tanstack/react-router";
import { settings } from "@/settings";

/** /<tenant>: its home page. */
export const Route = createFileRoute("/_auth/$tenant/")({
  beforeLoad({ params }) {
    throw redirect({ href: `/${params.tenant}${settings.homePath}` });
  },
});
