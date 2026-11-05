import type { Plugin } from "vite";

export interface SkeinThemesOptions {
  /**
   * Directories whose source files are scanned for imports from @skeinui/ui, besides the dependencies that depend on
   * it (default `["src"]`). A module elsewhere that imports a component fails the build, naming the directory to add.
   */
  include?: string[];
  /** Directories of theme styles of your own to prune as well (`skein theme init` writes `src/theme`). */
  themes?: string[];
  /** `false`: keep every stylesheet (the plugin does nothing). */
  prune?: boolean;
}

/** Keeps, in each theme style's index.css, only the stylesheets of the components the project imports. */
export function skeinThemes(options?: SkeinThemesOptions): Plugin;
export default skeinThemes;

/** Vite's `parseSync` (Vite 8), or one shaped like it. */
type Parse = (
  filename: string,
  code: string,
) => {
  errors: unknown[];
  module: {
    staticImports: {
      moduleRequest: { value: string };
      entries: { importName: { kind: string; name?: string | null }; isType: boolean }[];
    }[];
    staticExports: {
      entries: {
        moduleRequest?: { value: string } | null;
        importName: { kind: string; name?: string | null };
        isType: boolean;
      }[];
    }[];
    dynamicImports: { moduleRequest: { start: number; end: number } }[];
  };
};

/**
 * The names a module imports or re-exports from @skeinui/ui: `[]` for none, null when it takes the whole package,
 * undefined when the code doesn't parse.
 */
export function importsOf(
  code: string,
  filename: string,
  parse: Parse,
): string[] | null | undefined;
/** The stylesheets to keep for these imports; null to keep them all. */
export function stylesFor(
  imports: string[] | null,
  styles: { base: string[]; exports: Record<string, string[]> },
): Set<string> | null;
/** index.css with only the @imports of `keep`. */
export function prune(css: string, keep: Set<string>): string;
/** The directories of the project's dependencies (and theirs) that depend on @skeinui/ui. */
export function dependencyDirs(root: string): string[];
/** A path with forward slashes and no query, as Vite writes module ids. */
export function toPosix(path: string): string;
/** The key the paths of one file share (case-insensitive on Windows). */
export function pathKey(path: string, platform?: NodeJS.Platform): string;
/** Whether `file` is inside `dir`, whatever the separators. */
export function isInside(file: string, dir: string, platform?: NodeJS.Platform): boolean;
