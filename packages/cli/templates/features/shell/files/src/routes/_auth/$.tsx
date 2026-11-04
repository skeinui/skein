import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/pages/not-found";

/** Any other address: the 404 page inside the layout (signed in, like every page under _auth). */
export const Route = createFileRoute("/_auth/$")({
  component: NotFoundPage,
});
