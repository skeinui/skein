# Accessibility scan (axe-core)

jsdom does no rendering, so axe's **color contrast**, obscured elements and the role structure inside popups can only be
checked in a real browser. This opens the playground's full-page AdminLayout demo in a real Chrome, injects
[axe-core](https://github.com/dequelabs/axe-core) and scans every "style x light / dark x layout x state" combination,
**reporting only new violations**; known exceptions kept on purpose are listed in `known.json`, with a reason.

## Usage

Start the playground (port 5175) in another terminal first:

```sh
vp run skein-doc#dev
```

Then in `packages/ui`:

```sh
vp run a11y                                        # everything: 5 styles x light / dark x 6 layouts, each state of each layout
vp run a11y -- --styles=default,heroui             # only some styles
vp run a11y -- --modes=light --layouts=side,mix    # only light, some layouts
vp run a11y -- --all                               # list the known exceptions too (with reasons)
```

Environment variables: `A11Y_URL` (default `http://localhost:5175`), `A11Y_CHANNEL` (default `chrome`, the Chrome installed
on the machine, no browser download), `A11Y_WORKERS` (concurrency, default 3; lower it when the machine is busy).

Exit codes: `0` no new violations; `1` new violations; `2` the scan did not complete (server not running / a job still
failed after retries).

**Not part of `vp test`**: it needs the dev server and a real browser, which would slow down and destabilise the everyday
tests (same as `tests/visual`). Run it by hand after changing AdminLayout, menus, the tab bar, the sidebar and the like.

## States scanned

Each layout: desktop (1280px) expanded, and with the user menu open; sidebar layouts (side / side+header / boxed) also
collapsed, and collapsed + user menu; narrow screen (390px) with the navigation drawer open. `side+header` is the side
layout + `toolbar: "header"`.

## Reading the results

```
[serious] color-contrast | span[data-slot="page-tabs-title"]
    <span data-slot="page-tabs-title">仪表盘</span>
    Element has insufficient color contrast of 4.31 (…). Expected contrast ratio of 4.5:1
    found in: default/light/side/expanded, default/light/column/expanded … 24 in total
```

The same rule + the same target make one group, followed by the combinations it appears in (`style/mode/layout/state`).
The popup ids Base UI generates differ on every run and are normalised to `_r_*_`.

## Known exceptions (`known.json`)

Each entry names a **rule**, optionally narrowed to **styles / modes / states / target (regex)**, and must give a
**reason**. The current kinds:

- `region`: popups live in a portal, outside the page landmarks; a common axe issue with portals.
- `page-has-heading-one`: the scan covers a demo page whose content comes from the app.
- `color-contrast` in heroui / shadcn / antd: borderline values of the official palettes (3.8-4.43, 4.5 required), kept
  because styles follow the latest official version. The `default` style's palette is tuned for AA and has **no** such
  exceptions.
- The version number in the drawer: while the drawer slides in, axe picks up the mask color, a false positive.

For a new violation, decide first: if it is a library bug, fix the library; only if it is deliberately kept, add it to
`known.json` with a clear reason.

## Limits

- Only the states reachable in the full-page AdminLayout demo are scanned: popups of other components such as Dialog
  and DatePicker are not covered.
- axe finds roughly a third of accessibility issues automatically: smooth keyboard use and sensible screen reader
  announcements still need a human check.
- Color contrast depends on render timing: popups / drawers have enter animations and the script waits for them, but
  on a very busy machine it may occasionally report a false positive; run it again before deciding.
