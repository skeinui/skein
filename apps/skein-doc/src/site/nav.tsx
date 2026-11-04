import { createContext, useContext } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/** Paths are the same in every language (`/button`); the App puts the language in front and keeps the query. */
export interface Nav {
  navigate: (path: string) => void;
  href: (path: string) => string;
}

export const NavContext = createContext<Nav>({ navigate: () => undefined, href: (path) => path });

export const useNavigate = () => useContext(NavContext).navigate;

/** In-site link: doesn't reload the page, keeps the language and query parameters such as ?themeStyle=; with a modifier key held it uses the browser default (open in a new tab). */
export function PgLink({
  to,
  children,
  onNavigate,
  ...rest
}: { to: string; children: ReactNode; onNavigate?: () => void } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  const { navigate, href } = useContext(NavContext);
  return (
    <a
      {...rest}
      href={href(to)}
      onClick={(e) => {
        rest.onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}
