import type { ReactNode } from "react";
import type { NotificationBellLabels } from "../../locales/messages.ts";
import { useLabels } from "../../locales/use-labels.ts";
import { Badge } from "../badge/index.ts";
import { Button } from "../button/index.ts";
import { Flex } from "../layout/index.ts";
import { List } from "../list/index.ts";
import { Popover } from "../popover/index.ts";
import { RelativeTime } from "../relative-time/index.ts";
import { ScrollArea } from "../scroll-area/index.ts";
import { Text } from "../typography/index.ts";

export interface NotificationItem {
  /** Identifies the notification; reported back to `onRead` and `onOpen`. */
  id: string | number;
  /** What happened. */
  title: ReactNode;
  /** More about it, under the title. */
  description?: ReactNode;
  /** When it happened: shown as "3 hours ago". */
  time?: Date | string | number;
  /** Already read: it has no dot and no "mark as read" button. */
  read?: boolean;
  /** Has something to open (a ticket, an order): its open button is shown when `onOpen` is given. */
  canOpen?: boolean;
}

export interface NotificationBellProps {
  /** The notifications, newest first (the order is yours). */
  items: readonly NotificationItem[];
  /** A notification's "mark as read" button was pressed; shown on unread ones when this is given. */
  onRead?: (item: NotificationItem) => void;
  /** "Mark all as read" was pressed; shown while there is something unread when this is given. */
  onReadAll?: () => void;
  /** A notification's open button was pressed; shown on those with `canOpen` when this is given. */
  onOpen?: (item: NotificationItem) => void;
  /** "Mark all as read" is being done: its button spins. */
  readingAll?: boolean;
  /**
   * The largest number the badge shows as is.
   * @default 99
   */
  max?: number;
  /** BCP 47 tag for the times (e.g. "zh-CN"); defaults to the `locale` of ConfigProvider. */
  locale?: string;
  /** Texts, for another language. */
  labels?: Partial<NotificationBellLabels>;
  /** Open state of the list: controlled / uncontrolled initial value / change callback. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    width={16}
    height={16}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const bellIcon = (
  <Icon>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);

/**
 * Notification bell: a bell with the number of unread notifications that opens the list, unread ones dotted with a button that marks them read, an open button for those with something to
 * open, and "Mark all as read". `items` are the notifications; what pressing a button does is yours (`onRead`, `onReadAll`, `onOpen`), a button appears when its callback is given.
 * For the list alone use List; for a count on another element use Badge.
 */
export function NotificationBell({
  items,
  onRead,
  onReadAll,
  onOpen,
  readingAll,
  max,
  locale,
  labels,
  open,
  defaultOpen,
  onOpenChange,
}: NotificationBellProps) {
  const t = { ...useLabels("notificationBell"), ...labels };
  const unread = items.filter((n) => !n.read).length;
  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={(next) => onOpenChange?.(next)}>
      <Popover.Trigger
        render={<Button variant="ghost" color="neutral" size="sm" iconOnly />}
        // "Notifications, 2 unread": the number is a word of its own, so the visible count is part of the name
        aria-label={unread > 0 ? `${t.title}, ${t.unread(unread)}` : t.title}
      >
        <Badge count={unread} max={max} size="sm">
          {bellIcon}
        </Badge>
      </Popover.Trigger>
      <Popover.Content align="end" aria-label={t.title}>
        <div data-slot="notification-bell">
          <Flex direction="column" gap="sm">
            <Flex align="center" justify="between" gap="md">
              <Flex align="center" gap="sm">
                {bellIcon}
                <Text strong>{t.title}</Text>
              </Flex>
              {unread > 0 && onReadAll ? (
                <Button variant="ghost" size="sm" loading={readingAll} onClick={onReadAll}>
                  {t.readAll}
                </Button>
              ) : null}
            </Flex>
            <ScrollArea>
              <List
                size="sm"
                empty={t.empty}
                items={items.map((n) => ({
                  key: String(n.id),
                  avatar: n.read ? undefined : <Badge dot size="sm" color="primary" />,
                  title: n.title,
                  description: n.description,
                  extra:
                    n.time === undefined ? undefined : (
                      <Text tone="secondary">
                        <RelativeTime value={n.time} locale={locale} />
                      </Text>
                    ),
                  actions: [
                    onOpen && n.canOpen ? (
                      <Button
                        key="open"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        iconOnly
                        aria-label={t.open}
                        onClick={() => onOpen(n)}
                      >
                        <Icon>
                          <path d="M15 3h6v6" />
                          <path d="M10 14 21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </Icon>
                      </Button>
                    ) : null,
                    onRead && !n.read ? (
                      <Button
                        key="read"
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        iconOnly
                        aria-label={t.markRead}
                        onClick={() => onRead(n)}
                      >
                        <Icon>
                          <path d="M20 6 9 17l-5-5" />
                        </Icon>
                      </Button>
                    ) : null,
                  ],
                }))}
              />
            </ScrollArea>
          </Flex>
        </div>
      </Popover.Content>
    </Popover>
  );
}
