import { Button, Card, Flex, Pagination, toast } from "@skeinui/ui";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Page } from "@/skein-shell";
import { deleteUser, fetchUsers, userKeys } from "./api";
import type { User, UserQuery } from "./api";
import { UserFilter } from "./components/user-filter";
import { UserFormDialog } from "./components/user-form-dialog";
import { UserTable } from "./components/user-table";
import { useUsersTranslation } from "./locales";

export function UsersPage() {
  const { t } = useUsersTranslation();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState<UserQuery>({ page: 1, pageSize: 10 });
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

  return (
    <Page
      title={t("title")}
      description={t("description")}
      actions={
        <Button color="primary" startContent={<Plus size={16} />} onClick={() => setEditing(null)}>
          {t("create")}
        </Button>
      }
    >
      <Card>
        <Card.Body>
          <UserFilter
            onSearch={(filter) => setQuery((q) => ({ page: 1, pageSize: q.pageSize, ...filter }))}
          />
        </Card.Body>
      </Card>
      <Card>
        <Card.Body>
          <Flex direction="column" gap="md">
            <UserTable
              users={data?.items ?? []}
              loading={isFetching}
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
