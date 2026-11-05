import { Card, Grid, Table } from "@skeinui/ui";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { Page } from "@/skein-shell";
import { dashboardKeys, fetchRecentUsers, fetchStats } from "./api";
import { StatCard } from "./components/stat-card";
import { useDashboardTranslation } from "./locales";

export function DashboardPage() {
  const { t, i18n } = useDashboardTranslation();
  const stats = useQuery({ queryKey: dashboardKeys.stats, queryFn: fetchStats });
  const recent = useQuery({ queryKey: dashboardKeys.recentUsers, queryFn: fetchRecentUsers });
  const date = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" });

  return (
    <Page title={t("title")} description={t("subtitle")}>
      <Grid columns={4} minColumnWidth="sm" gap="md">
        <StatCard
          title={t("stats.users")}
          value={stats.data?.users}
          icon={<Users size={18} />}
          loading={stats.isPending}
        />
        <StatCard
          title={t("stats.active")}
          value={stats.data?.active}
          color="success"
          icon={<UserCheck size={18} />}
          loading={stats.isPending}
        />
        <StatCard
          title={t("stats.disabled")}
          value={stats.data?.disabled}
          color="warning"
          icon={<UserX size={18} />}
          loading={stats.isPending}
        />
        <StatCard
          title={t("stats.admins")}
          value={stats.data?.admins}
          color="primary"
          icon={<ShieldCheck size={18} />}
          loading={stats.isPending}
        />
      </Grid>
      <Card>
        <Card.Header>
          <Card.Title>{t("recent.title")}</Card.Title>
          <Card.Description>{t("recent.description")}</Card.Description>
        </Card.Header>
        <Card.Body>
          <Table loading={recent.isPending}>
            <Table.Header>
              <Table.Row>
                <Table.Head>{t("recent.name")}</Table.Head>
                <Table.Head>{t("recent.email")}</Table.Head>
                <Table.Head>{t("recent.createdAt")}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(recent.data ?? []).map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.name}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell>{date.format(new Date(user.createdAt))}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </Page>
  );
}
