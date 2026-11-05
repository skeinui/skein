import type { Plugin } from "vite";

export interface SkeinThemesOptions {
  /** Directories whose source files are scanned for imports from @skeinui/ui (default `["src"]`). */
  include?: string[];
  /** Directories of theme styles of your own to prune as well (`skein theme init` writes `src/theme`). */
  themes?: string[];
}

/** Keeps, in each theme style's index.css, only the stylesheets of the components the project imports. */
export function skeinThemes(options?: SkeinThemesOptions): Plugin;
export default skeinThemes;

/** The names a source file imports from @skeinui/ui; null when it imports the whole package. */
export function importsOf(code: string): string[] | null;
/** The stylesheets to keep for these imports; null to keep them all. */
export function stylesFor(
  imports: string[] | null,
  styles: { base: string[]; exports: Record<string, string[]> },
): Set<string> | null;
/** index.css with only the @imports of `keep`. */
export function prune(css: string, keep: Set<string>): string;
