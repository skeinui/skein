/**
 * manifest.json: every component of @skeinui/ui in a form tools and AI agents can read without opening the
 * source — description, props (types, allowed values, docs), compound parts, data-slot hooks, and the code
 * examples of the docs site. Generated from the TypeScript types (src/index.ts) and src/contract.ts.
 *
 *   node scripts/manifest.ts           write manifest.json
 *   node scripts/manifest.ts --check   exit 1 if manifest.json is out of date
 *
 * tests/manifest.test.ts fails when it is stale, so a change to a component's props has to regenerate it.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import * as contract from "../src/contract.ts";
import { BASE_STYLES, stylesOf } from "./styles.ts";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const DOCS_PAGES = join(ROOT, "..", "..", "apps", "skein-doc", "src", "pages");
export const MANIFEST_FILE = join(ROOT, "manifest.json");

export interface PropInfo {
  type: string;
  /** The allowed values when the type is a union of string literals. */
  values?: string[];
  required?: true;
  description?: string;
  /** The JSDoc `@default`, as written there (`"md"`, `false`). */
  default?: string;
  /** Declared by Base UI (behaviour) rather than Skein. */
  from?: "base-ui";
}

export interface ComponentInfo {
  description: string;
  import: string;
  props: Record<string, PropInfo>;
  /** Compound parts, e.g. `Card.Header`. */
  parts?: Record<string, { description?: string; props: Record<string, PropInfo> }>;
  /**
   * Skein's own object types its props use (`BreadcrumbItem`, `FormField`, …), with their fields: the shape of the
   * data to pass, which a prop's type name alone doesn't tell.
   */
  types?: Record<string, { description?: string; props: Record<string, PropInfo> }>;
  /** `data-slot` values the component renders; theme styles select on them. */
  slots?: string[];
  docs?: string;
  examples?: { title: string; code: string }[];
}

export interface Manifest {
  package: "@skeinui/ui";
  version: string;
  rules: string[];
  components: Record<string, ComponentInfo>;
  /** Every value list of src/contract.ts (COLORS, SIZES, BUTTON_VARIANTS, IMAGE_GRID_COLUMNS…). */
  contract: Record<string, readonly (string | number)[]>;
  /**
   * The stylesheets of a theme style (`<style>/<name>.css`) each export needs, for @skeinui/themes/vite: `base`
   * always, then those of the exports a project imports (scripts/styles.ts).
   */
  styles: { base: string[]; exports: Record<string, string[]> };
}

/** House rules an agent needs before writing any Skein code. */
const RULES = [
  "Components take no className / style: all visuals come from the theme style (@skeinui/themes/<style> or your own). Lay out with Flex / Grid / Row / Col, or wrap in your own element.",
  "Pass variants as values (variant, color, size, radius); the allowed values are listed per prop.",
  "Controlled values use value / onValueChange; open state uses open / onOpenChange.",
  "Props are data first (options, items, fields, columns); ReactNode / render props are the escape hatch.",
  "Colors in your own CSS come from tokens: var(--ui-*), never hex values.",
  "Put <ConfigProvider themeStyle mode> at the root: it writes the theme to <html>, so overlays portalled to <body> are themed.",
];

const MAX_TYPE = 240;

const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const snake = (name: string) => kebab(name).replaceAll("-", "_").toUpperCase();
const docOf = (symbol: ts.Symbol, checker: ts.TypeChecker) =>
  ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();

/**
 * Named object types declared in src/ that `type` is or contains (through unions and arrays), e.g.
 * `BreadcrumbItem[] | undefined` → BreadcrumbItem. Functions and React types are left out.
 */
function namedTypesIn(
  type: ts.Type,
  checker: ts.TypeChecker,
  found: Map<string, ts.Type>,
  nested = false,
) {
  if (type.isUnion() || type.isIntersection()) {
    for (const t of type.types) namedTypesIn(t, checker, found, nested);
    return;
  }
  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    for (const t of checker.getTypeArguments(type as ts.TypeReference))
      namedTypesIn(t, checker, found, nested);
    return;
  }
  if (!(type.flags & ts.TypeFlags.Object) || type.getCallSignatures().length > 0) return;
  // Partial<CarouselLabels>, Readonly<…>: the type of interest is the argument
  const aliasFile = type.aliasSymbol?.declarations?.[0]?.getSourceFile().fileName;
  if (aliasFile && !aliasFile.startsWith(SRC) && type.aliasTypeArguments) {
    for (const t of type.aliasTypeArguments) namedTypesIn(t, checker, found, nested);
    return;
  }
  const symbol = type.aliasSymbol ?? type.getSymbol();
  const file = symbol?.declarations?.[0]?.getSourceFile().fileName;
  if (!symbol || !file?.startsWith(SRC) || symbol.name.startsWith("__")) return;
  // Another component's labels inside a type (ConfigLabels.kanban): that component's docs list them
  if (nested && symbol.name.endsWith("Labels")) return;
  if (found.has(symbol.name) || checker.getPropertiesOfType(type).length === 0) return;
  found.set(symbol.name, type);
}

