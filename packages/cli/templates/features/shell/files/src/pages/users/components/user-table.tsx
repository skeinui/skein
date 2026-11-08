import { Button, Flex, Popconfirm, Table, Tag } from "@skeinui/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAccess } from "@/modules/access";
import type { User } from "../api";
import { useUsersTranslation } from "../locales";

/** The columns that can be hidden or moved (the actions, when there are any, are always last). */
export const USER_COLUMNS = ["name", "email", "role", "status", "createdAt"] as const;
export type UserColumn = (typeof USER_COLUMNS)[number];

export function UserTable({
  users,
  loading,
  columns: shown = USER_COLUMNS,
  onEdit,
  onDelete,
}: {
  users: readonly User[];
  loading: boolean;
  /** The columns shown, in order. */
  columns?: readonly UserColumn[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => Promise<void>;
}) {
  const { t, i18n } = useUsersTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });
  const { can } = useAccess();
  const canEdit = can("users:update");
  const canDelete = can("users:delete");
  // Without either, there is nothing to put in the actions column
  const showActions = canEdit || canDelete;
  const columns = showActions ? [...shown, "actions" as const] : shown;
  const cell: Record<UserColumn, (user: User) => ReactNode> = {
    name: (user) => (
{{#if tenant}}
      // From the list's address, so the tenant is kept
      <Link
        from="/$tenant/users"
        to="/$tenant/users/$id"
        params={(prev) => ({ ...prev, id: String(user.id) })}
      >
{{else}}
      <Link to="/users/$id" params={{ id: String(user.id) }}>
{{/if}}
        {user.name}
      </Link>
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
    <Table hoverable loading={loading}>
      <Table.Header>
        <Table.Row>
          {columns.map((c) => (
            <Table.Head key={c}>{t(`col.${c}`)}</Table.Head>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {users.length === 0 ? (
          <Table.Empty colSpan={columns.length}>{loading ? t("loading") : t("empty")}</Table.Empty>
        ) : (
          users.map((user) => (
            <Table.Row key={user.id}>
              {shown.map((c) => (
                <Table.Cell key={c}>{cell[c](user)}</Table.Cell>
              ))}
              {showActions ? (
                <Table.Cell>
                  <Flex gap="xs">
                    {canEdit ? (
                      <Button size="sm" variant="ghost" onClick={() => onEdit(user)}>
                        {t("edit")}
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Popconfirm
                        tone="danger"
                        title={t("deleteConfirm", { user: user.name })}
                        confirmLabel={t("delete")}
                        cancelLabel={t("cancel")}
                        onConfirm={() => onDelete(user)}
                      >
                        <Button size="sm" variant="ghost" color="danger">
                          {t("delete")}
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </Flex>
                </Table.Cell>
              ) : null}
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table>
  );
}
