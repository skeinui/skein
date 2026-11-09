import { NotificationBell } from "@skeinui/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchNotifications, markAllRead, markRead, notificationKeys } from "./api";

/**
 * Built-in tool "notifications": a bell with the unread count (NotificationBell). The list is
 * GET /api/notifications (mocks/handlers.ts).
 */
export function NotificationsTool() {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  // Asked again when the language changes: the server writes them in it
  const { data = [] } = useQuery({
    queryKey: [...notificationKeys.all, i18n.language],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  const readOne = useMutation({ mutationFn: markRead, onSuccess: refresh });
  const readAll = useMutation({ mutationFn: markAllRead, onSuccess: refresh });

  return (
    <NotificationBell
      items={data}
      locale={i18n.language}
      onRead={(item) => readOne.mutate(Number(item.id))}
      onReadAll={() => readAll.mutate()}
      readingAll={readAll.isPending}
    />
  );
}
