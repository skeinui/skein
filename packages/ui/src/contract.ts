/**
 * The contract between components and theme styles.
 *
 * Components only write the values listed here as `data-*` attributes, and theme styles only write styles for those attributes;
 * both sides go by this file. `tests/theme-style.test.ts` uses it to check whether each theme style misses any entry,
 * so when adding a variant / color / token, change this first and the test will tell you which theme styles need filling in.
 */

/** Semantic colors. What color each actually is is decided by the theme style (in the shadcn theme style, primary is near black). */
export const COLORS = ["neutral", "primary", "secondary", "success", "warning", "danger"] as const;
export type UIColor = (typeof COLORS)[number];

export const SIZES = ["sm", "md", "lg"] as const;
export type UISize = (typeof SIZES)[number];

/** Border radius steps. Decided by the theme style when omitted; the exact values come from the --ui-radius-* tokens. */
export const RADII = ["none", "sm", "md", "lg", "full"] as const;
export type UIRadius = (typeof RADII)[number];

export const ORIENTATIONS = ["horizontal", "vertical"] as const;
export type UIOrientation = (typeof ORIENTATIONS)[number];

/**
 * Variants are neutrally named, and each theme style decides how to draw them. Mapping to HeroUI v2:
 * solid=solid, soft=flat, outline=bordered, ghost=light, faded=faded, shadow=shadow;
 * v3 only has solid / soft / outline / ghost among them.
 */
