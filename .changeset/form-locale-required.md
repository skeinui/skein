---
"@skeinui/ui": patch
---

`Form` (and `FormDrawer` / `FormDialog`) show their validation messages in the language of the `ConfigProvider` (`labels.form.required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`, `url`; English and Chinese are in), they were always English unless `messages` was passed. A text of only spaces no longer satisfies `required`.