const lowerFirst = (s: string) => s[0].toLowerCase() + s.slice(1);

/**
 * What the library's naming conventions already say about a prop, for props without a doc comment: value / open
 * pairs, `defaultX`, `onXChange`, `labels` and the common flags.
 */
function conventionDoc(name: string, names: Set<string>): string | undefined {
  const fixed: Record<string, string> = {
    value: "The value, controlled (with `onValueChange`).",
    open: "Whether it is open, controlled (with `onOpenChange`).",
    labels:
      "Built-in texts to override (see its Labels type below); by default they follow the ConfigProvider locale.",
    disabled: "Disables interaction.",
    invalid: "Shows the invalid state.",
    fullWidth: "Fills the width of the parent.",
    variant: "Visual variant; how each one looks is up to the theme style.",
    color: "Semantic colour; the theme style picks the actual colours.",
    size: "Size step.",
    children: "The content.",
    placeholder: "Text shown while empty.",
    "aria-label": "Accessible name, when there is no visible label.",
    "aria-labelledby": "Id of the element whose text names it.",
    name: "Field name, for native form submission.",
  };
  if (fixed[name]) return fixed[name];
  const initial = name.match(/^default([A-Z]\w*)$/);
  if (initial) {
    const prop = lowerFirst(initial[1]);
    return names.has(prop)
      ? `Initial \`${prop}\` when uncontrolled.`
      : `Initial ${prop} when uncontrolled.`;
  }
  const change = name.match(/^on([A-Z]\w*)Change$/);
  if (change) {
    const prop = lowerFirst(change[1]);
    return names.has(prop)
      ? `Called with the new \`${prop}\`; pass \`${prop}\` as well to control it.`
      : `Called when the ${prop.replace(/[A-Z]/g, (c) => ` ${c.toLowerCase()}`)} changes.`;
  }
  return undefined;
}

function propsOf(
  type: ts.Type,
  checker: ts.TypeChecker,
  types?: Map<string, ts.Type>,
  nested = false,
): Record<string, PropInfo> {
  const props: Record<string, PropInfo> = {};
  // Props that are a union (single | multiple selection…): every member's props, not only the shared ones; a prop
  // some members lack is optional
  const members = type.isUnion()
    ? type.types.filter((t) => t.getFlags() & ts.TypeFlags.Object)
    : [type];
  const byName = new Map<string, ts.Symbol>();
  for (const member of members)
    for (const prop of checker.getPropertiesOfType(member))
      if (!byName.has(prop.name)) byName.set(prop.name, prop);
  // A prop every member has: the union's own symbol (its type is the union, e.g. `string | string[]`)
  const all =
    members.length > 1
      ? [...byName.values()].map((prop) => checker.getPropertyOfType(type, prop.name) ?? prop)
      : checker.getPropertiesOfType(type);
  const inEvery = (name: string) =>
    members.every((member) => checker.getPropertiesOfType(member).some((p) => p.name === name));
  const names = new Set(all.map((p) => p.name));
  for (const prop of all) {
    const decl = prop.declarations?.[0];
    if (!decl) continue;
    const file = decl.getSourceFile().fileName;
    // DOM / React attributes (onClick, aria-*, id, …) are known to everyone and would bury the rest
    if (file.includes("/@types/react/") || file.includes("/typescript/lib/")) continue;
    const declared = checker.getTypeOfSymbolAtLocation(prop, decl);
    const propType = checker.getNonNullableType(declared);
    let text = checker.typeToString(propType, undefined, ts.TypeFormatFlags.NoTruncation);
    // getNonNullableType drops aliases: a long union such as ReactNode reads better by its name
    if (declared.aliasSymbol && text.length > 100) {
      text = checker
        .typeToString(declared, undefined, ts.TypeFormatFlags.NoTruncation)
        .replace(/ \| undefined$/, "");
    }
    if (text.length > MAX_TYPE) text = `${text.slice(0, MAX_TYPE)}…`;
    const info: PropInfo = { type: text };
    if (propType.isUnion() && propType.types.every((t) => t.isStringLiteral())) {
      info.values = propType.types.map((t) => (t as ts.StringLiteralType).value);
    }
    if (!(prop.flags & ts.SymbolFlags.Optional) && inEvery(prop.name)) info.required = true;
    const description =
      docOf(prop, checker) || (file.startsWith(SRC) ? conventionDoc(prop.name, names) : undefined);
    if (description) info.description = description;
    const fallback = prop.getJsDocTags(checker).find((tag) => tag.name === "default");
    if (fallback?.text) info.default = ts.displayPartsToString(fallback.text).trim();
    if (!file.startsWith(SRC)) info.from = "base-ui";
    else if (types) namedTypesIn(propType, checker, types, nested);
    props[prop.name] = info;
  }
  // Skein's own props first, then Base UI's, each alphabetically
  return Object.fromEntries(
    Object.entries(props).sort(
      ([a, x], [b, y]) => Number(!!x.from) - Number(!!y.from) || a.localeCompare(b),
    ),
  );
}