export const BUTTON_VARIANTS = ["solid", "soft", "outline", "ghost", "faded", "shadow"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

/**
 * Look of form controls: outline is a regular input with a background / border, filled is a gray filled background.
 * In HeroUI v3 they are called primary / secondary, and in shadcn filled corresponds to secondary's background.
 */
export const FIELD_VARIANTS = ["outline", "filled"] as const;
export type FieldVariant = (typeof FIELD_VARIANTS)[number];

/** Structural hooks rendered by Button, which theme styles select with `[data-slot="..."]`. */
export const BUTTON_SLOTS = ["button", "button-start", "button-end", "button-spinner"] as const;

/**
 * Structural hooks of ButtonGroup. Buttons in the group handle seams with :first-child / :last-child and do not depend on extra attributes;
 * button-group-separator is placed inside a button, and the consumer decides which seams get a divider line.
 */
export const BUTTON_GROUP_SLOTS = ["button-group", "button-group-separator"] as const;

/** Field: assembles the label, control, description and error message into one form item. */
export const FIELD_SLOTS = ["field", "field-label", "field-description", "field-error"] as const;

export const INPUT_SLOTS = [
  "input",
  "textarea",
  "input-group",
  "input-group-input",
  "input-group-prefix",
  "input-group-suffix",
] as const;

/** Extra parts that the input group variants (password / search / tags) add on top of input-group. */
export const INPUT_ADDON_SLOTS = [
  "input-group-action",
  "input-group-tags",
  "textarea-wrapper",
  "textarea-count",
] as const;

export const CHECKBOX_SLOTS = [
  "checkbox",
  "checkbox-control",
  "checkbox-indicator",
  "checkbox-checkmark",
  "checkbox-indeterminate",
  "checkbox-content",
  "checkbox-label",
  "checkbox-description",
  "checkbox-group",
] as const;

export const RADIO_SLOTS = [
  "radio",
  "radio-control",
  "radio-indicator",
  "radio-content",
  "radio-label",
  "radio-description",
  "radio-group",
] as const;

export const SWITCH_SLOTS = [
  "switch",
  "switch-control",
  "switch-thumb",
  "switch-content",
  "switch-label",
  "switch-description",
] as const;

/** Overlay placement: which side of the trigger element it appears on and how it aligns along that side. */
export const OVERLAY_SIDES = ["top", "right", "bottom", "left"] as const;
export type OverlaySide = (typeof OVERLAY_SIDES)[number];

export const OVERLAY_ALIGNS = ["start", "center", "end"] as const;
export type OverlayAlign = (typeof OVERLAY_ALIGNS)[number];

/** Width steps of the dialog. */
export const DIALOG_SIZES = ["xs", "sm", "md", "lg", "full"] as const;
export type DialogSize = (typeof DIALOG_SIZES)[number];

/** Structural hooks of overlay components. Overlays are all portaled to <body>, so theme style attributes must be on <html> to take effect. */
export const TOOLTIP_SLOTS = ["tooltip", "tooltip-positioner", "tooltip-arrow"] as const;

export const POPOVER_SLOTS = [
  "popover",
  "popover-positioner",
  "popover-arrow",
  "popover-title",
  "popover-description",
  "popover-close",
] as const;

export const DIALOG_SLOTS = [
  "dialog-backdrop",
  "dialog-viewport",
  "dialog",
  "dialog-title",
  "dialog-description",
  "dialog-body",
  "dialog-footer",
  "dialog-close",
] as const;

export const MENU_SLOTS = [
  "menu",
  "menu-positioner",
  "menu-item",
  "menu-checkbox-item",
  "menu-item-indicator",
  "menu-separator",
  "menu-group",
  "menu-group-label",
] as const;

export const SELECT_SLOTS = [
  "select-trigger",
  "select-value",
  "select-icon",
  "date-input",
  "select-positioner",
  "select",
  "select-list",
  "select-item",
  "select-item-text",
  "select-item-indicator",
  "select-group",
  "select-group-label",
] as const;

/** Badge / Avatar / Card / Tabs / Separator / loading indicator (batch 3). */
export const BADGE_PLACEMENTS = ["top-end", "top-start", "bottom-end", "bottom-start"] as const;
export type BadgePlacement = (typeof BADGE_PLACEMENTS)[number];
export const BADGE_SLOTS = ["badge", "badge-indicator"] as const;

export const AVATAR_SLOTS = ["avatar", "avatar-image", "avatar-fallback", "avatar-group"] as const;

export const CALLOUT_VARIANTS = ["outline", "soft", "dashed"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];
export const CALLOUT_SLOTS = ["callout"] as const;

export const CARD_VARIANTS = ["outline", "filled", "elevated"] as const;
export type CardVariant = (typeof CARD_VARIANTS)[number];
export const CARD_SLOTS = [
  "card",
  "card-header",
  "card-title",
  "card-description",
  "card-body",
  "card-footer",
] as const;

export const SPINNER_SLOTS = ["spinner"] as const;
export const SEPARATOR_SLOTS = ["separator"] as const;

export const TABS_VARIANTS = ["underline", "solid", "soft"] as const;
export type TabsVariant = (typeof TABS_VARIANTS)[number];
export const TABS_SLOTS = [
  "tabs",
  "tabs-list",
  "tabs-tab",
  "tabs-indicator",
  "tabs-panel",
] as const;

/** Toast / Progress (batch 4). */
export const TOAST_TYPES = ["default", "info", "success", "warning", "danger", "loading"] as const;
export type ToastType = (typeof TOAST_TYPES)[number];
export const TOAST_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;
export type ToastPosition = (typeof TOAST_POSITIONS)[number];
/** Flat: one row per toast; stacked: later ones tuck beneath the front one and expand on hover. */
export const TOAST_LAYOUTS = ["list", "stack"] as const;
export type ToastLayout = (typeof TOAST_LAYOUTS)[number];
export const TOAST_SLOTS = [
  "toast-viewport",
  "toast",
  "toast-icon",
  "toast-content",
  "toast-title",
  "toast-description",
  "toast-action",
  "toast-close",
] as const;

export const PROGRESS_TYPES = ["line", "circle", "dashboard"] as const;
export type ProgressType = (typeof PROGRESS_TYPES)[number];
export const PROGRESS_SLOTS = [
  "progress",
  "progress-header",
  "progress-label",
  "progress-value",
  "progress-track",
  "progress-indicator",
  "progress-circle-body",
  "progress-circle",
  "progress-circle-track",
  "progress-circle-indicator",
  "progress-circle-value",
] as const;

/** Table / Pagination (batch 5). */
export const TABLE_ALIGNS = ["start", "center", "end"] as const;
export type TableAlign = (typeof TABLE_ALIGNS)[number];
export const TABLE_SORTS = ["asc", "desc"] as const;
export type TableSort = (typeof TABLE_SORTS)[number];
export const TABLE_SLOTS = [
  "table-container",
  "table",
  "table-header",
  "table-body",
  "table-footer",
  "table-row",
  "table-head",
  "table-sort-button",
  "table-head-content",
  "table-sort-icon",
  "table-cell",
  "table-caption",
  "table-empty",
  "table-resize-handle",
  "table-expand-button",
  "table-expanded-row",
  "table-expanded-cell",
  "table-edit-trigger",
  "table-edit-error",
] as const;

export const TABLE_FIXED = ["start", "end"] as const;
export type TableFixed = (typeof TABLE_FIXED)[number];

export const PAGINATION_VARIANTS = ["simple", "pages"] as const;
export type PaginationVariant = (typeof PAGINATION_VARIANTS)[number];
export const PAGINATION_SLOTS = [
  "pagination",
  "pagination-info",
  "pagination-controls",
  "pagination-page-info",
  "pagination-nav",
  "pagination-pages",
  "pagination-ellipsis",
  "pagination-size",
] as const;

/** Alert / Skeleton / Breadcrumb / Accordion / Slider (batch 6). AlertDialog reuses Dialog's slots. */
export const ALERT_VARIANTS = ["soft", "outline", "solid"] as const;
export type AlertVariant = (typeof ALERT_VARIANTS)[number];
export const ALERT_SLOTS = [
  "alert",
  "alert-icon",
  "alert-content",
  "alert-title",
  "alert-description",
  "alert-action",
  "alert-close",
] as const;

export const SKELETON_SHAPES = ["text", "circle", "rect"] as const;
export type SkeletonShape = (typeof SKELETON_SHAPES)[number];
export const SKELETON_SLOTS = ["skeleton", "skeleton-group"] as const;

export const BREADCRUMB_SLOTS = [
  "breadcrumb",
  "breadcrumb-list",
  "breadcrumb-item",
  "breadcrumb-link",
  "breadcrumb-icon",
  "breadcrumb-page",
  "breadcrumb-separator",
] as const;

export const ACCORDION_VARIANTS = ["divided", "bordered", "filled"] as const;
export type AccordionVariant = (typeof ACCORDION_VARIANTS)[number];
export const ACCORDION_SLOTS = [
  "accordion",
  "accordion-item",
  "accordion-header",
  "accordion-trigger",
  "accordion-icon",
  "accordion-panel",
  "accordion-content",
] as const;

export const SLIDER_SLOTS = [
  "slider",
  "slider-header",
  "slider-label",
  "slider-value",
  "slider-control",
  "slider-track",
  "slider-indicator",
  "slider-thumb",
] as const;

/** Toggle / NumberField / OtpField / Combobox / Drawer (batch 7). Combobox's popup reuses Select's slots. */
export const TOGGLE_VARIANTS = ["ghost", "outline", "soft"] as const;
export type ToggleVariant = (typeof TOGGLE_VARIANTS)[number];
export const TOGGLE_SLOTS = ["toggle", "toggle-group"] as const;

export const NUMBER_FIELD_SLOTS = [
  "number-field",
  "number-field-group",
  "number-field-input",
  "number-field-decrement",
  "number-field-increment",
] as const;

export const OTP_FIELD_SLOTS = ["otp-field", "otp-input", "otp-separator"] as const;

export const COMBOBOX_SLOTS = ["combobox-trigger", "combobox-empty"] as const;

export const DRAWER_SIDES = ["left", "right", "top", "bottom"] as const;
export type DrawerSide = (typeof DRAWER_SIDES)[number];
export const DRAWER_SIZES = ["sm", "md", "lg", "full"] as const;
export type DrawerSize = (typeof DRAWER_SIZES)[number];
export const DRAWER_SLOTS = ["drawer", "drawer-content"] as const;

/** Calendar / DatePicker / ScrollArea / ContextMenu / PreviewCard (batch 8). DatePicker, ContextMenu and PreviewCard reuse the slots of existing components. */
export const CALENDAR_MODES = ["single", "range", "week"] as const;
export type CalendarMode = (typeof CALENDAR_MODES)[number];
export const CALENDAR_SLOTS = [
  "calendar",
  "calendar-header",
  "calendar-title",
  "calendar-nav-button",
  "calendar-grid",
  "calendar-weekday",
  "calendar-week",
  "calendar-cell",
  "calendar-day",
  "calendar-periods",
  "calendar-period-row",
  "calendar-period",
] as const;

export const SCROLL_AREA_SLOTS = [
  "scroll-area",
  "scroll-area-viewport",
  "scroll-area-scrollbar",
  "scroll-area-thumb",
  "scroll-area-corner",
] as const;

/** Fieldset / Toolbar / Menubar / NavigationMenu (batch 9). Meter reuses Progress's slots, and Autocomplete reuses Input's and Select's slots. */
export const FIELDSET_SLOTS = ["fieldset", "fieldset-legend"] as const;
export const TOOLBAR_SLOTS = ["toolbar", "toolbar-group"] as const;
export const MENUBAR_SLOTS = ["menubar", "menubar-trigger"] as const;
export const NAVIGATION_MENU_SLOTS = [
  "navigation-menu",
  "navigation-menu-list",
  "navigation-menu-item",
  "navigation-menu-trigger",
  "navigation-menu-icon",
  "navigation-menu-link",
  "navigation-menu-content",
  "navigation-menu-positioner",
  "navigation-menu-popup",
  "navigation-menu-viewport",
] as const;

/** Tag / Kbd / Link / Empty / Stepper (batch 10). */
export const TAG_VARIANTS = ["soft", "outline", "solid"] as const;
export type TagVariant = (typeof TAG_VARIANTS)[number];
export const TAG_SLOTS = ["tag", "tag-label", "tag-remove"] as const;

export const KBD_SLOTS = ["kbd", "kbd-group"] as const;

export const LINK_VARIANTS = ["default", "subtle"] as const;
export type LinkVariant = (typeof LINK_VARIANTS)[number];
export const LINK_SLOTS = ["link"] as const;

export const EMPTY_SLOTS = [
  "empty",
  "empty-icon",
  "empty-title",
  "empty-description",
  "empty-actions",
] as const;

export const STEPPER_SLOTS = [
  "stepper",
  "stepper-step",
  "stepper-trigger",
  "stepper-indicator",
  "stepper-content",
  "stepper-title",
  "stepper-description",
  "stepper-connector",
] as const;
export type StepStatus = "complete" | "current" | "upcoming" | "error";

export const TREE_SLOTS = [
  "tree",
  "tree-item",
  "tree-row",
  "tree-toggle",
  "tree-checkbox",
  "tree-spinner",
  "tree-icon",
  "tree-label",
  "tree-group",
  "tree-match",
  "tree-empty",
] as const;

export const UPLOAD_VARIANTS = ["dropzone", "button"] as const;
export type UploadVariant = (typeof UPLOAD_VARIANTS)[number];
export const UPLOAD_SLOTS = [
  "upload",
  "upload-trigger",
  "upload-icon",
  "upload-title",
  "upload-hint",
  "upload-list",
  "upload-item",
  "upload-item-icon",
  "upload-item-ext",
  "upload-item-name",
  "upload-item-meta",
  "upload-item-progress",
  "upload-item-error",
  "upload-item-action",
] as const;
export type UploadFileStatus = "uploading" | "done" | "error";

export const CASCADER_SLOTS = [
  "cascader",
  "cascader-trigger",
  "cascader-value",
  "cascader-icon",
  "cascader-clear",
  "cascader-tags",
  "cascader-search",
  "cascader-columns",
  "cascader-spinner",
  "cascader-option-check",
  "cascader-panel",
  "cascader-menu",
  "cascader-option",
  "cascader-option-label",
  "cascader-option-arrow",
  "cascader-empty",
] as const;

export const TREESELECT_SLOTS = [
  "treeselect",
  "treeselect-trigger",
  "treeselect-value",
  "treeselect-icon",
  "treeselect-clear",
  "treeselect-tags",
  "treeselect-panel",
  "treeselect-search",
  "treeselect-tree",
] as const;

export const SORTABLE_VARIANTS = ["tile", "list"] as const;
export type SortableVariant = (typeof SORTABLE_VARIANTS)[number];
export const SORTABLE_ORIENTATIONS = ["vertical", "horizontal"] as const;
export type SortableOrientation = (typeof SORTABLE_ORIENTATIONS)[number];
export const NOTIFICATION_BELL_SLOTS = ["notification-bell"] as const;
export const QUERY_BUILDER_SLOTS = [
  "query-builder",
  "query-builder-chip",
  "query-builder-editor",
  "query-builder-group",
  "query-builder-group-head",
  "query-builder-lead",
  "query-builder-empty",
  "query-builder-row",
  "query-builder-value",
] as const;

export const TABLE_TOOLS_SLOTS = ["table-tools", "table-tools-columns"] as const;

export const SORTABLE_SLOTS = [
  "sortable-root",
  "sortable",
  "sortable-item",
  "sortable-handle",
  "sortable-content",
  "sortable-status",
] as const;

export const MARQUEE_DIRECTIONS = ["start", "end"] as const;
export type MarqueeDirection = (typeof MARQUEE_DIRECTIONS)[number];
export const MARQUEE_SLOTS = [
  "marquee",
  "marquee-viewport",
  "marquee-track",
  "marquee-content",
  "marquee-pause",
] as const;

export const BORDER_BEAM_TRIGGERS = ["always", "hover"] as const;
export type BorderBeamTrigger = (typeof BORDER_BEAM_TRIGGERS)[number];
export const BORDER_BEAM_SLOTS = ["border-beam", "border-beam-layer", "border-beam-beam"] as const;

export const ASPECT_RATIO_SLOTS = ["aspect-ratio"] as const;

export const SCROLL_SHADOW_ORIENTATIONS = ["vertical", "horizontal"] as const;
export type ScrollShadowOrientation = (typeof SCROLL_SHADOW_ORIENTATIONS)[number];
export const SCROLL_SHADOW_SLOTS = ["scroll-shadow", "scroll-shadow-content"] as const;

export const MASONRY_SLOTS = ["masonry", "masonry-item"] as const;

export const TRANSFER_SLOTS = [
  "transfer",
  "transfer-list",
  "transfer-header",
  "transfer-title",
  "transfer-count",
  "transfer-search",
  "transfer-body",
  "transfer-item",
  "transfer-label",
  "transfer-empty",
  "transfer-actions",
] as const;

export const COLOR_FORMATS = ["hex", "rgb", "hsb"] as const;
export type ColorFormat = (typeof COLOR_FORMATS)[number];

export const COLOR_PICKER_SLOTS = [
  "colorpicker-trigger",
  "colorpicker-swatch",
  "colorpicker-value",
  "colorpicker-panel",
  "colorpicker-area",
  "colorpicker-area-thumb",
  "colorpicker-controls",
  "colorpicker-sliders",
  "colorpicker-preview",
  "colorpicker-hue",
  "colorpicker-hue-thumb",
  "colorpicker-alpha",
  "colorpicker-alpha-thumb",
  "colorpicker-formats",
  "colorpicker-input",
  "colorpicker-field",
  "colorpicker-presets",
  "colorpicker-preset",
] as const;

export const RATING_SLOTS = [
  "rating",
  "rating-item",
  "rating-icon",
  "rating-icon-fill",
  "rating-hit",
] as const;

export const SEGMENTED_SLOTS = [
  "segmented",
  "segmented-thumb",
  "segmented-item",
  "segmented-icon",
  "segmented-label",
] as const;

export const MENTIONS_SLOTS = ["mentions", "mentions-list", "mentions-option"] as const;

export const TOUR_SLOTS = [
  "tour",
  "tour-mask",
  "tour-spotlight",
  "tour-center",
  "tour-card",
  "tour-close",
  "tour-cover",
  "tour-title",
  "tour-description",
  "tour-footer",
  "tour-indicators",
  "tour-indicator",
  "tour-actions",
] as const;

export const ANCHOR_SLOTS = [
  "anchor",
  "anchor-ink",
  "anchor-list",
  "anchor-item",
  "anchor-link",
] as const;

export const AFFIX_SLOTS = ["affix", "affix-content"] as const;

export const WATERMARK_SLOTS = ["watermark", "watermark-layer"] as const;

export const QRCODE_SLOTS = [
  "qrcode",
  "qrcode-svg",
  "qrcode-background",
  "qrcode-modules",
  "qrcode-icon",
  "qrcode-icon-bg",
  "qrcode-empty",
  "qrcode-mask",
  "qrcode-spinner",
  "qrcode-status",
] as const;

export const POPCONFIRM_SLOTS = [
  "popconfirm",
  "popconfirm-icon",
  "popconfirm-title",
  "popconfirm-description",
  "popconfirm-footer",
] as const;

export const RESULT_STATUSES = [
  "success",
  "error",
  "info",
  "warning",
  "403",
  "404",
  "500",
] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];
export const RESULT_SLOTS = [
  "result",
  "result-icon",
  "result-code",
  "result-title",
  "result-description",
  "result-extra",
  "result-content",
] as const;

