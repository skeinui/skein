import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Input,
  Pagination,
  Progress,
  Radio,
  RadioGroup,
  Segmented,
  Select,
  Slider,
  Switch,
  Table,
  Tabs,
  Tag,
} from "@skeinui/ui";
import { useState } from "react";
import type { ReactNode } from "react";
import { useShellT } from "./shell-t.ts";

const COLORS = ["primary", "secondary", "success", "warning", "danger", "neutral"] as const;
const VARIANTS = ["solid", "soft", "outline", "ghost"] as const;

const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

const ROWS = [
  { name: "Ann Lee", role: "Owner", logins: 42 },
  { name: "Bo Chen", role: "Admin", logins: 18 },
  { name: "Cy Park", role: "Viewer", logins: 7 },
];

const row: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: "grid", gap: 10, minWidth: 0 }}>
      <h4 style={{ margin: 0, fontSize: 12, opacity: 0.6, letterSpacing: 0.4 }}>{title}</h4>
      {children}
    </section>
  );
}

/**
 * Component overview: placed in AdminLayout's content area; when switching theme style / color theme / radius / density in the settings panel,
 * these real components change live, used to compare the differences between theme styles.
 */
export function AdminLayoutShowcase() {
  const t = useShellT("showcase");
  const [page, setPage] = useState(3);
  const [seg, setSeg] = useState("day");

  return (
    <div style={{ display: "grid", gap: 24, padding: 16, maxWidth: 1100 }}>
      <Block title={t("buttons")}>
        <div style={{ display: "grid", gap: 8 }}>
          {VARIANTS.map((v) => (
            <div key={v} style={row}>
              {COLORS.map((c) => (
                <Button key={c} variant={v} color={c}>
                  {c}
                </Button>
              ))}
            </div>
          ))}
          <div style={row}>
            <Button size="sm">Small</Button>
            <Button>Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Block>

      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <Block title={t("form")}>
          <div style={{ display: "grid", gap: 10 }}>
            <Input aria-label="Email" placeholder="Enter your email" />
            <Input aria-label="Filled" variant="filled" placeholder="Filled" />
            <Select aria-label="Fruit" placeholder={t("selectAFruit")} options={FRUITS} />
            <DatePicker aria-label="Date" placeholder={t("pickADate")} />
            <Slider defaultValue={40} aria-label="Volume" />
            <div style={row}>
              <Checkbox defaultChecked>{t("subscribe")}</Checkbox>
              <Checkbox>{t("terms")}</Checkbox>
              <Switch aria-label="Switch" defaultChecked />
            </div>
            <RadioGroup aria-label="Plan" orientation="horizontal" defaultValue="pro">
              <Radio value="basic">Basic</Radio>
              <Radio value="pro">Pro</Radio>
              <Radio value="team">Team</Radio>
            </RadioGroup>
          </div>
        </Block>

        <Block title={t("feedback")}>
          <div style={{ display: "grid", gap: 10 }}>
            <Alert title={t("headsUp")}>{t("youCanAddComponents")}</Alert>
            <Alert color="success" variant="outline" title={t("saved")} />
            <Alert color="danger" variant="solid" title={t("somethingFailed")} />
            <Progress value={60} aria-label="Loading" />
            <Progress value={45} label={t("storage")} showValue />
          </div>
        </Block>

        <Block title={t("tagsBadges")}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={row}>
              {COLORS.map((c) => (
                <Tag key={c} color={c}>
                  {c}
                </Tag>
              ))}
            </div>
            <div style={row}>
              {COLORS.map((c) => (
                <Tag key={c} color={c} variant="outline">
                  {c}
                </Tag>
              ))}
            </div>
            <div style={row}>
              {COLORS.map((c) => (
                <Badge key={c} color={c} variant="soft">
                  {c}
                </Badge>
              ))}
            </div>
            <div style={row}>
              <Avatar fallback="W" />
              <Avatar fallback="AB" color="primary" />
              <Segmented
                aria-label="Range"
                value={seg}
                onValueChange={setSeg}
                options={[
                  { value: "day", label: t("day") },
                  { value: "week", label: t("week") },
                  { value: "month", label: t("month") },
                ]}
              />
            </div>
          </div>
        </Block>
      </div>

      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <Block title={t("tabs")}>
          {(["underline", "solid", "soft"] as const).map((v) => (
            <Tabs key={v} variant={v} defaultValue="a">
              <Tabs.List>
                <Tabs.Tab value="a">{t("photos")}</Tabs.Tab>
                <Tabs.Tab value="b">{t("music")}</Tabs.Tab>
                <Tabs.Tab value="c">{t("videos")}</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="a">{v}</Tabs.Panel>
              <Tabs.Panel value="b">{v}</Tabs.Panel>
              <Tabs.Panel value="c">{v}</Tabs.Panel>
            </Tabs>
          ))}
        </Block>

        <Block title={t("cards")}>
          <div style={{ display: "grid", gap: 10 }}>
            {(["outline", "filled", "elevated"] as const).map((v) => (
              <Card key={v} variant={v}>
                <Card.Header>
                  <Card.Title>{v}</Card.Title>
                  <Card.Description>{t("shortDescription")}</Card.Description>
                </Card.Header>
              </Card>
            ))}
          </div>
        </Block>
      </div>

      <Block title={t("table")}>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>{t("name")}</Table.Head>
              <Table.Head>{t("role")}</Table.Head>
              <Table.Head align="end">{t("logins")}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {ROWS.map((r) => (
              <Table.Row key={r.name}>
                <Table.Cell>{r.name}</Table.Cell>
                <Table.Cell>{r.role}</Table.Cell>
                <Table.Cell align="end">{r.logins}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <Pagination page={page} pageSize={10} total={186} onPageChange={setPage} />
      </Block>
    </div>
  );
}
