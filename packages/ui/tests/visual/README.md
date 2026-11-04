# Visual regression (size / color snapshots)

jsdom does no layout and can't measure sizes or rendered colors, so "did changing the radius / density / colors / layering
break the default appearance" is checked by this script: it opens the playground in a real Chrome, measures the **width,
height, background color and radius** of every `data-slot` element on each component page, compares them with the
baseline stored in the repo and reports only what changed.

## Usage

First start the playground in another terminal (port 5175):

```sh
vp run skein-doc#dev
```

Then in `packages/ui`:

```sh
vp run snapshot                                   # compare everything; exit code 1 on differences, listing what changed on which slots
vp run snapshot -- --update                       # write the current result as the new baseline (once the changes are confirmed as intended)
vp run snapshot -- --styles=heroui,antd           # measure only some theme styles
vp run snapshot -- --pages=card,table --update    # measure only some pages; with --update only these pages change, the rest is kept
vp run snapshot -- --verbose                      # print progress and slow pages
```

Environment variables: `SNAPSHOT_URL` (default `http://localhost:5175`), `SNAPSHOT_CHANNEL` (default `chrome`, uses the
Chrome installed on the machine, no browser download), `SNAPSHOT_WORKERS` (concurrency, default 4; lower it when the machine is busy).

A run takes a few minutes (about 4–5 minutes on an idle machine, 8 or more on a busy one; 5 theme styles × 3 batches + six
AdminLayout layouts). **It is not part of `vp test`**: it needs a running dev server and a real browser, which would slow
down everyday tests and make them less stable.

## What the baseline holds

`tests/visual/baseline/`:

| File                                             | Contents                                                                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<style>-light.json` / `<style>-dark.json`       | `slot｜width｜height｜background｜radius` of the elements on each component page (plus the overlays opened from dialog / popover / select / menu / date-picker / combobox), default density                               |
| `<style>-compact.json`                           | Same, light + `compact` density, only `slot｜width｜height` (to see whether density takes effect and whether density changes broke the default appearance)                                                                |
| `admin-layout-<style>-light.json` / `-dark.json` | The same measurements of AdminLayout, Sidebar, PageTabs, SideMenu and Breadcrumb under the AdminLayout root in each AdminLayout layout (side / side-header (= side + toolbar in the header) / top / mix / column / boxed) |

Each page is a **deduplicated, sorted set** without counts, so how many times a component appears doesn't affect the
comparison; widths and heights are rounded to 0.5px. Elements that keep moving or appear asynchronously (spinners,
progress rings, avatar fallbacks, streaming markdown, KaTeX formulas, image placeholders…) aren't measured, see
`IGNORE_SLOTS` in the script; the mermaid page renders asynchronously and the agenda page depends on the current date, so
neither is in the page list. AdminLayout waits until the width of `admin-layout-body` is the same twice in a row (the
sidebar transition has finished) before measuring.

## Reading the result

```
✗ default-light / card: 2 removed, 2 added
    - card/outline|185.5|70|rgb(248, 250, 252)|10px
    + card/outline|185.5|70|rgb(255, 255, 255)|10px
```

`-` is in the baseline but not now, `+` is there now but not in the baseline. The entry above says: in the default style,
light mode, the card background changed from `#f8fafc` to white. If that's the change you wanted, `--update`; if not, it's
a regression, fix the CSS.

## Limitations

- Only layout and colors are measured, not shadows, fonts, animations or hover / focus states.
- Relies on the dev server's pages rendering reliably; if a page in a batch fails to measure, the whole run exits with an
  error (exit code 2) and no partial baseline is written.
- Different local fonts make text widths differ by about 0.5px: generate and compare baselines on the same machine / with
  the same fonts.
