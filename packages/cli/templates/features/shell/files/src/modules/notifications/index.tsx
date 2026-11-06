import { Badge, Button, Flex, List, Popover, Text } from "@skeinui/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { fetchNotifications, markAllRead, markRead, notificationKeys } from "./api";
import { useNotificationsTranslation } from "./locales";

/** "5 minutes ago" in the app's language. */
function ago(time: string, lang: string) {
  const minutes = Math.round((new Date(time).getTime() - Date.now()) / 60_000);
  const format = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
  if (Math.abs(minutes) < 60 * 24) return format.format(Math.round(minutes / 60), "hour");
  return format.format(Math.round(minutes / 60 / 24), "day");
}

/**
 * Built-in tool "notifications": a bell with the unread count; it opens the list, newest first, unread ones
 * dotted with a button that marks them read, and "Mark all as read". The list is GET /api/notifications (mocks/handlers.ts).
 */
export function NotificationsTool() {
  const { t, i18n } = useNotificationsTranslation();
  const queryClient = useQueryClient();
  // Asked again when the language changes: the server writes them in it
  const { data = [] } = useQuery({
    queryKey: [...notificationKeys.all, i18n.language],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  });
  const unread = data.filter((n) => !n.read).length;
  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  const readOne = useMutation({ mutationFn: markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: markAllRead, onSuccess: refresh });

  return (
    <Popover>
      <Popover.Trigger
        render={<Button variant="ghost" color="neutral" size="sm" iconOnly />}
        aria-label={unread > 0 ? `${t("title")} (${t("unread", { count: unread })})` : t("title")}
      >
        {/* Sized in styles/index.css (.notifications-count): the count over the bell's corner */}
        <span className="notifications-bell">
          <Bell size={16} />
          {unread > 0 ? (
            <span className="notifications-count">
              <Badge variant="solid" color="danger" size="sm" radius="full">
                {unread > 99 ? "99+" : unread}
              </Badge>
            </span>
          ) : null}
        </span>
      </Popover.Trigger>
      <Popover.Content align="end">
        <div className="notifications">
          <Flex align="center" justify="between" gap="md">
            <Text strong>{t("title")}</Text>
            {unread > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                loading={readAll.isPending}
                onClick={() => readAll.mutate()}
              >
                {t("readAll")}
              </Button>
            ) : null}
          </Flex>
          <List
            size="sm"
            empty={t("empty")}
            items={data.map((n) => ({
              key: String(n.id),
              avatar: <span className="notifications-dot" data-unread={!n.read || undefined} />,
              title: n.title,
              description: n.description,
              extra: <Text tone="secondary">{ago(n.time, i18n.language)}</Text>,
              actions: n.read
                ? []
                : [
                    <Button
                      key="read"
                      variant="ghost"
                      color="neutral"
                      size="sm"
                      iconOnly
                      aria-label={t("markRead")}
                      onClick={() => readOne.mutate(n.id)}
                    >
                      <Check size={14} />
                    </Button>,
                  ],
            }))}
          />
        </div>
      </Popover.Content>
    </Popover>
  );
}