export const STATISTIC_SLOTS = [
  "statistic",
  "statistic-title",
  "statistic-content",
  "statistic-prefix",
  "statistic-value",
  "statistic-suffix",
  "statistic-description",
  "statistic-skeleton",
  "statistic-text",
  "statistic-digits",
  "statistic-digit",
  "statistic-digit-strip",
  "statistic-char",
] as const;

export const DESCRIPTIONS_SLOTS = [
  "descriptions",
  "descriptions-header",
  "descriptions-title",
  "descriptions-extra",
  "descriptions-list",
  "descriptions-item",
  "descriptions-label",
  "descriptions-value",
] as const;

export const SPLITTER_SLOTS = [
  "splitter",
  "splitter-panel",
  "splitter-bar",
  "splitter-handle",
] as const;

export const CAROUSEL_SLOTS = [
  "carousel",
  "carousel-viewport",
  "carousel-track",
  "carousel-slide",
  "carousel-arrow",
  "carousel-dots",
  "carousel-dot",
  "carousel-pause",
] as const;
export const CAROUSEL_EFFECTS = ["slide", "fade"] as const;
export const CAROUSEL_DOT_POSITIONS = ["bottom", "top"] as const;

export const LIST_SLOTS = [
  "list",
  "list-header",
  "list-items",
  "list-item",
  "list-meta",
  "list-avatar",
  "list-content",
  "list-title",
  "list-description",
  "list-extra",
  "list-actions",
  "list-footer",
  "list-empty",
  "list-loading",
] as const;

