import http from "@/lib/http";

export interface Notification {
  id: number;
  title: string;
  description?: string;
  /** ISO time it was sent. */
  time: string;
  read: boolean;
}

export const notificationKeys = { all: ["notifications"] as const };

/** The signed-in user's notifications, newest first. */
export const fetchNotifications = () => http.get<Notification[]>("/api/notifications");

export const markRead = (id: number) => http.post<null>(`/api/notifications/${id}/read`);

export const markAllRead = () => http.post<null>("/api/notifications/read-all");
