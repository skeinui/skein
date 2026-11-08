import { Button, Card, Flex, Pagination, toast } from "@skeinui/ui";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { downloadCsv } from "@/lib/export-csv";
import { Access } from "@/modules/access";
import { TableTools } from "@/modules/table-tools";
import { Page } from "@/skein-shell";
import { deleteUser, fetchUsers, userKeys } from "./api";
import type { ListQuery } from "@/lib/list-query";
import type { User } from "./api";
import { UsersSearch } from "./components/users-search";
import { UserFormDialog } from "./components/user-form-dialog";
import { USER_COLUMNS, UserTable } from "./components/user-table";
import type { UserColumn } from "./components/user-table";
import { useUsersTranslation } from "./locales";

export function UsersPage() {
  const { t } = useUsersTranslation();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState<ListQuery>({ page: 1, pageSize: 10 });
  /** The columns in their order, and the ones shown. */
  const [order, setOrder] = useState<UserColumn[]>([...USER_COLUMNS]);
  const [visible, setVisible] = useState<string[]>([...USER_COLUMNS]);
  const shown = order.filter((c) => visible.includes(c));
  /** undefined: closed; null: creating; a user: editing it. */
  const [editing, setEditing] = useState<User | null | undefined>(undefined);
  const { data, isFetching } = useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => fetchUsers(query),
    placeholderData: keepPreviousData,
  });
  const remove = useMutation({
    mutationFn: (user: User) => deleteUser(user.id),
    onSuccess: (_, user) => {
      toast.success(t("deleted", { user: user.name }));
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
    onError: (error) => toast.danger(error.message),
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
      <Card>
        <Card.Body>
          <Flex direction="column" gap="md">
            <div className="table-bar">
              <div className="table-bar-main">
                <UsersSearch
                  onSearch={(filter) =>
                    setQuery((q) => ({ page: 1, pageSize: q.pageSize, ...filter }))
                  }
                />
              </div>
              <TableTools
                onRefresh={() => void queryClient.invalidateQueries({ queryKey: userKeys.all })}
                refreshing={isFetching}
                columns={order.map((key) => ({ key, label: t(`col.${key}`) }))}
                visible={visible}
                onVisibleChange={setVisible}
                onOrderChange={(keys) => setOrder(keys as UserColumn[])}
                onExport={exportRows}
              />
            </div>
            <UserTable
              users={data?.items ?? []}
              loading={isFetching}
              columns={shown}
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
                page={query.page}
                pageSize={query.pageSize}
                total={data?.total ?? 0}
                pageSizeOptions={[10, 20, 50]}
                onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
                onPageSizeChange={(pageSize) => setQuery((q) => ({ ...q, pageSize, page: 1 }))}
              />
            </Flex>
          </Flex>
        </Card.Body>
      </Card>
      <UserFormDialog user={editing} onClose={() => setEditing(undefined)} />
    </Page>
  );
}
