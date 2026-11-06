---
"@skeinui/ui": patch
"@skeinui/themes": patch
---

Toast: closer to Sonner. `closeButton` on the `Toaster` or a toast shows or hides the close button (default: shown); `icon` on a toast and `icons` on the `Toaster` replace the type icons (a default toast can have one too); `toast.custom((id) => …)` puts content of your own in a toast, the frame and close button staying. The room kept for the close button is only reserved when there is one. (Sonner's `expand` is `layout="list"`.)
