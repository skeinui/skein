import { Button, Card, DateText, Descriptions, Tag, Text } from "@skeinui/ui";
import { useQuery } from "@tanstack/react-query";
import { useNavigate{{#if tenant}}, useParams{{/if}} } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { QueryBoundary } from "@/lib/query-boundary";
import { Page } from "@/skein-shell";
import { fetchUser, userKeys } from "./api";
import { useUsersTranslation } from "./locales";

/** {{#if tenant}}/<tenant>{{/if}}/users/<id>: one user{{#if tenant}} of the tenant. A user of another tenant is not found{{else}}; one that doesn't exist is not found{{/if}} (404 from the API). */
export function UserDetailPage({ id }: { id: number }) {
  const { t } = useUsersTranslation();
  const navigate = useNavigate();
{{#if tenant}}
  const { tenant } = useParams({ strict: false });
{{/if}}
  const query = useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
  });

  return (
    <Page
      title={query.data?.name ?? (query.error ? t("detail.notFound") : t("loading"))}
      actions={
        <Button
          startContent={<ArrowLeft size={16} />}
          onClick={() => void navigate({ to: {{#if tenant}}`/${tenant}/users`{{else}}"/users"{{/if}} })}
        >
          {t("detail.back")}
        </Button>
      }
    >
      <Card>
        <Card.Body>
          <QueryBoundary
            query={query}
            notFound={<Text tone="secondary">{t("detail.notFoundHint", { id })}</Text>}
          >
            {(user) => (
              <Descriptions
                column={2}
                items={[
                  { label: t("col.name"), value: user.name },
                  { label: t("col.email"), value: user.email },
                  { label: t("col.role"), value: t(`role.${user.role}`) },
                  {
                    label: t("col.status"),
                    value: (
                      <Tag variant="soft" color={user.status === "active" ? "success" : "neutral"}>
                        {t(`status.${user.status}`)}
                      </Tag>
                    ),
                  },
                  { label: t("col.createdAt"), value: <DateText value={user.createdAt} /> },
                ]}
              />
            )}
          </QueryBoundary>
        </Card.Body>
      </Card>
    </Page>
  );
}
