{{#if shell}}
{{else}}
// The theme style: every visual of the components comes from it. `skein theme use <name>` rewrites this file.
import "{{themeImport}}";

export const themeStyle = "{{themeStyle}}";
{{/if}}
