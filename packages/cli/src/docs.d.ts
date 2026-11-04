/** Types of docs.js: component docs from @skeinui/ui/manifest.json. */
export interface ComponentDoc {
  name: string;
  description: string;
  import: string;
  props: Record<
    string,
    { type: string; values?: string[]; required?: true; description?: string; from?: "base-ui" }
  >;
  parts?: Record<string, { description?: string; props: ComponentDoc["props"] }>;
  /** The data types its props use (BreadcrumbItem, FormField, …), with their fields. */
  types?: Record<string, { description?: string; props: ComponentDoc["props"] }>;
  slots?: string[];
  docs?: string;
  examples?: { title: string; code: string }[];
}
export interface Manifest {
  package: string;
  version: string;
  rules: string[];
  components: Record<string, Omit<ComponentDoc, "name">>;
  contract: Record<string, readonly string[]>;
}
export declare function loadManifest(cwd?: string): Manifest;
export declare function summary(text?: string): string;
export declare function findComponent(manifest: Manifest, name: string): ComponentDoc | null;
export declare function suggest(manifest: Manifest, name: string): string[];
export declare function searchComponents(
  manifest: Manifest,
  query: string,
): { name: string; summary: string }[];
export declare function componentMarkdown(
  component: ComponentDoc,
  options?: { examples?: number; heading?: string },
): string;
export declare function rulesMarkdown(manifest: Manifest): string;
export declare function llmsIndex(manifest: Manifest, options?: { site?: string }): string;
export declare function llmsFull(manifest: Manifest): string;
