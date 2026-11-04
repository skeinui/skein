import { QueryClient } from "@tanstack/react-query";
import { HttpError } from "@/lib/http";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 4xx won't succeed on a retry (no permission, bad input, not found): retry only network errors / 5xx, once
      retry: (failureCount, error) => {
        if (error instanceof HttpError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
