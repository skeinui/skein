import http from "@/lib/http";
import type { Paged, User } from "@/pages/users/api";

export interface DashboardStats {
  users: number;
  active: number;
  disabled: number;
  admins: number;
}

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
  recentUsers: ["dashboard", "recent-users"] as const,
};

export const fetchStats = () => http.get<DashboardStats>("/api/dashboard/stats");
export const fetchRecentUsers = () =>
  http.get<Paged<User>>("/api/users", { params: { page: 1, pageSize: 5 } }).then((p) => p.items);
