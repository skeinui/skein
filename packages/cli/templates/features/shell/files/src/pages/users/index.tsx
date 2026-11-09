import { Button, Card, Flex, Pagination, TableTools, useFixedHeader } from "@skeinui/ui";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { downloadCsv } from "@/lib/export-csv";
import { useApiMutation } from "@/lib/use-api-mutation";
import { useListQuery } from "@/lib/use-list-query";
import { Access } from "@/modules/access";
import { Page } from "@/skein-shell";
import { deleteUser, fetchUsers, userKeys } from "./api";
import type { User } from "./api";
import { UsersSearch } from "./components/users-search";
import { UserFormDialog } from "./components/user-form-dialog";
import { USER_COLUMNS, UserTable } from "./components/user-table";
import type { UserColumn } from "./components/user-table";
import { useUsersTranslation } from "./locales";

export function UsersPage() {
  const { t } = useUsersTranslation();
  const queryClient = useQueryClient();
  const list = useListQuery();
  const { query } = list;
  /** The columns in their order, and the ones shown. */
  const [order, setOrder] = useState<UserColumn[]>([...USER_COLUMNS]);
  const [visible, setVisible] = useState<string[]>([...USER_COLUMNS]);
  const shown = order.filter((c) => visible.includes(c));
  /** The header fixed and the rows scrolling inside the card (the page fills the screen), or the whole page scrolling: the user's choice, fixed at first. */
  const [fixed, setFixed] = useFixedHeader("users");
  /** undefined: closed; null: creating; a user: editing it. */
  const [editing, setEditing] = useState<User | null | undefined>(undefined);
  const { data, isFetching } = useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => fetchUsers(query),
    placeholderData: keepPreviousData,
  });
  const remove = useApiMutation({
    mutationFn: (user: User) => deleteUser(user.id),
    invalidate: [userKeys.all],
    success: (_, user) => t("deleted", { user: user.name }),
  });

  /** The rows on screen, the columns shown, as they read on screen. */
  const exportRows = () => {
    const cell = (user: User, c: UserColumn) =>
      c === "role"
        ? t(`role.${user.role}`)
        : c === "status"
          ? t(`status.${user.status}`)
          : c === "createdAt"
            ? user.createdAt.slice(0, 10)
            : user[c];
    downloadCsv(
      "users.csv",
      shown.map((c) => t(`col.${c}`)),
      (data?.items ?? []).map((user) => shown.map((c) => cell(user, c))),
    );
  };

  return (
    <Page
      fill={fixed}
      title={t("title")}
      description={t("description")}
      actions={
        <Access code="users:create">
          <Button
            color="primary"
            startContent={<Plus size={16} />}
            onClick={() => setEditing(null)}
          >
            {t("create")}
          </Button>
        </Access>
      }
    >
      <Card fill={fixed}>
        <Card.Body>
          <Flex direction="column" gap="md" grow={fixed}>
            <UsersSearch
              onSearch={list.search}
              tools={
                <TableTools
                  onRefresh={() => void queryClient.invalidateQueries({ queryKey: userKeys.all })}
                  refreshing={isFetching}
                  columns={order.map((key) => ({ key, label: t(`col.${key}`) }))}
                  visible={visible}
                  onVisibleChange={setVisible}
                  onOrderChange={(keys) => setOrder(keys as UserColumn[])}
                  fixed={fixed}
                  onFixedChange={setFixed}
                  onExport={exportRows}
                />
              }
            />
            <UserTable
              users={data?.items ?? []}
              loading={isFetching}
              columns={shown}
              stickyHeader={fixed}
              onEdit={setEditing}
              onDelete={(user) =>
                remove.mutateAsync(user).then(
                  () => undefined,
                  () => undefined,
                )
              }
            />
            <Flex justify="end">
              <Pagination
                variant="pages"
                pageSizeOptions={[10, 20, 50]}
                {...list.pagination(data?.total ?? 0)}
              />
            </Flex>
          </Flex>
        </Card.Body>
      </Card>
      <UserFormDialog user={editing} onClose={() => setEditing(undefined)} />
    </Page>
  );
}
