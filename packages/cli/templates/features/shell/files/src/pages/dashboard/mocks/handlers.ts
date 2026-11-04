{{#if mock}}
import { http, HttpResponse, delay } from "msw";
import { users } from "@/pages/users/mocks/users-data";

export const handlers = [
  http.get("*/api/dashboard/stats", async () => {
    await delay(200);
    return HttpResponse.json({
      data: {
        users: users.length,
        active: users.filter((u) => u.status === "active").length,
        disabled: users.filter((u) => u.status === "disabled").length,
        admins: users.filter((u) => u.role === "admin").length,
      },
    });
  }),
];
{{/if}}
