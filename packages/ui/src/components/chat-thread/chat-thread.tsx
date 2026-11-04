import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Button } from "../button/index.ts";
import type { ButtonProps } from "../button/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

interface ThreadContext {
  atBottom: boolean;
  scrollToBottom: (options?: { smooth?: boolean }) => void;
}
const ThreadContext = createContext<ThreadContext | null>(null);

/** Reads "is at bottom" and "scroll to bottom" inside ChatThread, for a custom back-to-bottom button. */
export function useChatThread(): ThreadContext {
  const ctx = useContext(ThreadContext);
  if (!ctx) throw new Error("useChatThread must be used inside <ChatThread>");
  return ctx;
}

export interface ChatThreadProps extends Omit<Without<ComponentPropsWithoutRef<"div">>, "role"> {
  /** Name of the scroll area, for screen readers, default "Conversation". */
  "aria-label"?: string;
  /**
   * How close to the bottom (pixels) still counts as "at the bottom"; when at the bottom, new content automatically scrolls along.
   * @default 64
   */
  stickThreshold?: number;
  children?: ReactNode;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Scroll area of the conversation (`role="log"`, new messages are announced by screen readers): sticky-bottom scrolling: when the user is at the bottom, as content grows (streaming output, new messages) it scrolls to the bottom;
 * when the user scrolls up to read history it does not disturb, and a "back to bottom" button appears (put a `ChatThread.ScrollButton`).
 * Put it in a parent with a height; it fills it and scrolls inside. The container is keyboard focusable so arrow keys can scroll it (WCAG 2.1.1).
 */
function ChatThreadRoot({
  "aria-label": labelProp,
  stickThreshold = 64,
  children,
  ...rest
}: ChatThreadProps) {
  const t = useLabels("chatThread");
  const label = labelProp ?? t.conversation;
  const ref = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  const distance = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight;
  const jump = useCallback((smooth: boolean) => {
    const el = ref.current;
    if (!el) return;
    if (smooth && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const near = distance(el) <= stickThreshold;
    stuck.current = near;
    setAtBottom(near);
  };

  // When content grows, if it was already stuck to the bottom, scroll to the bottom with it
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    jump(false);
    if (typeof ResizeObserver === "undefined") return;
    const sizes = new ResizeObserver(() => {
      if (stuck.current) jump(false);
    });
    const watch = () => {
      sizes.disconnect();
      for (const child of el.children) sizes.observe(child);
    };
    watch();
    const mutations =
      typeof MutationObserver === "undefined"
        ? null
        : new MutationObserver(() => {
            watch();
            if (stuck.current) jump(false);
          });
    mutations?.observe(el, { childList: true });
    return () => {
      sizes.disconnect();
      mutations?.disconnect();
    };
  }, [jump]);

  const value = useMemo<ThreadContext>(
    () => ({
      atBottom,
      scrollToBottom: (options) => {
        stuck.current = true;
        jump((options?.smooth ?? true) && !prefersReducedMotion());
      },
    }),
    [atBottom, jump],
  );

  return (
    <ThreadContext.Provider value={value}>
      <div
        {...rest}
        ref={ref}
        role="log"
        aria-label={label}
        tabIndex={0}
        data-slot="chat-thread"
        data-at-bottom={atBottom ? "" : undefined}
        onScroll={onScroll}
      >
        {children}
      </div>
    </ThreadContext.Provider>
  );
}

/** Centered message column: limits the maximum width and leaves spacing between messages. */
function ChatThreadContent(props: Without<ComponentPropsWithoutRef<"div">>) {
  return <div {...props} data-slot="chat-thread-content" />;
}

export interface ChatThreadScrollButtonProps extends Omit<
  ButtonProps,
  "variant" | "color" | "size" | "iconOnly" | "radius" | "onClick" | "aria-label"
> {
  /** Name of the button, default "Scroll to bottom". */
  "aria-label"?: string;
}

/** Back-to-bottom button: appears only when not at the bottom; clicking scrolls to the bottom and sticks to it again. Put it inside ChatThread, after the message column. */
function ChatThreadScrollButton({
  "aria-label": labelProp,
  children,
  ...rest
}: ChatThreadScrollButtonProps) {
  const t = useLabels("chatThread");
  const label = labelProp ?? t.scrollToBottom;
  const { atBottom, scrollToBottom } = useChatThread();
  if (atBottom) return null;
  return (
    <div data-slot="chat-thread-scroll-button-wrap">
      <Button
        variant="outline"
        color="neutral"
        size="sm"
        iconOnly
        radius="full"
        aria-label={label}
        {...rest}
        onClick={() => scrollToBottom()}
      >
        {children ?? (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        )}
      </Button>
    </div>
  );
}

export const ChatThread = Object.assign(ChatThreadRoot, {
  Content: ChatThreadContent,
  ScrollButton: ChatThreadScrollButton,
});