export const COMMAND_SLOTS = [
  "command",
  "command-backdrop",
  "command-dialog",
  "command-input-wrap",
  "command-input",
  "command-list",
  "command-group",
  "command-group-title",
  "command-item",
  "command-icon",
  "command-label",
  "command-shortcut",
  "command-empty",
] as const;

export const IMAGE_SLOTS = [
  "image",
  "image-img",
  "image-placeholder",
  "image-fallback",
  "image-mask",
  "image-preview-backdrop",
  "image-preview",
  "image-preview-stage",
  "image-preview-img",
  "image-preview-toolbar",
  "image-preview-button",
  "image-preview-close",
  "image-preview-nav",
  "image-preview-counter",
] as const;

export const FLOATBUTTON_SLOTS = [
  "floatbutton",
  "floatbutton-icon",
  "floatbutton-label",
  "floatbutton-group",
] as const;
export const FLOATBUTTON_SHAPES = ["circle", "square"] as const;
export const FLOATBUTTON_VARIANTS = ["default", "primary"] as const;
export const FLOATBUTTON_CORNERS = ["bottom-end", "bottom-start", "top-end", "top-start"] as const;

export const COLLAPSIBLE_SLOTS = [
  "collapsible",
  "collapsible-trigger",
  "collapsible-icon",
  "collapsible-panel",
  "collapsible-content",
] as const;

export const SIDEMENU_SLOTS = [
  "sidemenu",
  "sidemenu-list",
  "sidemenu-item",
  "sidemenu-link",
  "sidemenu-icon",
  "sidemenu-label",
  "sidemenu-submenu",
  "sidemenu-trigger",
  "sidemenu-arrow",
  "sidemenu-panel",
  "sidemenu-panel-inner",
  "sidemenu-group",
  "sidemenu-group-title",
  "sidemenu-divider",
] as const;

