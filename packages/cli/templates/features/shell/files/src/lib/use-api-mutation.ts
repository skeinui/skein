import { toast } from "@skeinui/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryKey, UseMutationOptions } from "@tanstack/react-query";

export interface ApiMutationOptions<TData, TVariables> extends UseMutationOptions<
  TData,
  Error,
  TVariables
> {
  /** Query keys asked again when it succeeds: the lists and details it changed (`userKeys.all`). */
  invalidate?: readonly QueryKey[];
  /** The message of the toast on success: a text, or one made from the result and what was sent. No toast when omitted. */
  success?: string | ((data: TData, variables: TVariables) => string);
}

/**
 * `useMutation` with what every change on a page does: a failure is shown as a toast (the message of the error), a success as a toast
 * of your words, and the queries it changed are asked again. `onSuccess` / `onError` still run after that, for what is yours (closing a dialog).
 */
export function useApiMutation<TData = unknown, TVariables = void>({
  invalidate,
  success,
  onSuccess,
  onError,
  ...options
}: ApiMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  return useMutation<TData, Error, TVariables>({
    ...options,
    onSuccess: (...args) => {
      const [data, variables] = args;
      if (success)
        toast.success(typeof success === "function" ? success(data, variables) : success);
      for (const queryKey of invalidate ?? []) void queryClient.invalidateQueries({ queryKey });
      return onSuccess?.(...args);
    },
    onError: (...args) => {
      toast.danger(args[0].message);
      return onError?.(...args);
    },
  });
}
