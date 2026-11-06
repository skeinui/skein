{{#if mock}}
import { http, HttpResponse } from "msw";
import type { Notification } from "../api";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

// Server content comes in the language the app asks for (Accept-Language, set by lib/http.ts)
const TEXT = {
  zh: [
    ["新订单待审核", "订单 SO-1042 已提交，等待你的审核。"],
    ["库存预警", "商品「无线鼠标」库存低于 10 件。"],
    ["系统维护通知", "本周六 02:00–04:00 系统维护，期间可能无法访问。"],
    ["新成员加入", "李雷 已加入你的团队。"],
    ["报表已生成", "10 月销售报表已生成，可在报表页查看。"],
  ],
  en: [
    ["New order to review", "Order SO-1042 was submitted and waits for your review."],
    ["Low stock", "Wireless Mouse is below 10 in stock."],
    ["Scheduled maintenance", "The system is down for maintenance Saturday 02:00–04:00."],
    ["New member", "Li Lei joined your team."],
    ["Report ready", "The October sales report is ready on the reports page."],
  ],
};
const AGO = [5, 42, 180, 60 * 26, 60 * 24 * 3];
// Which ones are read: kept for the browser tab's session, so marking them read survives a reload
const READ_KEY = "mock-notifications-read";
const read = new Set<number>(JSON.parse(sessionStorage.getItem(READ_KEY) ?? "[3,4]"));
const save = () => sessionStorage.setItem(READ_KEY, JSON.stringify([...read]));

const list = (lang: "zh" | "en"): Notification[] =>
  TEXT[lang].map(([title, description], i) => ({
    id: i,
    title,
    description,
    time: minutesAgo(AGO[i]),
    read: read.has(i),
  }));

export const handlers = [
  http.get("*/api/notifications", ({ request }) =>
    HttpResponse.json({
      data: list(request.headers.get("Accept-Language")?.startsWith("zh") ? "zh" : "en"),
    }),
  ),
  http.post("*/api/notifications/read-all", () => {
    for (let i = 0; i < AGO.length; i++) read.add(i);
    save();
    return HttpResponse.json({ data: null });
  }),
  http.post("*/api/notifications/:id/read", ({ params }) => {
    read.add(Number(params.id));
    save();
    return HttpResponse.json({ data: null });
  }),
];
{{/if}}
