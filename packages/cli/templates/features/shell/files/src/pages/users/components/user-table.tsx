import { DataTable, Tag } from "@skeinui/ui";
import type { ReactNode } from "react";
import { useAccess } from "@/modules/access";
import { RouterLink } from "@/skein-shell";
import type { User } from "../api";
import { useUsersTranslation } from "../locales";

/** The columns that can be hidden or moved (the actions, when there are any, are always last). */
export const USER_COLUMNS = ["name", "email", "role", "status", "createdAt"] as const;
export type UserColumn = (typeof USER_COLUMNS)[number];

export function UserTable({
  users,
  loading,
  columns: shown = USER_COLUMNS,
  stickyHeader,
  onEdit,
  onDelete,
}: {
  users: readonly User[];
  loading: boolean;
  /** The columns shown, in order. */
  columns?: readonly UserColumn[];
  /** Keep the header in view and scroll only the rows (in a parent with a height: `Card fill`). */
  stickyHeader?: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => Promise<void>;
}) {
  const { t, i18n } = useUsersTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });
  const { can } = useAccess();
  const canEdit = can("users:update");
  const canDelete = can("users:delete");
  const cell: Record<UserColumn, (user: User) => ReactNode> = {
    name: (user) => (
{{#if tenant}}
      // From the list's address, so the tenant is kept
      <RouterLink
        from="/$tenant/users"
        to="/$tenant/users/$id"
        params={(prev) => ({ ...prev, id: String(user.id) })}
      >
{{else}}
      <RouterLink to="/users/$id" params={{ id: String(user.id) }}>
{{/if}}
        {user.name}
      </RouterLink>
    ),
    email: (user) => user.email,
    role: (user) => t(`role.${user.role}`),
    status: (user) => (
      <Tag variant="soft" color={user.status === "active" ? "success" : "neutral"}>
        {t(`status.${user.status}`)}
      </Tag>
    ),
    createdAt: (user) => date.format(new Date(user.createdAt)),
  };
  return (
    <DataTable
      stickyHeader={stickyHeader}
      loading={loading}
      rows={users}
      rowKey={(user) => String(user.id)}
      empty={t("empty")}
      columns={shown.map((c) => ({ key: c, title: t(`col.${c}`), render: cell[c] }))}
      // Without either permission there is nothing to put in the actions column
      actions={
        canEdit || canDelete
          ? (user) => [
              canEdit && { key: "edit", label: t("edit"), onClick: () => onEdit(user) },
              canDelete && {
                key: "delete",
                label: t("delete"),
                color: "danger",
                confirm: {
                  title: t("deleteConfirm", { user: user.name }),
                  confirmLabel: t("delete"),
                  cancelLabel: t("cancel"),
                },
                onClick: () => onDelete(user),
              },
            ]
          : undefined
      }
    />
  );
}