export const FORM_SLOTS = ["form", "form-fields", "form-item", "form-actions"] as const;

/** Spacing scale; each theme style defines in layout.css the pixels each step corresponds to. */
export const GAPS = ["none", "xs", "sm", "md", "lg", "xl"] as const;
export type Gap = (typeof GAPS)[number];
/** Semantic elements that layout components can render as. */
export const LAYOUT_TAGS = [
  "div",
  "section",
  "article",
  "aside",
  "header",
  "footer",
  "main",
  "nav",
  "ul",
  "ol",
] as const;
export type LayoutTag = (typeof LAYOUT_TAGS)[number];
export const FLEX_SLOTS = ["flex", "flex-spacer"] as const;
/** InputGroup / SearchInput widths (10rem / 14rem / 20rem) for an input that need not fill its row. */
export const INPUT_WIDTHS = ["sm", "md", "lg"] as const;
export type InputWidth = (typeof INPUT_WIDTHS)[number];
/** Avatar sizes: the shared steps and `xs` (1.25rem) for a name in a dense line. */
export const AVATAR_SIZES = ["xs", "sm", "md", "lg"] as const;
export type AvatarSize = (typeof AVATAR_SIZES)[number];
export const GRID_ASIDES = ["start", "end"] as const;
export const GRID_ASIDE_WIDTHS = ["sm", "md", "lg"] as const;
export const GRID_SLOTS = ["grid", "grid-item", "row", "col"] as const;
/** Responsive breakpoints (minimum viewport width, px). Col's responsive props all use this set, shared by all theme styles. */
export const BREAKPOINTS = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600 } as const;
export type Breakpoint = keyof typeof BREAKPOINTS;
export const BREAKPOINT_NAMES = ["xs", "sm", "md", "lg", "xl", "xxl"] as const;
/** Number of grid columns of Row / Col. */
export const GRID_COLUMNS = 24;
export const LAYOUT_SLOTS = [
  "layout",
  "layout-header",
  "layout-content",
  "layout-footer",
  "container",
] as const;

