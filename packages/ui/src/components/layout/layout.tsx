import type { ComponentPropsWithoutRef } from "react";

type Without<T> = Omit<T, "className" | "style">;

export type LayoutProps = Without<ComponentPropsWithoutRef<"section">>;

/**
 * Page skeleton: put Header / Content / Footer vertically inside Layout; Layout can also be nested.
 * For an app shell with a sidebar use `Sidebar`. The root Layout sets no height itself; it fills only when given a definite height from outside (e.g. a `100vh` container).
 */
export function Layout(props: LayoutProps) {
  return <section {...props} data-slot="layout" />;
}

function LayoutHeader(props: Without<ComponentPropsWithoutRef<"header">>) {
  return <header {...props} data-slot="layout-header" />;
}

function LayoutContent(props: Without<ComponentPropsWithoutRef<"main">>) {
  return <main {...props} data-slot="layout-content" />;
}

function LayoutFooter(props: Without<ComponentPropsWithoutRef<"footer">>) {
  return <footer {...props} data-slot="layout-footer" />;
}

Layout.Header = LayoutHeader;
Layout.Content = LayoutContent;
Layout.Footer = LayoutFooter;
