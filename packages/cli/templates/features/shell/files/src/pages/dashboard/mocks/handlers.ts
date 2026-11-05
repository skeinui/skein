{{#if mock}}
import { http, HttpResponse, delay } from "msw";
import { usersOf } from "@/pages/users/mocks/users-data";

export const handlers = [
  http.get("*/api/dashboard/stats", async ({ request }) => {
    await delay(200);
    const users = usersOf(request);
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
