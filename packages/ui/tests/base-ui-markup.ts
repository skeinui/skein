/**
 * The markup of a component without what Base UI's ScrollArea writes for itself (a `<style>` that hides the native scrollbar, a class and inline styles on its own elements),
 * so a test can check that the component adds no class or style of its own.
 */
export function withoutScrollAreaInternals(html: string): string {
  return html
    .replace(/<style data-precedence="base-ui[^>]*>[^<]*<\/style>/g, "")
    .replace(/<div[^>]*(?:data-slot="scroll-area|role="presentation")[^>]*>/g, (tag) =>
      tag.replace(/\s(?:class|style)="[^"]*"/g, ""),
    );
}
