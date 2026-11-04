/**
 * Lightweight code highlighting: per language, a list of regexes that "match from the current position", cutting the text into tokens piece by piece.
 * It is not a full parser; it only recognizes comments, strings, numbers, keywords, JSON keys and variables, which is enough for chat code blocks.
 * For more precise highlighting (shiki / Prism, etc.) replace it via the `highlight` prop of `CodeBlock`.
 */
export type CodeTokenType = "keyword" | "string" | "comment" | "number" | "property" | "variable";

export interface CodeToken {
  /** No type means plain text. */
  type?: CodeTokenType;
  text: string;
}

type Rule = [CodeTokenType, RegExp];

const words = (list: string) => new RegExp(`(?:${list.split(" ").join("|")})\\b`, "y");
const NUMBER: Rule = ["number", /(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/y];
const DQ: Rule = ["string", /"(?:[^"\\\n]|\\.)*"?/y];
const SQ: Rule = ["string", /'(?:[^'\\\n]|\\.)*'?/y];

const JS_KEYWORDS =
  "const let var function return if else for while do switch case break continue new class extends import export from default async await try catch finally throw typeof instanceof in of this super void delete yield static get set interface type enum implements public private protected readonly as null undefined true false";

const LANGS: Record<string, Rule[]> = {
  js: [
    ["comment", /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    DQ,
    SQ,
    ["string", /`(?:[^`\\]|\\.)*`?/y],
    NUMBER,
    ["keyword", words(JS_KEYWORDS)],
  ],
  json: [
    ["property", /"(?:[^"\\\n]|\\.)*"(?=\s*:)/y],
    DQ,
    NUMBER,
    ["keyword", words("true false null")],
  ],
  python: [
    ["comment", /#[^\n]*/y],
    ["string", /(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/y],
    DQ,
    SQ,
    NUMBER,
    [
      "keyword",
      words(
        "def class return if elif else for while in not and or is import from as with try except finally raise pass break continue lambda yield async await None True False self",
      ),
    ],
  ],
  bash: [
    ["comment", /#[^\n]*/y],
    DQ,
    SQ,
    ["variable", /\$(?:\{[^}\n]*\}|[A-Za-z_]\w*|\d)/y],
    NUMBER,
    [
      "keyword",
      words(
        "if then else elif fi for while do done case esac function in echo cd ls cat grep export source sudo npm pnpm yarn git curl rm mv cp mkdir",
      ),
    ],
  ],
  css: [
    ["comment", /\/\*[\s\S]*?(?:\*\/|$)/y],
    DQ,
    SQ,
    ["keyword", /@[\w-]+/y],
    ["property", /[\w-]+(?=\s*:(?!:))/y],
    ["number", /#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?/y],
  ],
  html: [
    ["comment", /<!--[\s\S]*?(?:-->|$)/y],
    ["keyword", /<\/?[A-Za-z][\w:-]*|\/?>/y],
    DQ,
    SQ,
    ["property", /[\w:-]+(?==)/y],
  ],
  sql: [
    ["comment", /--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    SQ,
    NUMBER,
    [
      "keyword",
      new RegExp(
        `(?:${"select from where insert into values update set delete create table drop alter join left right inner outer on group by order having limit offset and or not null as distinct union all primary key foreign references index like in is between exists case when then else end".split(" ").join("|")})\\b`,
        "iy",
      ),
    ],
  ],
};

const ALIASES: Record<string, string> = {
  javascript: "js",
  jsx: "js",
  ts: "js",
  typescript: "js",
  tsx: "js",
  mjs: "js",
  cjs: "js",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  jsonc: "json",
  scss: "css",
  less: "css",
  xml: "html",
  svg: "html",
  vue: "html",
  postgresql: "sql",
  mysql: "sql",
};

/** Whether a language has built-in highlighting. */
export function canHighlight(language: string | undefined): boolean {
  if (!language) return false;
  const key = language.toLowerCase();
  return key in LANGS || key in ALIASES;
}

/** Cut the code into tokens; for an unknown language the whole text is plain text. The tokens joined together always equal the original. */
export function tokenize(code: string, language: string | undefined): CodeToken[] {
  const key = language?.toLowerCase() ?? "";
  const rules = LANGS[ALIASES[key] ?? key];
  if (!rules) return [{ text: code }];
  const out: CodeToken[] = [];
  let plain = "";
  const flush = () => {
    if (plain) out.push({ text: plain });
    plain = "";
  };
  let i = 0;
  while (i < code.length) {
    let matched: [CodeTokenType, string] | null = null;
    for (const [type, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0].length > 0) {
        // Keywords and numbers cannot start in the middle of a word (the 1 in foo1)
        if ((type === "keyword" || type === "number") && i > 0 && /[\w$]/.test(code[i - 1] ?? "")) {
          continue;
        }
        matched = [type, m[0]];
        break;
      }
    }
    if (matched) {
      flush();
      out.push({ type: matched[0], text: matched[1] });
      i += matched[1].length;
    } else {
      plain += code[i];
      i += 1;
    }
  }
  flush();
  return out;
}
