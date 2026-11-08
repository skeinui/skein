import { Link } from "@skeinui/ui";
import { createLink } from "@tanstack/react-router";

/**
 * A link between pages: the router's `<Link>` (typed `to` / `params` / `from`, client-side navigation) drawn by the
 * theme style's `Link`, so it looks like the rest of the app instead of a bare `<a>`:
 * `<RouterLink to="/users/$id" params={{ id }}>Ada</RouterLink>`.
 */
export const RouterLink = createLink(Link);
