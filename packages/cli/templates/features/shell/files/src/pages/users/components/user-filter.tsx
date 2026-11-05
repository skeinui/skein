import { Form } from "@skeinui/ui";
import { USER_STATUSES } from "../api";
import type { UserStatus } from "../api";
import { useUsersTranslation } from "../locales";

export interface UserFilterValue {
  keyword?: string;
  status?: UserStatus;
}

const ALL = "all";

export function UserFilter({ onSearch }: { onSearch: (filter: UserFilterValue) => void }) {
  const { t } = useUsersTranslation();
  const search = (values: Record<string, unknown>) =>
    onSearch({
      keyword: (values.keyword as string | undefined)?.trim() || undefined,
      status: values.status === ALL ? undefined : (values.status as UserStatus | undefined),
    });
  return (
    <Form
      layout="inline"
      fields={[
        {
          name: "keyword",
          label: t("filter.keyword"),
          placeholder: t("filter.keywordPlaceholder"),
        },
        {
          name: "status",
          label: t("filter.status"),
          type: "select",
          defaultValue: ALL,
          options: [
            { value: ALL, label: t("filter.all") },
            ...USER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
          ],
        },
      ]}
      submitLabel={t("filter.search")}
      resetLabel={t("filter.reset")}
      onSubmit={search}
      onReset={() => onSearch({})}
    />
  );
}