export const TEXT_TONES = [
  "default",
  "secondary",
  "primary",
  "success",
  "warning",
  "danger",
  "disabled",
] as const;
export type TextTone = (typeof TEXT_TONES)[number];
/** Text / Paragraph type sizes; `md` is the default and writes nothing. */
export const TEXT_SIZES = ["xs", "sm", "md", "lg"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const TYPOGRAPHY_SLOTS = [
  "text",
  "title",
  "paragraph",
  "text-content",
  "text-copy",
  "text-expand",
  "typography",
] as const;

export const TIMEPICKER_SLOTS = [
  "timepanel",
  "timepanel-column",
  "timepanel-option",
  "timepanel-footer",
  "timepanel-footer-end",
  "datetime",
  "datetime-time",
] as const;

export const TIMELINE_SLOTS = [
  "timeline",
  "timeline-item",
  "timeline-time",
  "timeline-separator",
  "timeline-dot",
  "timeline-connector",
  "timeline-content",
  "timeline-title",
  "timeline-description",
] as const;

/** Four tokens each semantic color must provide in a theme style: solid background, text on solid, soft background, text / border on the soft background. */
export const COLOR_TOKEN_SUFFIXES = ["", "-fg", "-soft", "-text"] as const;

/**
 * "State colors" of each semantic color: hover, pressed, border. Most theme styles derive them from the base color with color-mix (so they change along when a theme changes the base color),
 * while theme styles with an exact palette (Ant Design) give the color values directly. They are only required in tokens.css; if they need to change in dark mode, override them again in dark.css.
 */
export const COLOR_STATE_SUFFIXES = ["-hover", "-active", "-border"] as const;

export const COLOR_STATE_TOKENS = COLORS.flatMap((c) =>
  COLOR_STATE_SUFFIXES.map((s) => `--ui-c-${c}${s}`),
);

/** Tokens that change with light / dark mode; a theme style's dark.css must provide all of them. */
export const MODE_TOKENS = [
  "--ui-bg",
  "--ui-surface",
  "--ui-fg",
  "--ui-fg-muted",
  "--ui-border",
  "--ui-ring",
  // Form controls: outline background / filled background / text / placeholder / border / shadow (the shadow also changes with mode)
  "--ui-field-bg",
  "--ui-field-filled-bg",
  "--ui-field-fg",
  "--ui-field-placeholder",
  "--ui-field-border",
  "--ui-field-shadow",
  // Overlays: background / border / shadow, the dialog's backdrop, and Tooltip's own background and text color (some theme styles use a dark bubble)
  "--ui-overlay-bg",
  "--ui-overlay-border",
  "--ui-overlay-shadow",
  "--ui-backdrop",
  "--ui-tooltip-bg",
  "--ui-tooltip-fg",
  ...COLORS.flatMap((c) => COLOR_TOKEN_SUFFIXES.map((s) => `--ui-c-${c}${s}`)),
] as const;

/** Tokens that do not change with mode (shape, density, font, motion); a theme style's tokens.css must provide them. */
export const SHAPE_TOKENS = [
  "--ui-font-family",
  "--ui-font-mono",
  "--ui-density",
  "--ui-radius",
  "--ui-radius-sm",
  "--ui-radius-md",
  "--ui-radius-lg",
  "--ui-radius-full",
  "--ui-height-sm",
  "--ui-height-md",
  "--ui-height-lg",
  "--ui-duration",
  "--ui-easing",
] as const;

/** All tokens a theme style's tokens.css must provide. */
export const REQUIRED_TOKENS = [...MODE_TOKENS, ...COLOR_STATE_TOKENS, ...SHAPE_TOKENS] as const;

/** Tokens a colour theme (@skeinui/themes/color/*.css) may override: values only, never derived values or shapes. */
export const THEME_OVERRIDABLE_TOKENS: readonly string[] = [
  ...MODE_TOKENS,
  ...COLOR_STATE_TOKENS,
  "--ui-font-family",
  "--ui-font-mono",
  "--ui-density",
  "--ui-radius",
  "--ui-duration",
  "--ui-easing",
];

/** AI Chat components (ShimmerText / Typing / CodeBlock / Markdown / ChatThread / ChatTurn / Reasoning / ToolCall / Citation / Attachment / Composer / Suggestions / ThreadList). */
export const SHIMMER_TEXT_SLOTS = [
  "shimmer-text",
  "shimmer-text-label",
  "shimmer-text-highlight",
] as const;

export const TYPING_VARIANTS = ["dots", "pulse", "spinner", "skeleton"] as const;
export type TypingVariant = (typeof TYPING_VARIANTS)[number];
export const TYPING_SLOTS = [
  "typing",
  "typing-dots",
  "typing-dot",
  "typing-pulse",
  "typing-spinner",
  "typing-avatar",
  "typing-lines",
  "typing-line",
] as const;

export const CODE_TOKENS = [
  "keyword",
  "string",
  "comment",
  "number",
  "property",
  "variable",
] as const;
export const CODE_BLOCK_SLOTS = [
  "code-block",
  "code-block-header",
  "code-block-language",
  "code-block-copy",
  "code-block-status",
  "code-block-pre",
  "code-block-code",
  "code-block-line",
] as const;

export const MARKDOWN_SLOTS = [
  "markdown",
  "markdown-inline-code",
  "markdown-link",
  "markdown-image",
  "markdown-task",
  "markdown-table-wrap",
  "markdown-caret",
  "markdown-math",
] as const;

export const CHAT_TURN_ROLES = ["assistant", "user"] as const;
export type ChatTurnRole = (typeof CHAT_TURN_ROLES)[number];
export const CHAT_TURN_SLOTS = [
  "chat-turn",
  "chat-turn-avatar",
  "chat-turn-body",
  "chat-turn-bubble",
  "chat-turn-content",
  "chat-turn-actions",
  "chat-turn-edit",
  "chat-turn-edit-textarea",
  "chat-turn-edit-actions",
  "chat-turn-pager",
  "chat-turn-pager-count",
  "chat-turn-status",
  "chat-turn-status-retry",
  "chat-turn-time",
] as const;

export const CHAT_THREAD_SLOTS = [
  "chat-thread",
  "chat-thread-content",
  "chat-thread-scroll-button-wrap",
] as const;

export const REASONING_STEP_STATUSES = ["done", "active", "pending"] as const;
export type ReasoningStepStatus = (typeof REASONING_STEP_STATUSES)[number];
export const REASONING_SLOTS = [
  "reasoning",
  "reasoning-trigger",
  "reasoning-icon",
  "reasoning-panel",
  "reasoning-content",
  "reasoning-steps",
  "reasoning-step",
  "reasoning-step-label",
  "reasoning-step-content",
] as const;

export const TOOL_CALL_STATES = [
  "input-streaming",
  "input-available",
  "output-available",
  "output-error",
  "requires-action",
] as const;
export type ToolCallState = (typeof TOOL_CALL_STATES)[number];
export const TOOL_CALL_SLOTS = [
  "tool-call",
  "tool-call-trigger",
  "tool-call-status",
  "tool-call-spinner",
  "tool-call-name",
  "tool-call-state",
  "tool-call-icon",
  "tool-call-panel",
  "tool-call-content",
  "tool-call-section",
  "tool-call-error",
  "tool-call-error-label",
  "tool-call-actions",
  "tool-call-group",
  "tool-call-group-trigger",
  "tool-call-group-panel",
  "tool-call-group-content",
] as const;

export const CITATION_TYPES = ["url", "document"] as const;
export type CitationType = (typeof CITATION_TYPES)[number];
export const CITATION_SLOTS = [
  "citation",
  "citation-marker",
  "citation-icon",
  "citation-favicon",
  "citation-fallback",
  "citation-title",
  "citation-preview",
  "citation-preview-head",
  "citation-preview-host",
  "citations",
  "citations-trigger",
  "citations-icon",
  "citations-panel",
  "citations-list",
] as const;

export const ATTACHMENT_VARIANTS = ["media", "file"] as const;
export type AttachmentVariant = (typeof ATTACHMENT_VARIANTS)[number];
export const ATTACHMENT_MEDIA_TYPES = ["image", "video", "audio", "document", "unknown"] as const;
export type AttachmentMediaType = (typeof ATTACHMENT_MEDIA_TYPES)[number];
export const ATTACHMENT_KINDS = [
  "image",
  "video",
  "audio",
  "pdf",
  "archive",
  "sheet",
  "doc",
  "code",
  "file",
] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];
export const ATTACHMENT_SLOTS = [
  "attachment",
  "attachment-preview",
  "attachment-image",
  "attachment-video",
  "attachment-icon",
  "attachment-info",
  "attachment-name",
  "attachment-size",
  "attachment-remove",
  "attachment-group",
] as const;

export const COMPOSER_STATUSES = ["idle", "streaming"] as const;
export type ComposerStatus = (typeof COMPOSER_STATUSES)[number];
export const COMPOSER_SLOTS = [
  "composer",
  "composer-shell",
  "composer-attachments",
  "composer-textarea",
  "composer-toolbar",
  "composer-toolbar-start",
  "composer-toolbar-end",
  "composer-footer",
] as const;

export const SUGGESTIONS_LAYOUTS = ["grid", "list", "chips"] as const;
export type SuggestionsLayout = (typeof SUGGESTIONS_LAYOUTS)[number];
export const SUGGESTIONS_SLOTS = [
  "suggestions",
  "suggestions-header",
  "suggestions-title",
  "suggestions-description",
  "suggestions-items",
  "suggestions-item",
  "suggestions-item-icon",
  "suggestions-item-text",
  "suggestions-item-title",
  "suggestions-item-description",
] as const;

export const THREAD_LIST_SLOTS = [
  "thread-list",
  "thread-list-items",
  "thread-list-item",
  "thread-list-icon",
  "thread-list-content",
  "thread-list-title",
  "thread-list-preview",
  "thread-list-meta",
  "thread-list-empty",
] as const;

export const MODEL_PICKER_SLOTS = [
  "model-picker-trigger",
  "model-picker-icon",
  "model-picker-name",
  "model-picker-caret",
  "model-picker-item-icon",
  "model-picker-item-body",
  "model-picker-item-name",
  "model-picker-item-badge",
  "model-picker-item-description",
] as const;

