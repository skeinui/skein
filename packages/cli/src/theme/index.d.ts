/** Value lists of @skeinui/ui's contract: slots, variants, required tokens… */
export type Contract = Record<string, readonly (string | number)[]>;

export type ThemeRule =
  | "tokens"
  | "dark-tokens"
  | "index-imports"
  | "scope"
  | "coverage"
  | "no-hex"
  | "button-group-siblings"
  | "placeholder";

export interface ThemeIssue {
  rule: ThemeRule;
  file: string;
  message: string;
}

/** Every problem of the theme style in `dir` scoped to `[data-skein-theme="name"]`; empty when complete. */
export declare function checkTheme(dir: string, name: string, contract?: Contract): ThemeIssue[];
export declare function declaredTokens(css: string): Set<string>;
/** The contract of the @skeinui/ui installed near `from`, else the one the CLI ships with. */
export declare function loadContract(from?: string): Contract;
/** The selectors each component file must contain, by file name. */
export declare function coverageFor(contract: Contract): Record<string, string[]>;
/** A blank theme style's files by name. */
export declare function blankThemeFiles(name: string, contract: Contract): Record<string, string>;
/** Writes a blank theme style to an empty `dir`; returns the file names. */
export declare function initTheme(dir: string, name: string, contract?: Contract): string[];
