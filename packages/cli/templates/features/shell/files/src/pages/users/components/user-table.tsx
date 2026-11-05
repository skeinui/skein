import { Button, Flex, Popconfirm, Table, Tag } from "@skeinui/ui";
import { Link } from "@tanstack/react-router";
import type { User } from "../api";
import { useUsersTranslation } from "../locales";

const COLUMNS = ["name", "email", "role", "status", "createdAt", "actions"] as const;

export function UserTable({
  users,
  loading,
  onEdit,
  onDelete,
}: {
  users: readonly User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => Promise<void>;
}) {
  const { t, i18n } = useUsersTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });
  return (
    <Table hoverable loading={loading}>
      <Table.Header>
        <Table.Row>
          {COLUMNS.map((c) => (
            <Table.Head key={c}>{t(`col.${c}`)}</Table.Head>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {users.length === 0 ? (
          <Table.Empty colSpan={COLUMNS.length}>{loading ? t("loading") : t("empty")}</Table.Empty>
        ) : (
          users.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell>
{{#if tenant}}
                {/* From the list's address, so the tenant is kept */}
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
              </Table.Cell>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>{t(`role.${user.role}`)}</Table.Cell>
              <Table.Cell>
                <Tag variant="soft" color={user.status === "active" ? "success" : "neutral"}>
                  {t(`status.${user.status}`)}
                </Tag>
              </Table.Cell>
              <Table.Cell>{date.format(new Date(user.createdAt))}</Table.Cell>
              <Table.Cell>
                <Flex gap="xs">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(user)}>
                    {t("edit")}
                  </Button>
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
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table>
  );
}
