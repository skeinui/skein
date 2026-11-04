import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";

// Every mocks/handlers.ts under src/ (pages and modules) registers itself: a new page needs no edit here
const modules = import.meta.glob<{ handlers: RequestHandler[] }>("../**/mocks/handlers.ts", {
  eager: true,
});
const handlers = Object.values(modules).flatMap((m) => m.handlers);

export function startMocking() {
  return setupWorker(...handlers).start({ onUnhandledFrame: "bypass", quiet: true });
}