/** AI Chat tier two: Artifact / Plan / ContextMeter / Terminal / DiffView / WebPreview / Queue. */
export const ARTIFACT_SLOTS = [
  "artifact",
  "artifact-header",
  "artifact-title",
  "artifact-meta",
  "artifact-actions",
  "artifact-body",
  "artifact-card",
  "artifact-card-icon",
  "artifact-card-text",
  "artifact-card-title",
  "artifact-card-meta",
] as const;

export const PLAN_STATUSES = ["pending", "active", "done", "failed", "skipped"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];
export const PLAN_SLOTS = [
  "plan",
  "plan-trigger",
  "plan-title",
  "plan-count",
  "plan-chevron",
  "plan-bar",
  "plan-bar-fill",
  "plan-panel",
  "plan-items",
  "plan-item",
  "plan-item-icon",
  "plan-spinner",
  "plan-item-body",
  "plan-item-label",
  "plan-item-status",
  "plan-item-detail",
] as const;

export const CONTEXT_METER_LEVELS = ["ok", "warn", "danger"] as const;
export type ContextMeterLevel = (typeof CONTEXT_METER_LEVELS)[number];
export const CONTEXT_METER_SLOTS = [
  "context-meter",
  "context-meter-ring",
  "context-meter-track",
  "context-meter-value",
  "context-meter-percent",
  "context-meter-popup",
  "context-meter-heading",
  "context-meter-total",
  "context-meter-bar",
  "context-meter-segment",
  "context-meter-list",
  "context-meter-item",
  "context-meter-swatch",
  "context-meter-item-label",
  "context-meter-item-value",
] as const;

export const TERMINAL_STATUSES = ["running", "done", "error"] as const;
export type TerminalStatus = (typeof TERMINAL_STATUSES)[number];
export const TERMINAL_SLOTS = [
  "terminal",
  "terminal-header",
  "terminal-title",
  "terminal-status",
  "terminal-copy",
  "terminal-output",
  "terminal-line",
  "terminal-prompt",
  "terminal-text",
] as const;

export const DIFF_LINE_TYPES = ["add", "del", "ctx", "gap"] as const;
export type DiffLineType = "add" | "del" | "ctx";
export const DIFF_SLOTS = [
  "diff-view",
  "diff-header",
  "diff-file",
  "diff-stats",
  "diff-stat",
  "diff-empty",
  "diff-scroll",
  "diff-table",
  "diff-row",
  "diff-gutter",
  "diff-code",
  "diff-sign",
  "diff-label",
  "diff-gap",
  "diff-expand",
] as const;

export const WEB_PREVIEW_SLOTS = [
  "web-preview",
  "web-preview-toolbar",
  "web-preview-action",
  "web-preview-url",
  "web-preview-error",
  "web-preview-viewport",
  "web-preview-frame",
  "web-preview-loading",
] as const;

export const QUEUE_SLOTS = [
  "queue",
  "queue-header",
  "queue-title",
  "queue-count",
  "queue-empty",
  "queue-item",
  "queue-text",
  "queue-remove",
] as const;

export const QUOTE_SLOTS = [
  "quote",
  "quote-source",
  "quote-text",
  "quote-remove",
  "quote-selection",
  "quote-selection-action",
] as const;

export const MERMAID_STATES = ["loading", "ready", "error"] as const;
export const MERMAID_SLOTS = [
  "mermaid",
  "mermaid-header",
  "mermaid-title",
  "mermaid-actions",
  "mermaid-action",
  "mermaid-error",
  "mermaid-source",
  "mermaid-body",
  "mermaid-image",
  "mermaid-status",
] as const;

/** Code themes: used with `@skeinui/themes/code/*.css`. The first four follow light / dark mode, the last four are fixed dark. */
export const CODE_THEMES = [
  "github",
  "one",
  "solarized",
  "catppuccin",
  "dracula",
  "nord",
  "monokai",
  "tokyo-night",
] as const;
export type CodeTheme = (typeof CODE_THEMES)[number];

export const FEEDBACK_VALUES = ["up", "down"] as const;
export type FeedbackValue = (typeof FEEDBACK_VALUES)[number];
export const FEEDBACK_SLOTS = [
  "feedback",
  "feedback-group",
  "feedback-button",
  "feedback-form",
  "feedback-reasons",
  "feedback-legend",
  "feedback-reason",
  "feedback-comment",
  "feedback-submit",
  "feedback-thanks",
] as const;

export const SIDEBAR_VARIANTS = ["sidebar", "floating", "inset"] as const;
export type SidebarVariant = (typeof SIDEBAR_VARIANTS)[number];
export const SIDEBAR_COLLAPSIBLES = ["offcanvas", "icon", "none"] as const;
export type SidebarCollapsible = (typeof SIDEBAR_COLLAPSIBLES)[number];
export const SIDEBAR_SIDES = ["left", "right"] as const;
export type SidebarSide = (typeof SIDEBAR_SIDES)[number];
export const SIDEBAR_WIDTHS = ["sm", "md", "lg"] as const;
export type SidebarWidth = (typeof SIDEBAR_WIDTHS)[number];
export const SIDEBAR_SLOTS = [
  "sidebar-provider",
  "sidebar",
  "sidebar-gap",
  "sidebar-container",
  "sidebar-inner",
  "sidebar-header",
  "sidebar-content",
  "sidebar-footer",
  "sidebar-label",
  "sidebar-inset",
  "sidebar-trigger",
  "sidebar-rail",
] as const;

export const IMAGE_GRID_STATUSES = ["loading", "ready", "error"] as const;
export type ImageGridStatus = (typeof IMAGE_GRID_STATUSES)[number];
export const IMAGE_GRID_RATIOS = ["square", "landscape", "portrait", "wide"] as const;
export type ImageGridRatio = (typeof IMAGE_GRID_RATIOS)[number];
export const IMAGE_GRID_COLUMNS = [1, 2, 3, 4] as const;
export const IMAGE_GRID_SLOTS = [
  "image-grid",
  "image-grid-item",
  "image-grid-loading",
  "image-grid-status",
  "image-grid-progress",
  "image-grid-progress-bar",
  "image-grid-error",
  "image-grid-message",
  "image-grid-retry",
  "image-grid-actions",
  "image-grid-action",
  "image-grid-remove",
] as const;

