import type { ComponentType } from "react";
import { NotificationsTool } from "../notifications";
import { LanguageSwitch } from "./language-switch";
import { ModeSwitch } from "./mode-switch";
import { SearchTool } from "./search";

/**
 * The tools a toolbar can show, by id; `settings.toolbar` lists which ones, in which order. Add one of your own
 * here (e.g. `help: HelpButton`, a small ghost icon Button like the built-in ones), then put its id in
 * `settings.toolbar.header` or `.login`.
 */
export const TOOLS: Record<string, ComponentType> = {
  search: SearchTool,
  notifications: NotificationsTool,
  language: LanguageSwitch,
  mode: ModeSwitch,
};
