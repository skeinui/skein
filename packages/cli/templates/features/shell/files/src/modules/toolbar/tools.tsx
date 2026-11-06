import type { ComponentType } from "react";
import { LanguageSwitch } from "./language-switch";
import { ModeSwitch } from "./mode-switch";

/**
 * The tools a toolbar can show, by id; `settings.toolbar` lists which ones, in which order. Add one of your own
 * here (e.g. `help: HelpButton`, a small ghost icon Button like the built-in ones), then put its id in
 * `settings.toolbar.header` or `.login`.
 */
export const TOOLS: Record<string, ComponentType> = {
  language: LanguageSwitch,
  mode: ModeSwitch,
};