/** Agenda (schedule view): three views, day / week / month; events have three forms: time blocks (placed by time in day / week views), bars (all-day / multi-day, spanning multiple columns), and dots (timed single-day events in month view). */
export const AGENDA_VIEWS = ["day", "week", "month"] as const;
export type AgendaView = (typeof AGENDA_VIEWS)[number];
export const AGENDA_EVENT_KINDS = ["block", "bar", "chip"] as const;
export type AgendaEventKind = (typeof AGENDA_EVENT_KINDS)[number];
export const AGENDA_SLOTS = [
  "agenda",
  "agenda-header",
  "agenda-title",
  "agenda-controls",
  "agenda-views",
  "agenda-nav",
  "agenda-body",
  "agenda-heads",
  "agenda-head",
  "agenda-head-name",
  "agenda-head-date",
  "agenda-allday",
  "agenda-allday-label",
  "agenda-allday-events",
  "agenda-scroll",
  "agenda-gutter",
  "agenda-hour",
  "agenda-columns",
  "agenda-column",
  "agenda-now",
  "agenda-event",
  "agenda-event-title",
  "agenda-event-time",
  "agenda-event-handle",
  "agenda-status",
  "agenda-month",
  "agenda-weekdays",
  "agenda-weekday",
  "agenda-week",
  "agenda-day",
  "agenda-day-number",
  "agenda-more",
] as const;

/** AdminLayout (full-page frame): six layouts are determined by `data-layout`; navigation item states such as selected / expanded use `data-active`, `data-collapsed`. */
export const ADMIN_LAYOUT_SLOTS = [
  "admin-layout",
  "admin-layout-header",
  "admin-layout-menu-button",
  "admin-layout-logo",
  "admin-layout-logo-mark",
  "admin-layout-settings",
  "admin-layout-settings-section",
  "admin-layout-settings-title",
  "admin-layout-settings-actions",
  "admin-layout-settings-error",
  "admin-layout-settings-heading",
  "admin-layout-settings-group",
  "admin-layout-settings-subtitle",
  "admin-layout-settings-row",
  "admin-layout-settings-presets",
  "admin-layout-settings-preset",
  "admin-layout-settings-dots",
  "admin-layout-settings-dot",
  "admin-layout-settings-name",
  "admin-layout-settings-styles",
  "admin-layout-settings-style",
  "admin-layout-settings-style-name",
  "admin-layout-settings-style-note",
  "admin-layout-settings-custom",
  "admin-layout-settings-delete",
  "admin-layout-settings-save-form",
  "admin-layout-settings-field",
  "admin-layout-settings-label",
  "admin-layout-settings-color",
  "admin-layout-settings-hint",
  "admin-layout-settings-clear",
  "admin-layout-context",
  "admin-layout-nav",
  "admin-layout-nav-item",
  "admin-layout-nav-icon",
  "admin-layout-nav-label",
  "admin-layout-nav-chevron",
  "admin-layout-breadcrumb",
  "admin-layout-actions",
  "admin-layout-row",
  "admin-layout-rail",
  "admin-layout-rail-item",
  "admin-layout-subnav",
  "admin-layout-subnav-toggle",
  "admin-layout-main",
  "admin-layout-background",
  "admin-layout-body",
  "admin-layout-bar",
  "admin-layout-bar-actions",
  "admin-layout-bar-button",
  "admin-layout-sidebar-trigger",
  "admin-layout-content",
  "admin-layout-footer",
  "admin-layout-drawer",
  "admin-layout-drawer-header",
] as const;

/** PageTabs (page tab bar): a row of closable, drag-sortable tabs, whose look is determined by `data-variant` (card / chrome / line). */
export const PAGE_TABS_SLOTS = [
  "page-tabs",
  "page-tabs-list",
  "page-tabs-item",
  "page-tabs-tab",
  "page-tabs-icon",
  "page-tabs-title",
  "page-tabs-close",
  "page-tabs-scroll",
  "page-tabs-status",
] as const;

/** KeepAlive: each item lives in its own pane, and the current one carries `data-active`. */
export const KEEP_ALIVE_SLOTS = ["keep-alive", "keep-alive-pane"] as const;

/** Kanban (board): columns + draggable cards. Cards and the status dots and tags in column headers all use semantic colors (data-color). */
export const KANBAN_SLOTS = [
  "kanban",
  "kanban-column",
  "kanban-header",
  "kanban-indicator",
  "kanban-title",
  "kanban-count",
  "kanban-column-menu",
  "kanban-rename",
  "kanban-expand",
  "kanban-body",
  "kanban-list",
  "kanban-item",
  "kanban-card",
  "kanban-card-editor",
  "kanban-card-delete",
  "kanban-label-editor",
  "kanban-label-remove",
  "kanban-label-add",
  "kanban-swatches",
  "kanban-swatch",
  "kanban-composer",
  "kanban-composer-actions",
  "kanban-add-column",
  "kanban-drag-preview",
  "kanban-card-title",
  "kanban-card-description",
  "kanban-card-labels",
  "kanban-label",
  "kanban-card-progress",
  "kanban-card-progress-track",
  "kanban-card-progress-bar",
  "kanban-card-progress-text",
  "kanban-card-footer",
  "kanban-empty",
  "kanban-add",
  "kanban-status",
] as const;

export const LOGIN_LAYOUT_VARIANTS = ["centered", "split", "cover"] as const;
export type LoginLayoutVariant = (typeof LOGIN_LAYOUT_VARIANTS)[number];
export const LOGIN_LAYOUT_SLOTS = [
  "login-layout",
  "login-layout-cover",
  "login-layout-cover-brand",
  "login-layout-cover-body",
  "login-layout-illustration",
  "login-layout-cover-title",
  "login-layout-cover-description",
  "login-layout-glow",
  "login-layout-backdrop",
  "login-layout-backdrop-image",
  "login-layout-main",
  "login-layout-toolbar",
  "login-layout-panel",
  "login-layout-card",
  "login-layout-head",
  "login-layout-brand",
  "login-layout-title",
  "login-layout-description",
  "login-layout-providers",
  "login-layout-divider",
  "login-layout-provider-list",
  "login-layout-footer",
] as const;
