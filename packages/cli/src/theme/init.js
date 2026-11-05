import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadContract } from "./contract.js";
import { coverageFor } from "./coverage.js";
const LAYERS = "@layer ui-tokens, ui-color, ui-style;";
const tokenList = (tokens) => tokens.map((t) => `    /* ${t}: ; */`).join("\n");
/** Required selectors are listed in a comment; `checkTheme` ignores comments, so they don't count as covered. */
const componentFile = (file, scope, selectors) => `${LAYERS}

/*
 * ${file}: every rule is scoped to the theme style, e.g.
 *   ${scope} [data-slot="..."] { ... }
 *
 * Required (run \`skein check\` to see what is still missing):
${selectors.map((s) => ` *   ${s.replaceAll("*/", "* /")}`).join("\n")}
 */
@layer ui-style {
}
`;
/**
 * A blank theme style named `name`: token files listing every required token, one file per component
 * listing the selectors it must cover, and an `index.css`. No values: `checkTheme` reports everything
 * still to do. Returns the files' contents by file name.
 *
 * @param {string} name
 * @param {Record<string, readonly (string | number)[]>} contract
 * @returns {Record<string, string>}
 */
export function blankThemeFiles(name, contract) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(`invalid theme style name "${name}": use lowercase letters, digits and "-"`);
  }
  const { MODE_TOKENS, REQUIRED_TOKENS } = contract;
  const scope = `[data-skein-theme="${name}"]`;
  const files = {
    "tokens.css": `${LAYERS}

/* ${name}: light values, plus shape, font and density. Every token below is required. */
@layer ui-tokens {
  ${scope} {
    color-scheme: light;

${tokenList(REQUIRED_TOKENS)}
  }
}
`,
    "dark.css": `${LAYERS}

/* ${name}: dark values, only the tokens that change with the mode. */
@layer ui-tokens {
  ${scope}[data-skein-mode="dark"],
  ${scope} :where([data-skein-mode="dark"]) {
    color-scheme: dark;

${tokenList(MODE_TOKENS)}
  }
}
`,
  };
  for (const [file, selectors] of Object.entries(coverageFor(contract))) {
    files[file] = componentFile(file, scope, selectors);
  }
  files["index.css"] = Object.keys(files)
    .map((f) => `@import "./${f}";`)
    .join("\n")
    .concat("\n");
  return files;
}

/**
 * Writes a blank theme style to `dir` (which must be empty or missing). Returns the files written.
 *
 * @param {string} dir
 * @param {string} name
 * @param {Record<string, readonly (string | number)[]>} [contract]
 */
export function initTheme(dir, name, contract = loadContract(dir)) {
  const files = blankThemeFiles(name, contract);
  if (existsSync(dir) && readdirSync(dir).length > 0) throw new Error(`${dir} is not empty`);
  mkdirSync(dir, { recursive: true });
  for (const [file, content] of Object.entries(files)) writeFileSync(join(dir, file), content);
  return Object.keys(files);
}
