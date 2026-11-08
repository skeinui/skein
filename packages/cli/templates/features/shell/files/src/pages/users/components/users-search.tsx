import { Button, Flex, Input } from "@skeinui/ui";
import { useState } from "react";
import type { Filter } from "@/lib/list-query";
import { QueryBuilder } from "@/modules/query-builder";
import type { QueryField } from "@/modules/query-builder";
import { USER_ROLES, USER_STATUSES } from "../api";
import { useUsersTranslation } from "../locales";

/** What the search asks for, as parts of a `ListQuery`. */
export interface UsersSearchValue {
  keyword?: string;
  filter?: Filter;
}

/** A keyword (Enter searches), and any conditions on the fields as chips (all of / any of, groups inside groups). */
export function UsersSearch({ onSearch }: { onSearch: (value: UsersSearchValue) => void }) {
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
    <Flex gap="sm" align="center" wrap>
      <div className="table-keyword">
        <Input
          fullWidth
          size="sm"
          aria-label={t("filter.keyword")}
          placeholder={t("filter.keywordPlaceholder")}
          value={keyword}
          onValueChange={setKeyword}
          onKeyDown={(e) => {
            if (e.key === "Enter") search({ keyword, filter });
          }}
          onBlur={() => search({ keyword, filter })}
        />
      </div>
      <QueryBuilder
        fields={fields}
        value={filter}
        onChange={(next) => {
          setFilter(next);
          search({ keyword, filter: next });
        }}
      />
      {keyword || filter ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setKeyword("");
            setFilter(undefined);
            search({});
          }}
        >
          {t("filter.reset")}
        </Button>
      ) : null}
    </Flex>
  );
}
