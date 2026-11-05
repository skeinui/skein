import { Dialog, Form, toast } from "@skeinui/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { USER_ROLES, USER_STATUSES, createUser, updateUser, userKeys } from "../api";
import type { User, UserInput } from "../api";
import { useUsersTranslation } from "../locales";

/** Creates a user (`user` is null) or edits one; closed when `user` is undefined. */
export function UserFormDialog({
  user,
  onClose,
}: {
  user: User | null | undefined;
  onClose: () => void;
}) {
  const { t } = useUsersTranslation();
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (input: UserInput) => (user ? updateUser(user.id, input) : createUser(input)),
    onSuccess: (saved) => {
      toast.success(t(user ? "updated" : "created", { user: saved.name }));
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      onClose();
    },
    onError: (error) => toast.danger(error.message),
  });

  return (
    <Dialog open={user !== undefined} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Title>{user ? t("editTitle") : t("createTitle")}</Dialog.Title>
        <Form
          // A new form for every user, so the default values apply
          key={user?.id ?? "new"}
          defaultValues={user ? { ...user } : { role: "viewer", status: "active" }}
          fields={[
            { name: "name", label: t("col.name"), required: true, minLength: 2 },
            { name: "email", label: t("col.email"), type: "email", required: true },
            {
              name: "role",
              label: t("col.role"),
              type: "select",
              required: true,
              options: USER_ROLES.map((r) => ({ value: r, label: t(`role.${r}`) })),
            },
            {
              name: "status",
              label: t("col.status"),
              type: "segmented",
              options: USER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
            },
          ]}
          submitLabel={t("save")}
          onSubmit={(values) =>
            save.mutateAsync(values as unknown as UserInput).then(
              () => undefined,
              () => undefined,
            )
          }
        />
      </Dialog.Content>
    </Dialog>
  );
}