/**
 * Docs pages (`apps/skein-doc/src/pages/<group>/<page>/`) by the component they document: the one named like the
 * directory, or those its meta.ts lists in `components`.
 */
function docsPages() {
  const pages = new Map<string, string>();
  for (const group of readdirSync(DOCS_PAGES)) {
    for (const slug of readdirSync(join(DOCS_PAGES, group))) {
      const dir = join(DOCS_PAGES, group, slug);
      const meta = readFileSync(join(dir, "meta.ts"), "utf8");
      const listed = meta.match(/\bcomponents: \[([^\]]*)\]/)?.[1];
      for (const name of listed ? [...listed.matchAll(/"(\w+)"/g)].map((m) => m[1]) : [])
        pages.set(name, dir);
      if (!listed) pages.set(slug, dir);
    }
  }
  return pages;
}
const DOCS = docsPages();

/**
 * The component's docs page: its lead paragraph and the `<Example id="…" code={`…`}>` blocks, titled by the
 * page's English messages (`locales/en.json`: `lead`, `<id>.title`). The code is a template literal that
 * contains JSX (and so `>`), so it is read up to its closing backtick, not to the first `>`.
 */
function docsOf(name: string) {
  const dir = DOCS.get(name) ?? DOCS.get(kebab(name));
  if (!dir) return undefined;
  const source = readFileSync(join(dir, "index.tsx"), "utf8");
  const locale = join(dir, "locales", "en.json");
  const en = existsSync(locale) ? JSON.parse(readFileSync(locale, "utf8")) : {};
  const examples: { title: string; code: string }[] = [];
  const starts = [...source.matchAll(/<Example\b/g)].map((m) => m.index);
  starts.forEach((start, i) => {
    const block = source.slice(start, starts[i + 1] ?? source.length);
    const code = block.match(/\bcode=\{`((?:\\.|[^`\\])*)`\}/);
    if (!code || code.index === undefined) return;
    // The attributes are before the code, or right after it (up to the tag's end)
    const attrs =
      block.slice(0, code.index) + block.slice(code.index + code[0].length).split(">")[0];
    const id = attrs.match(/\bid="([^"]*)"/)?.[1];
    // A page not moved to locales yet still has its title in the tag
    const title = attrs.match(/\btitle="([^"]*)"/)?.[1] ?? (id ? en[id]?.title : undefined);
    if (title) {
      examples.push({
        title,
        code: code[1].replaceAll("\\`", "`").replaceAll("\\${", "${").trim(),
      });
    }
  });
  const lead = (en.lead ?? source.match(/className="pg-doc-lead">([\s\S]*?)<\/p>/)?.[1])
    ?.replace(/\s+/g, " ")
    .trim();
  return { docs: basename(dir), lead, examples };
}

/** `export const Card = Object.assign(CardRoot, {…})`: the docs are on CardRoot. */
function assignedRootDoc(decl: ts.Declaration, checker: ts.TypeChecker) {
  if (
    !ts.isVariableDeclaration(decl) ||
    !decl.initializer ||
    !ts.isCallExpression(decl.initializer)
  )
    return "";
  if (decl.initializer.expression.getText() !== "Object.assign") return "";
  const root =
    decl.initializer.arguments[0] && checker.getSymbolAtLocation(decl.initializer.arguments[0]);
  return root ? docOf(root, checker) : "";
}

export function buildManifest(): Manifest {
  const configFile = ts.readConfigFile(join(ROOT, "tsconfig.json"), (path) =>
    ts.sys.readFile(path),
  );
  const { options } = ts.parseJsonConfigFileContent(configFile.config, ts.sys, ROOT);
  const index = join(SRC, "index.ts");
  const program = ts.createProgram([index], options);
  const checker = program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(program.getSourceFile(index)!)!;
  const exports = new Map(checker.getExportsOfModule(moduleSymbol).map((s) => [s.name, s]));
  const resolve = (s: ts.Symbol) =>
    s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s;

  const components: Record<string, ComponentInfo> = {};
  for (const [name, exported] of [...exports].sort(([a], [b]) => a.localeCompare(b))) {
    if (!/^[A-Z]/.test(name)) continue;
    const value = resolve(exported);
    const decl = value.valueDeclaration ?? value.declarations?.[0];
    if (!decl || !(value.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) continue;
    // Props: the exported `XxxProps`, else the first parameter of the component function (e.g. ChatTurn)
    const propsExport = exports.get(`${name}Props`);
    const param = checker
      .getTypeOfSymbolAtLocation(value, decl)
      .getCallSignatures()[0]
      ?.getParameters()[0];
    const propsType = propsExport
      ? checker.getDeclaredTypeOfSymbol(resolve(propsExport))
      : param && checker.getTypeOfSymbolAtLocation(param, decl);
    // A namespace of parts with no root of its own (ChatTurn.Root, ChatTurn.Avatar…) is a component too
    const isNamespace =
      !param &&
      checker
        .getPropertiesOfType(checker.getTypeOfSymbolAtLocation(value, decl))
        .some(
          (m) =>
            /^[A-Z]/.test(m.name) &&
            m.declarations?.[0] &&
            checker.getTypeOfSymbolAtLocation(m, m.declarations[0]).getCallSignatures().length > 0,
        );
    // Only components: a props object, not classes (errors) or helpers taking strings
    if (!isNamespace && (!propsType || (!propsExport && !(propsType.flags & ts.TypeFlags.Object))))
      continue;

    const docs = docsOf(name);
    const found = new Map<string, ts.Type>();
    const info: ComponentInfo = {
      description:
        docOf(value, checker) ||
        assignedRootDoc(decl, checker) ||
        (propsExport ? docOf(resolve(propsExport), checker) : "") ||
        docs?.lead ||
        "",
      import: `import { ${name} } from "@skeinui/ui";`,
      props: propsType ? propsOf(propsType, checker, found) : {},
    };

    // Compound components: capitalized static members (Card.Header, Dialog.Content, …)
    const parts: NonNullable<ComponentInfo["parts"]> = {};
    for (const member of checker.getPropertiesOfType(
      checker.getTypeOfSymbolAtLocation(value, decl),
    )) {
      if (!/^[A-Z]/.test(member.name) || !member.declarations?.[0]) continue;
      const memberType = checker.getTypeOfSymbolAtLocation(member, member.declarations[0]);
      const param = memberType.getCallSignatures()[0]?.getParameters()[0];
      const target = resolve(member);
      parts[`${name}.${member.name}`] = {
        ...(docOf(target, checker) ? { description: docOf(target, checker) } : {}),
        props: param
          ? propsOf(
              checker.getTypeOfSymbolAtLocation(param, member.declarations[0]),
              checker,
              found,
            )
          : {},
      };
    }
    if (Object.keys(parts).length > 0) info.parts = parts;

    // The data types the props use, and the ones those use in turn (FormField → FormOption…)
    const types: NonNullable<ComponentInfo["types"]> = {};
    for (const [typeName, type] of found) {
      const symbol = (type.aliasSymbol ?? type.getSymbol())!;
      const description = docOf(symbol, checker);
      types[typeName] = {
        ...(description ? { description } : {}),
        props: propsOf(type, checker, found, true),
      };
    }
    if (Object.keys(types).length > 0)
      info.types = Object.fromEntries(Object.entries(types).sort(([a], [b]) => a.localeCompare(b)));

    const slots = (contract as Record<string, unknown>)[`${snake(name)}_SLOTS`];
    if (Array.isArray(slots)) info.slots = slots as string[];
    if (docs) {
      info.docs = docs.docs;
      if (docs.examples.length > 0) info.examples = docs.examples;
    }
    components[name] = info;
  }

  const contractLists = Object.fromEntries(
    Object.entries(contract)
      .filter(
        ([, v]) =>
          Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number"),
      )
      .sort(([a], [b]) => a.localeCompare(b)),
  ) as Record<string, readonly (string | number)[]>;
  const { version } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  return {
    package: "@skeinui/ui",
    version,
    rules: RULES,
    components,
    contract: contractLists,
    styles: { base: BASE_STYLES, exports: stylesOf() },
  };
}

export const serialize = (manifest: Manifest) => `${JSON.stringify(manifest, null, 2)}\n`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = serialize(buildManifest());
  const count = Object.keys(JSON.parse(text).components).length;
  if (process.argv.includes("--check")) {
    const current = existsSync(MANIFEST_FILE) ? readFileSync(MANIFEST_FILE, "utf8") : "";
    if (current !== text) {
      console.error("manifest.json is out of date: run `vp run manifest` in packages/ui");
      process.exit(1);
    }
    console.log(`manifest.json is up to date (${count} components)`);
  } else {
    writeFileSync(MANIFEST_FILE, text);
    console.log(`manifest.json: ${count} components, ${(text.length / 1024).toFixed(0)} KB`);
  }
}
