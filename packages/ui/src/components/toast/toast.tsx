import { Toast as BaseToast } from "@base-ui/react/toast";
import type { ReactNode } from "react";
import type { ToastLayout, ToastPosition, ToastType } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

/** Global toast manager: `toast.success("…")` can be called directly anywhere (in a component, in a request callback). */
const manager = BaseToast.createToastManager();

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  type?: ToastType;
  /** Milliseconds before auto close, 0 means no auto close. Default 5000. */
  timeout?: number;
  /** Action button: text + click callback. */
  action?: { label: ReactNode; onClick: () => void };
  /** Tint this toast in its type's color (info / success / warning / danger); overrides the Toaster's `richColors`. */
  richColors?: boolean;
  /** Icon of this toast, in place of its type's; also gives a `default` toast one. Overrides the Toaster's `icons`. */
  icon?: ReactNode;
  /** Show or hide this toast's close button; overrides the Toaster's `closeButton`. */
  closeButton?: boolean;
  onClose?: () => void;
}

interface ToastData {
  action?: { label: ReactNode; onClick: () => void };
  richColors?: boolean;
  icon?: ReactNode;
  closeButton?: boolean;
  /** `toast.custom`: the toast's whole content. */
  custom?: (id: string) => ReactNode;
}

function add({
  action,
  richColors,
  icon,
  closeButton,
  custom,
  ...options
}: ToastOptions & { custom?: ToastData["custom"] }) {
  const data: ToastData = { action, richColors, icon, closeButton, custom };
  return manager.add({
    ...options,
    type: options.type ?? "default",
    data,
    priority: options.type === "danger" ? "high" : "low",
  });
}

type Shorthand = (title: ReactNode, options?: Omit<ToastOptions, "title" | "type">) => string;
const shorthand =
  (type: ToastType): Shorthand =>
  (title, options) =>
    add({ ...options, title, type });

export const toast = Object.assign(
  (options: ToastOptions | ReactNode) => {
    const isOptions =
      typeof options === "object" && options !== null && !("$$typeof" in (options as object));
    return add(isOptions ? (options as ToastOptions) : { title: options as ReactNode });
  },
  {
    info: shorthand("info"),
    success: shorthand("success"),
    warning: shorthand("warning"),
    danger: shorthand("danger"),
    /** In progress: spinner, no auto close; finish afterwards with `toast.update(id, { type: "success", … })` or `toast.close(id)`. */
    loading: (title: ReactNode, options?: Omit<ToastOptions, "title" | "type">) =>
      add({ timeout: 0, ...options, title, type: "loading" }),
    /**
     * A toast with content of your own in place of the icon, title, description and action (the frame and the close
     * button stay): `render` gets the toast's id, e.g. to close it from a button of yours.
     */
    custom: (
      render: (id: string) => ReactNode,
      options?: Omit<ToastOptions, "title" | "description" | "type" | "icon" | "action">,
    ) => add({ ...options, custom: render }),
    close: (id?: string) => manager.close(id),
    update: manager.update,
    promise: manager.promise,
  },
);

export interface ToasterProps {
  /**
   * The corner the toasts appear in.
   * @default "bottom-right"
   */
  position?: ToastPosition;
  /**
   * list: flat, one row per toast; stack: stacked, expands on hover or focus.
   * @default "list"
   */
  layout?: ToastLayout;
  /**
   * Maximum number shown at once; extras are marked limited (the theme style decides how they collapse).
   * @default 3
   */
  limit?: number;
  /**
   * Default milliseconds before auto close.
   * @default 5000
   */
  timeout?: number;
  /**
   * Show a close button on every toast (a toast's own `closeButton` overrides it); without one a toast closes by
   * its timeout, by swiping or from code (`toast.close(id)`).
   * @default true
   */
  closeButton?: boolean;
  /**
   * Icons by type, in place of the built-in ones (a toast's own `icon` overrides them).
   */
  icons?: Partial<Record<Exclude<ToastType, "default">, ReactNode>>;
  /**
   * Tint info / success / warning / danger toasts in their color (background, border and text), like Sonner's rich colors;
   * otherwise only the icon is colored. A toast's own `richColors` overrides it.
   * @default false
   */
  richColors?: boolean;
}

const ICON_PATHS: Record<Exclude<ToastType, "default">, string> = {
  info: "M12 11v5M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  success: "m8 12 3 3 5-6M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  warning:
    "M12 9v4M12 17h.01M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z",
  danger: "m9 9 6 6m0-6-6 6M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  // A 3/4-circle arc, which the theme style spins
  loading: "M12 3a9 9 0 1 0 9 9",
};

/** The built-in icon of a typed toast. */
function TypeIcon({ type }: { type: Exclude<ToastType, "default"> }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICON_PATHS[type]} />
    </svg>
  );
}

function ToastList({
  richColors,
  closeButton,
  icons,
}: Required<Pick<ToasterProps, "richColors" | "closeButton">> & Pick<ToasterProps, "icons">) {
  const c = useLabels("common");
  const { toasts } = BaseToast.useToastManager<ToastData>();
  return toasts.map((item) => {
    const type = (item.type ?? "default") as ToastType;
    const { custom, icon: own, closeButton: ownClose } = item.data ?? {};
    const icon = own ?? (type === "default" ? null : (icons?.[type] ?? <TypeIcon type={type} />));
    return (
      <BaseToast.Root
        key={item.id}
        toast={item}
        data-slot="toast"
        data-type={type}
        data-rich-colors={(item.data?.richColors ?? richColors) || undefined}
      >
        {custom ? null : icon ? (
          <span data-slot="toast-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <BaseToast.Content data-slot="toast-content">
          {custom ? (
            custom(item.id)
          ) : (
            <>
              {item.title ? <BaseToast.Title data-slot="toast-title" /> : null}
              {item.description ? <BaseToast.Description data-slot="toast-description" /> : null}
              {item.data?.action ? (
                <BaseToast.Action data-slot="toast-action" onClick={item.data.action.onClick}>
                  {item.data.action.label}
                </BaseToast.Action>
              ) : null}
            </>
          )}
        </BaseToast.Content>
        {(ownClose ?? closeButton) ? (
          <BaseToast.Close data-slot="toast-close" aria-label={c.close}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </BaseToast.Close>
        ) : null}
      </BaseToast.Root>
    );
  });
}

/**
 * Toaster: shows the notifications raised with `toast` (`toast.success("Saved")`, `toast.loading(…)`, `toast.close(id)`).
 * Place it once at the app root; `position`, `layout` (list / stack), `limit` and `timeout` set where and how they appear,
 * `richColors` tints typed toasts in their color, `closeButton` and `icons` change the close button and the icons;
 * `toast.custom(render)` puts content of your own in a toast.
 * For a message that stays on the page use Alert; for a decision use Dialog / ConfirmDialog.
 *
 * Theme style: toasts render in a Portal, so data-skein-theme must be set on <html> (ConfigProvider does it).
 */
export function Toaster({
  position = "bottom-right",
  layout = "list",
  limit = 3,
  timeout = 5000,
  richColors = false,
  closeButton = true,
  icons,
}: ToasterProps) {
  const c = useLabels("common");
  return (
    <BaseToast.Provider toastManager={manager} limit={limit} timeout={timeout}>
      <BaseToast.Portal>
        <BaseToast.Viewport
          data-slot="toast-viewport"
          // Base UI's own is "Notifications" in every language
          aria-label={c.notifications}
          data-position={position}
          data-layout={layout}
        >
          <ToastList richColors={richColors} closeButton={closeButton} icons={icons} />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
