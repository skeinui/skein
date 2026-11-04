import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Viewer } from "./viewer.tsx";
import type { ImageLabels, ViewerItem } from "./viewer.tsx";
import { en } from "../../locales/en.ts";
import { useConfig } from "../config-provider/context.ts";

export type { ImageLabels };

export type ImageStatus = "loading" | "loaded" | "error";

interface Registered extends ViewerItem {
  id: string;
  el: HTMLElement | null;
  open: () => void;
}
interface GroupCtx {
  register: (entry: Registered) => () => void;
  openAt: (id: string) => void;
  labels: ImageLabels;
}
const GroupContext = createContext<GroupCtx | null>(null);

export interface ImageProps {
  /** Image URL. */
  src: string;
  /** Alternative text; also the accessible name of the preview button. Use "" for a decorative image. */
  alt: string;
  /** Width / height of the image (pixels, written as attributes on `<img>`). */
  width?: number;
  /** Height in pixels, written on `<img>` (see `width`). */
  height?: number;
  /** Shown on load failure: a string is used as a fallback image address, a node is shown directly. */
  fallback?: string | ReactNode;
  /** Placeholder shown while loading: if omitted it is the theme style's placeholder block, `false` shows no placeholder. */
  placeholder?: ReactNode | false;
  /**
   * Click to enlarge for preview (zoom, rotate, drag; inside `Image.PreviewGroup` you can also switch).
   * @default true
   */
  preview?: boolean;
  /** Address of the large image used in the preview, uses `src` if omitted. */
  previewSrc?: string;
  /**
   * Browser-native lazy loading.
   * @default "lazy"
   */
  loading?: "lazy" | "eager";
  /** Called when the image has loaded. */
  onLoad?: () => void;
  /** Called when the image fails to load (after the `fallback` image, if any, failed too). */
  onError?: () => void;
  /** Preview-related text, English by default. */
  labels?: Partial<ImageLabels>;
}

/**
 * Image: a placeholder while loading, a fallback image or content on failure, click for fullscreen preview (zoom, rotate, drag, switch when grouped).
 * With preview, the whole image is a button (named from `alt`), Enter / Space opens it; the preview uses Dialog, with focus trapping and Esc to close.
 */
function ImageRoot({
  src,
  alt,
  width,
  height,
  fallback,
  placeholder,
  preview = true,
  previewSrc,
  loading = "lazy",
  onLoad,
  onError,
  labels: labelsProp,
}: ImageProps) {
  const group = useContext(GroupContext);
  const id = useId();
  const [status, setStatus] = useState<ImageStatus>("loading");
  const [useFallback, setUseFallback] = useState(false);
  const [open, setOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const config = useConfig();
  const labels = { ...en.labels.image, ...config.labels?.image, ...group?.labels, ...labelsProp };

  const fallbackSrc = typeof fallback === "string" ? fallback : undefined;
  const shownSrc = useFallback && fallbackSrc ? fallbackSrc : src;

  // Restart when src changes; the image may have finished loading before hydration / mount (cached) and onLoad will not fire again, so check explicitly
  useLayoutEffect(() => {
    setUseFallback(false);
    setStatus("loading");
  }, [src]);
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
  }, [shownSrc]);

  const canPreview = preview && status === "loaded";
  const openPreview = useCallback(() => (group ? group.openAt(id) : setOpen(true)), [group, id]);

  // When in a group, register yourself so the group knows which images there are and in what order
  // (only once loaded: failed images should not appear in the preview; after loading the root element changes from span to button, so re-register)
  useEffect(() => {
    if (!group || !canPreview) return;
    return group.register({
      id,
      src: previewSrc ?? src,
      alt,
      el: rootRef.current,
      open: openPreview,
    });
  }, [group, canPreview, id, previewSrc, src, alt, openPreview]);

  const img = (
    <img
      ref={imgRef}
      data-slot="image-img"
      src={shownSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      onLoad={() => {
        setStatus("loaded");
        onLoad?.();
      }}
      onError={() => {
        if (fallbackSrc && !useFallback) {
          setUseFallback(true);
          return;
        }
        setStatus("error");
        onError?.();
      }}
    />
  );
  const failed = status === "error";
  const body = (
    <>
      {failed && !fallbackSrc ? (
        <span data-slot="image-fallback" role="img" aria-label={alt}>
          {fallback ?? (
            <svg
              viewBox="0 0 24 24"
              width="1em"
              height="1em"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </span>
      ) : null}
      {failed && !fallbackSrc ? null : img}
      {status === "loading" && placeholder !== false ? (
        <span data-slot="image-placeholder" aria-hidden="true">
          {placeholder}
        </span>
      ) : null}
      {canPreview ? (
        <span data-slot="image-mask" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {labels.preview}
        </span>
      ) : null}
    </>
  );

  return (
    <>
      {canPreview ? (
        <button
          ref={rootRef as React.RefObject<HTMLButtonElement>}
          type="button"
          data-slot="image"
          data-status={status}
          data-preview=""
          aria-haspopup="dialog"
          onClick={openPreview}
        >
          {body}
        </button>
      ) : (
        <span ref={rootRef} data-slot="image" data-status={status}>
          {body}
        </span>
      )}
      {!group && canPreview ? (
        <Viewer
          items={[{ src: previewSrc ?? src, alt }]}
          index={0}
          onIndexChange={() => {}}
          open={open}
          onOpenChange={setOpen}
          labels={labels}
        />
      ) : null}
    </>
  );
}

export interface ImagePreviewGroupProps {
  children: ReactNode;
  /** Preview-related text, used by all images in the group (a single image can also override it). */
  labels?: Partial<ImageLabels>;
}

/** Groups several images: in the preview you can switch among them with the left / right keys or the buttons on both sides. */
function ImagePreviewGroup({ children, labels: labelsProp }: ImagePreviewGroupProps) {
  const [entries, setEntries] = useState<Registered[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const config = useConfig();
  const labels = useMemo(
    () => ({ ...en.labels.image, ...config.labels?.image, ...labelsProp }),
    [config.labels?.image, labelsProp],
  );

  const register = useCallback((entry: Registered) => {
    setEntries((list) => [...list.filter((e) => e.id !== entry.id), entry]);
    return () => setEntries((list) => list.filter((e) => e.id !== entry.id));
  }, []);
  // Sort by their order on the page (the registration order does not necessarily match the page order)
  const ordered = [...entries].sort((a, b) => {
    if (!a.el || !b.el) return 0;
    return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });
  // The value must be stable: the children's registration effect depends on it, and a new object on every render would loop forever as "register → re-render → register again"
  const ctx = useMemo(() => ({ register, openAt: setCurrent, labels }), [register, labels]);
  const index = Math.max(
    0,
    ordered.findIndex((e) => e.id === current),
  );

  return (
    <GroupContext.Provider value={ctx}>
      {children}
      <Viewer
        items={ordered}
        index={index}
        onIndexChange={(i) => setCurrent(ordered[i]?.id ?? null)}
        open={current !== null}
        onOpenChange={(next) => {
          if (!next) setCurrent(null);
        }}
        labels={labels}
      />
    </GroupContext.Provider>
  );
}

export const Image = Object.assign(ImageRoot, { PreviewGroup: ImagePreviewGroup });
