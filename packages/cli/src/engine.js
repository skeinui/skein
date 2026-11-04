/**
 * The template engine: `{{name}}` variables and `{{#if flag}}…{{else}}…{{/if}}` blocks (nestable).
 *
 * Only these exact forms are tags, so TSX such as `style={{ width: 1 }}` or `slots={{ a }}` passes through untouched:
 * a variable must be a bare identifier that exists in `vars`. A tag that is alone on its line takes the whole
 * line with it, so conditional blocks don't leave blank lines behind.
 */
const TAG = /\{\{(#if (\w+)|else|\/if)\}\}/g;

/** Removes a tag's own line when nothing else is on it. */
function ownLine(text) {
  return text.replace(/^[ \t]*(\{\{(?:#if \w+|else|\/if)\}\})[ \t]*\r?\n/gm, "$1");
}

function parse(text) {
  const root = { children: [] };
  const stack = [root];
  let last = 0;
  for (const match of text.matchAll(TAG)) {
    const top = stack[stack.length - 1];
    top.children.push(text.slice(last, match.index));
    last = match.index + match[0].length;
    if (match[2]) {
      const block = { flag: match[2], yes: [], no: [], children: null };
      block.children = block.yes;
      top.children.push(block);
      stack.push(block);
    } else if (match[1] === "else") {
      if (stack.length === 1) throw new Error("{{else}} without {{#if}}");
      top.children = top.no;
    } else {
      if (stack.length === 1) throw new Error("{{/if}} without {{#if}}");
      stack.pop();
    }
  }
  if (stack.length > 1) throw new Error(`{{#if ${stack[stack.length - 1].flag}}} is not closed`);
  root.children.push(text.slice(last));
  return root.children;
}

function renderNodes(nodes, flags) {
  return nodes
    .map((node) =>
      typeof node === "string" ? node : renderNodes(flags[node.flag] ? node.yes : node.no, flags),
    )
    .join("");
}

/**
 * Renders a template. `flags` decide `{{#if}}` blocks (unknown flags are false), `vars` fill `{{name}}`
 * (unknown names are left as they are).
 */
export function render(text, { flags = {}, vars = {} } = {}) {
  const body = renderNodes(parse(ownLine(text)), flags);
  return body.replace(/\{\{(\w+)\}\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

/** Template files whose whole content is conditional render to only whitespace: those are not written. */
export const isEmpty = (text) => text.trim() === "";
