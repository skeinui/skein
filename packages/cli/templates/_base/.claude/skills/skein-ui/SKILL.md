---
name: skein-ui
description: Build or change UI in this app with Skein UI components (@skeinui/ui). Use whenever writing JSX that uses Skein components, laying out a page, building a form, table, dialog or menu, or styling anything.
---

# Building UI with Skein

1. **Find the component.** `npx skein docs --search <words>` (e.g. `date`, `upload`, `tree`), then `npx skein docs <Component>` for its props, allowed values, parts (`Card.Header`, `Dialog.Content`…) and examples. Don't guess props: the examples show the intended use.
2. **Write it the Skein way.**
   - No `className` / `style` on Skein components. Layout: `<Flex direction="column" gap="md">`, `<Grid columns={3} gap="md">`, `Row` / `Col`. For anything else wrap in your own element with a class.
   - Variants are values: `<Button variant="outline" color="danger" size="sm">`. Only listed values exist.
   - Data first: `<Form fields={[{ name, label, type, required, options }]} onSubmit />`, `<Select options />`, `<Pagination page pageSize total onPageChange />`, `Table` with `Table.Header` / `Table.Row` / `Table.Cell`.
   - Controlled: `value` + `onValueChange`, `open` + `onOpenChange`.
   - Values are shown by components, not formatted by hand: dates `<DateText value dateStyle timeStyle>` (`formatDateText` for a string, `weekday` for a day of the week), numbers, percentages and money `<NumberText value format precision>` (`formatNumberText`), "5 minutes ago" `<RelativeTime>`; initials `<Avatar name>`; a labelled control `<Field label description>`. They follow the app's language: no `Intl.DateTimeFormat` or `Math.round(x * 100)` in a page.
   - Messages to the user: `toast.success(…)` / `toast.danger(…)` from `@skeinui/ui`; confirmations: `<ConfirmButton question onConfirm>` for a button that asks first, `<Popconfirm title onConfirm>` around anything else.
3. **Your own CSS** (`src/styles/index.css` or a file next to the page) uses tokens only: `var(--ui-fg)`, `var(--ui-fg-muted)`, `var(--ui-bg)`, `var(--ui-surface)`, `var(--ui-border)`, `var(--ui-c-primary)`, `var(--ui-radius)`. No hex colors.
4. **Check.** `npm run check` — fix every error; its hints say how Skein wants it done.
{{#if preview}}
5. **Look at it.** `npx skein preview <route>` opens the page in Chrome: fix every exception, console error and failed request it lists, then read the screenshot it saved to see the layout is right.
{{/if}}
