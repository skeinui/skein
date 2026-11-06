---
"@skeinui/ui": patch
"@skeinui/themes": patch
---

Toast: `richColors` on `Toaster` (every typed toast) or on one toast (`toast.success("Saved", { richColors: true })`) tints info / success / warning / danger toasts in their color, like Sonner's rich colors: background, border and text in default and heroui (from their tokens) and shadcn (Sonner's own rich colors, shadcn/ui's toast being Sonner); antd follows its Alert (soft background, colored border and icon, text in the text color). Styled through `data-rich-colors`.
