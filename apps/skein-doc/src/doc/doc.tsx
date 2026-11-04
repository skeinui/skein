import { Highlight } from "prism-react-renderer";
import { Fragment, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CheckIcon, CopyIcon } from "@/doc/icons.tsx";
import { rich, usePageT, useSiteT } from "@/site/i18n.tsx";
import { useSettings } from "@/site/settings.ts";

/**
 * Code highlighting. prism-react-renderer only tokenizes and carries no colors (theme left empty):
 * each token has a class like `token keyword`, and colors are defined per light / dark mode in playground.css.
 */
function CodeBlock({ code, language = "tsx" }: { code: string; language?: string }) {
  if (language === "bash") return <BashBlock code={code} />;
  return (
    <Highlight code={code} language={language} theme={{ plain: {}, styles: [] }}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="pg-pre">
          <code>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}

/**
 * Shell commands, which prism-react-renderer has no grammar for: comments, the command (first word, and after
 * `&&` / `|` / `;`), options and strings, with the same token classes as the highlighted code, so the code themes
 * colour them too. A line that starts a command gets a `$` prompt (CSS, not copied); an indented line continues the
 * one above.
 */
function BashBlock({ code }: { code: string }) {
  const lines = code.split("\n").map((line) => {
    const tokens: { text: string; type?: string }[] = [];
    let command = !/^\s/.test(line);
    for (const [text, string, comment, option, operator, word] of line.matchAll(
      /("[^"]*"|'[^']*')|(\s*#.*$)|(--?[A-Za-z][\w-]*)|(&&|\|\||[|;])|(\S+)|\s+/g,
    )) {
      if (string) tokens.push({ text, type: "string" });
      else if (comment) tokens.push({ text, type: "comment" });
      else if (option) tokens.push({ text, type: "attr-name" });
      else if (operator) {
        tokens.push({ text, type: "operator" });
        command = true;
      } else if (word && command) {
        tokens.push({ text, type: "function" });
        command = false;
      } else tokens.push({ text });
    }
    return tokens;
  });
  return (
    <pre className="pg-pre">
      <code>
        {lines.map((tokens, i) => (
          <div
            key={i}
            className="token-line"
            data-prompt={tokens[0]?.type === "function" ? "" : undefined}
          >
            {tokens.map((token, j) => (
              <span key={j} className={token.type ? `token ${token.type}` : undefined}>
                {token.text}
              </span>
            ))}
          </div>
        ))}
      </code>
    </pre>
  );
}

/** ?code expands all code blocks, convenient for screenshots */
const EXPAND_CODE = new URLSearchParams(window.location.search).has("code");

function CopyButton({ code }: { code: string }) {
  const t = useSiteT();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="pg-copy"
      aria-label={t("doc.copyCode")}
      onClick={() => {
        void navigator.clipboard?.writeText(code).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
    >
      {done ? <CheckIcon /> : <CopyIcon />}
      <span>{t(done ? "doc.copied" : "doc.copy")}</span>
    </button>
  );
}

/**
 * One docs-style example: title, description, then a framed box below - the top half is the preview canvas, the bottom half is collapsible code.
 * The title and description are the page's `<id>.title` / `<id>.description` messages.
 */
export function Example({ id, code, children }: { id: string; code: string; children: ReactNode }) {
  const t = usePageT();
  const desc = t.has(`${id}.description`) ? t.rich(`${id}.description`) : null;
  const site = useSiteT();
  const codeTheme = useCodeTheme();
  return (
    <section id={id} className="pg-example">
      <h3>{t(`${id}.title`)}</h3>
      {desc ? <p className="pg-desc">{desc}</p> : null}
      <div className="pg-frame">
        <div className="pg-preview">{children}</div>
        <details className="pg-code" data-code-theme={codeTheme} open={EXPAND_CODE}>
          <summary>
            <span className="pg-code-label">{site("doc.code")}</span>
          </summary>
          <CopyButton code={code} />
          <CodeBlock code={code} />
        </details>
      </div>
    </section>
  );
}

/** The code theme the reader picked (`data-code-theme`); none for the site's own colours. */
function useCodeTheme() {
  const theme = useSettings().codeTheme;
  return theme === "site" ? undefined : theme;
}

/* ------------------------------------------------------------- Guides: prose pages, no previews */

/** A guide's section: a TOC entry titled by the page's `<id>.title` message. */
export function GuideSection({ id, children }: { id: string; children: ReactNode }) {
  const t = usePageT();
  return (
    <section id={id} className="pg-example pg-guide-section">
      <h3>{t(`${id}.title`)}</h3>
      {children}
    </section>
  );
}

/** A paragraph: the page's message `k`, with its inline markup. */
export function P({ k }: { k: string }) {
  const t = usePageT();
  return <p className="pg-desc">{t.rich(k)}</p>;
}

/** A code sample on its own, with a copy button. `language`: tsx (the default), css, json…; `bash` is shown plain. */
export function Code({ code, language }: { code: string; language?: string }) {
  return (
    <div
      className={
        language === "bash" ? "pg-code pg-code--solo pg-code--shell" : "pg-code pg-code--solo"
      }
      data-code-theme={useCodeTheme()}
    >
      <CopyButton code={code} />
      <CodeBlock code={code} language={language} />
    </div>
  );
}

/** A plain table: `head` are message keys of the page, the cells are messages too (`` `code` `` and the like work). */
export function GuideTable({ head, rows }: { head: string[]; rows: string[][] }) {
  const t = usePageT();
  return (
    <div className="pg-table-wrap pg-guide-table">
      <table className="pg-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{t(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{rich(t.has(cell) ? t(cell) : cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Inline code: also syntax highlighted (types, strings in default values, keywords and type names all have colors) */
function InlineCode({ code }: { code: string }) {
  return (
    <Highlight code={code} language="tsx" theme={{ plain: {}, styles: [] }}>
      {({ tokens, getTokenProps }) => (
        <code className="pg-inline-code pg-pre">
          {tokens[0]?.map((token, key) => (
            <span key={key} {...getTokenProps({ token })} />
          ))}
        </code>
      )}
    </Highlight>
  );
}

/** A section heading: `children`, else the page's `<id>.title`, else the site's shared `toc.<id>` (examples, beyond, reference). */
export function DocHeading({ id, children }: { id: string; children?: ReactNode }) {
  const t = usePageT();
  const site = useSiteT();
  return (
    <h2 id={id} className="pg-doc-heading">
      {children ?? (t.has(`${id}.title`) ? t(`${id}.title`) : site(`toc.${id}`))}
    </h2>
  );
}

/** The paragraph under the page title: the page's `lead` message. */
export function Lead() {
  const t = usePageT();
  return <p className="pg-doc-lead">{t.rich("lead")}</p>;
}

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  /** Shown in the Default column instead of a value. */
  required?: boolean;
  description: ReactNode;
}

/** `first` / `second` rename the first two columns (Prop, Type), for tables of hooks, parts… */
export function PropsTable({
  rows,
  first,
  second,
}: {
  rows: PropRow[];
  first?: string;
  second?: string;
}) {
  const t = useSiteT();
  return (
    <div className="pg-table-wrap">
      <table className="pg-table">
        <thead>
          <tr>
            <th>{first ?? t("doc.prop")}</th>
            <th>{second ?? t("doc.type")}</th>
            <th>{t("doc.default")}</th>
            <th>{t("doc.description")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code className="pg-inline-code pg-inline-code--name">
                  {/* Several names ("data-variant / data-color"): a line breaks between them, never inside one */}
                  {row.name.split(" / ").map((name, i) => (
                    <Fragment key={name}>
                      {i > 0 ? " / " : null}
                      <span className="pg-nowrap">{name}</span>
                    </Fragment>
                  ))}
                </code>
              </td>
              <td>
                <InlineCode code={row.type} />
              </td>
              <td>
                {row.default ? (
                  <InlineCode code={row.default} />
                ) : row.required ? (
                  t("doc.required")
                ) : (
                  "-"
                )}
              </td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ManifestProp {
  type: string;
  description?: string;
  default?: string;
  required?: boolean;
  from?: string;
}
interface ApiComponent {
  props: Record<string, ManifestProp>;
  parts: Record<string, { props: Record<string, ManifestProp> }>;
}

/**
 * One component's props from the manifest, `/api/<Component>.json` (written by scripts/llms.ts): a few KB each,
 * where the whole manifest is 650 KB. Loaded once per component.
 */
const apiFiles = new Map<string, Promise<ApiComponent>>();
function loadApi(name: string) {
  let file = apiFiles.get(name);
  if (!file) {
    file = fetch(`/api/${name}.json`).then((response) => response.json() as Promise<ApiComponent>);
    apiFiles.set(name, file);
  }
  return file;
}

/**
 * The props of `component` (or of one of its parts, `Card.Header`) from @skeinui/ui's manifest: types, defaults
 * and descriptions come from the component's source, so the table can't drift from it. In Chinese the
 * descriptions are the page's `props.<Component>.<prop>` messages (English from the manifest when missing).
 */
export function ApiReference({ component }: { component: string }) {
  const t = usePageT();
  const site = useSiteT();
  const { lang } = useSettings();
  const [props, setProps] = useState<Record<string, ManifestProp> | null>(null);
  useEffect(() => {
    const [name, part] = component.split(".");
    void loadApi(name).then((api) => setProps(part ? api.parts[component]!.props : api.props));
  }, [component]);
  if (!props) return null;
  if (Object.keys(props).length === 0) return <p className="pg-desc">{site("doc.noProps")}</p>;
  const key = component.replace(".", "_");
  const rows = Object.entries(props).map(([name, p]) => ({
    name,
    type: p.type,
    default: p.default,
    required: p.required,
    description:
      lang === "zh-CN" && t.has(`props.${key}.${name}`)
        ? t.rich(`props.${key}.${name}`)
        : rich((p.description ?? "").replace(/\s*\n\s*/g, " ")),
  }));
  return (
    <>
      <PropsTable rows={rows} />
      <p className="pg-desc">{site("doc.otherProps")}</p>
    </>
  );
}
