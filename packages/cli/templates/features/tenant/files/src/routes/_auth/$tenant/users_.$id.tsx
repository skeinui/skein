import { createFileRoute } from "@tanstack/react-router";
import { UserDetailPage } from "@/pages/users/detail";

/** A user's page, /<tenant>/users/<id>: under the users menu item, not nested in the list's route. */
export const Route = createFileRoute("/_auth/$tenant/users_/$id")({
  component: function UserDetailRoute() {
    const { id } = Route.useParams();
    return <UserDetailPage id={Number(id)} />;
  },
});
