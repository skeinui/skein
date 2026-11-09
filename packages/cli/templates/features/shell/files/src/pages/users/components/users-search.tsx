import { TableToolbar } from "@skeinui/ui";
import type { QueryField } from "@skeinui/ui";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Filter } from "@/lib/list-query";
import { USER_ROLES, USER_STATUSES } from "../api";
import { useUsersTranslation } from "../locales";

/** What the search asks for, as parts of a `ListQuery`. */
export interface UsersSearchValue {
  keyword?: string;
  filter?: Filter;
}

/** A keyword (Enter searches), and any conditions on the fields as chips (all of / any of, groups inside groups); `tools` go on the right. */
export function UsersSearch({
  onSearch,
  tools,
}: {
  onSearch: (value: UsersSearchValue) => void;
  tools?: ReactNode;
}) {
  const { t } = useUsersTranslation();
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<Filter | undefined>();
  const search = (next: UsersSearchValue) =>
    onSearch({ keyword: next.keyword?.trim() || undefined, filter: next.filter });
  const fields: QueryField[] = [
    { name: "name", label: t("col.name"), type: "text" },
    { name: "email", label: t("col.email"), type: "text" },
    {
      name: "role",
      label: t("col.role"),
      type: "enum",
      options: USER_ROLES.map((r) => ({ value: r, label: t(`role.${r}`) })),
    },
    {
      name: "status",
      label: t("col.status"),
      type: "enum",
      options: USER_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
    },
    { name: "createdAt", label: t("col.createdAt"), type: "date" },
  ];
  return (
    <TableToolbar
      keyword={keyword}
      onKeywordChange={setKeyword}
      // Enter (not while an input method is composing), the button, and the clear button
      onSearch={(value) => search({ keyword: value, filter })}
      searchPlaceholder={t("filter.keywordPlaceholder")}
      fields={fields}
      filter={filter}
      onFilterChange={(next) => {
        setFilter(next);
        search({ keyword, filter: next });
      }}
      onReset={() => {
        setKeyword("");
        setFilter(undefined);
        search({});
      }}
      tools={tools}
    />
  );
}
