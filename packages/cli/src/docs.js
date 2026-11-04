import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { REPO_PACKAGES_DIR } from "./paths.js";
import { findProjectRoot } from "./project.js";

/**
 * Component docs from `@skeinui/ui/manifest.json`: the one installed in the project, else the one of this
 * checkout. Rendered as Markdown for `skein docs`, the MCP server and the docs site's llms.txt.
 */
export function loadManifest(cwd = process.cwd()) {
  const root = findProjectRoot(cwd) ?? cwd;
  const candidates = [];
  try {
    candidates.push(createRequire(join(root, "package.json")).resolve("@skeinui/ui/manifest.json"));
  } catch {
    // Not installed here
  }
  candidates.push(join(REPO_PACKAGES_DIR, "ui", "manifest.json"));
  const file = candidates.find((f) => existsSync(f));
  if (!file) throw new Error("@skeinui/ui/manifest.json not found: install @skeinui/ui");
  return JSON.parse(readFileSync(file, "utf8"));
}

/** The first sentence of a description, for lists. */
export const summary = (text = "") =>
  // The first sentence; a doc comment wraps lines mid-sentence, a blank line ends a paragraph
  text
    .split(/\n\s*\n/)[0]
    .replace(/\s+/g, " ")
    .split(/(?<!\b(?:e\.g|i\.e)\.)(?<=[.。])\s/)[0]
    .trim();

/** Case-insensitive lookup; `null` when there is no such component. */
export function findComponent(manifest, name) {
  const key = Object.keys(manifest.components).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? { name: key, ...manifest.components[key] } : null;
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = next;
    }
  }
  return row[b.length];
}

/** Component names close to a misspelt one: within 2 edits, or containing it. */
export function suggest(manifest, name) {
  const q = name.toLowerCase();
  return Object.keys(manifest.components)
    .map((n) => ({ n, d: n.toLowerCase().includes(q) ? 0 : distance(q, n.toLowerCase()) }))
    .filter(({ d }) => d <= 2)
    .sort((x, y) => x.d - y.d || x.n.length - y.n.length)
    .map(({ n }) => n)
    .slice(0, 5);
}

/** Components whose name or description contains every word of `query`. */
export function searchComponents(manifest, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return Object.entries(manifest.components)
    .filter(([name, info]) => {
      const text = `${name} ${info.description}`.toLowerCase();
      return words.every((w) => text.includes(w));
    })
    .map(([name, info]) => ({ name, summary: summary(info.description) }));
}

const propLine = ([name, p]) => {
  const type = p.values ? p.values.map((v) => `"${v}"`).join(" | ") : p.type;
  const flags = [
    p.required ? "required" : "",
    p.default !== undefined ? `default ${p.default}` : "",
    p.from === "base-ui" ? "Base UI" : "",
  ].filter(Boolean);
  const doc = p.description ? ` — ${p.description.replace(/\s*\n\s*/g, " ")}` : "";
  return `- \`${name}\`${flags.length ? ` (${flags.join(", ")})` : ""}: \`${type}\`${doc}`;
};

/** One component as Markdown. `examples`: how many code examples to include (all by default). */
export function componentMarkdown(component, { examples = Infinity, heading = "#" } = {}) {
  const out = [
    `${heading} ${component.name}`,
    "",
    component.description,
    "",
    "```tsx",
    component.import,
    "```",
    "",
  ];
  out.push(`${heading}# Props`, "", ...Object.entries(component.props).map(propLine), "");
  for (const [part, info] of Object.entries(component.parts ?? {})) {
    out.push(`${heading}# ${part}`, "");
    if (info.description) out.push(info.description, "");
    const lines = Object.entries(info.props).map(propLine);
    out.push(...(lines.length > 0 ? lines : ["(no props of its own)"]), "");
  }
  for (const [type, info] of Object.entries(component.types ?? {})) {
    out.push(`${heading}# Type ${type}`, "");
    if (info.description) out.push(info.description, "");
    out.push(...Object.entries(info.props).map(propLine), "");
  }
  if (component.slots?.length) {
    out.push(`${heading}# data-slot`, "", component.slots.map((s) => `\`${s}\``).join(", "), "");
  }
  for (const example of (component.examples ?? []).slice(0, examples)) {
    out.push(`${heading}# Example: ${example.title}`, "", "```tsx", example.code, "```", "");
  }
  return out.join("\n");
}

/** The house rules, as a Markdown list. */
export const rulesMarkdown = (manifest) => manifest.rules.map((r) => `- ${r}`).join("\n");

/** llms.txt (https://llmstxt.org): an index of the components with links to their pages. */
export function llmsIndex(manifest, { site = "" } = {}) {
  return [
    "# Skein UI",
    "",
    "> React components built on Base UI. Components render structure and data-* attributes only; every visual comes from a swappable theme style (@skeinui/themes/default, shadcn, heroui, antd, or your own).",
    "",
    "## Rules",
    "",
    rulesMarkdown(manifest),
    "",
    "## Components",
    "",
    ...Object.entries(manifest.components).map(([name, info]) =>
      info.docs
        ? `- [${name}](${site}/${info.docs}): ${summary(info.description)}`
        : `- ${name}: ${summary(info.description)}`,
    ),
    "",
    "## Optional",
    "",
    `- [Full reference: every component's props, parts and examples](${site}/llms-full.txt)`,
    "",
  ].join("\n");
}

/** llms-full.txt: every component in full. */
export function llmsFull(manifest) {
  return [
    "# Skein UI — full component reference",
    "",
    "## Rules",
    "",
    rulesMarkdown(manifest),
    "",
    ...Object.keys(manifest.components).map((name) =>
      componentMarkdown(findComponent(manifest, name), { heading: "##" }),
    ),
  ].join("\n");
}
