import { Col, Grid, Row, Text } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks the components write; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "row", name: "row" },
  { key: "col", name: "col" },
  { key: "grid", name: "grid / grid-item" },
];

const Box = ({ children, tall }: { children?: React.ReactNode; tall?: boolean }) => (
  <div className="pg-box" data-tall={tall ? "" : undefined}>
    {children}
  </div>
);

export default function GridPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Grid</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="row-col"
        code={`import { Row, Col } from "@skeinui/ui";

<Row><Col span={12}>col-12</Col><Col span={12}>col-12</Col></Row>
<Row><Col span={8}>col-8</Col><Col span={8}>col-8</Col><Col span={8}>col-8</Col></Row>`}
      >
        <div className="pg-stack">
          <Row>
            <Col span={24}>
              <Box>col-24</Box>
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Box>col-12</Box>
            </Col>
            <Col span={12}>
              <Box>col-12</Box>
            </Col>
          </Row>
          <Row>
            <Col span={8}>
              <Box>col-8</Box>
            </Col>
            <Col span={8}>
              <Box>col-8</Box>
            </Col>
            <Col span={8}>
              <Box>col-8</Box>
            </Col>
          </Row>
          <Row>
            <Col span={6}>
              <Box>col-6</Box>
            </Col>
            <Col span={6}>
              <Box>col-6</Box>
            </Col>
            <Col span={6}>
              <Box>col-6</Box>
            </Col>
            <Col span={6}>
              <Box>col-6</Box>
            </Col>
          </Row>
        </div>
      </Example>

      <Example
        id="gutter"
        code={`<Row gutter="md">…</Row>
<Row gutter={["md", "sm"]}>…</Row>`}
      >
        <div className="pg-stack">
          <Row gutter="lg">
            {[1, 2, 3, 4].map((i) => (
              <Col key={i} span={6}>
                <Box>col-6</Box>
              </Col>
            ))}
          </Row>
          <Row gutter={["lg", "xs"]}>
            {Array.from({ length: 8 }, (_, i) => (
              <Col key={i} span={6}>
                <Box>col-6</Box>
              </Col>
            ))}
          </Row>
        </div>
      </Example>

      <Example id="offset" code={`<Col span={8} offset={8}>…</Col>`}>
        <div className="pg-stack">
          <Row gutter="sm">
            <Col span={8}>
              <Box>col-8</Box>
            </Col>
            <Col span={8} offset={8}>
              <Box>col-8 offset-8</Box>
            </Col>
          </Row>
          <Row gutter="sm">
            <Col span={6} offset={6}>
              <Box>col-6 offset-6</Box>
            </Col>
            <Col span={6} offset={6}>
              <Box>col-6 offset-6</Box>
            </Col>
          </Row>
          <Row gutter="sm">
            <Col span={12} offset={6}>
              <Box>col-12 offset-6</Box>
            </Col>
          </Row>
        </div>
      </Example>

      <Example id="align" code={`<Row justify="center" align="center">…</Row>`}>
        <div className="pg-stack">
          {(["start", "center", "end", "between", "around"] as const).map((justify) => (
            <Row key={justify} justify={justify} align="center">
              <Col span={4}>
                <Box tall>{justify}</Box>
              </Col>
              <Col span={4}>
                <Box>col-4</Box>
              </Col>
              <Col span={4}>
                <Box>col-4</Box>
              </Col>
            </Row>
          ))}
        </div>
      </Example>

      <Example
        id="order"
        code={`<Row><Col span={6} order={4}>1</Col><Col span={6} order={3}>2</Col>…</Row>`}
      >
        <Row gutter="sm">
          {[4, 3, 2, 1].map((order) => (
            <Col key={order} span={6} order={order}>
              <Box>
                {5 - order} col-6 order-{order}
              </Box>
            </Col>
          ))}
        </Row>
      </Example>

      <Example
        id="responsive"
        code={`<Col xs={24} md={12} lg={6}>…</Col>
<Col xs={24} lg={{ span: 12, offset: 6 }}>…</Col>`}
      >
        <div className="pg-stack">
          <Row gutter="sm">
            {Array.from({ length: 4 }, (_, i) => (
              <Col key={i} xs={24} md={12} lg={6}>
                <Box>xs=24 md=12 lg=6</Box>
              </Col>
            ))}
          </Row>
          <Row gutter="sm">
            <Col xs={24} lg={{ span: 12, offset: 6 }}>
              <Box>xs=24 lg=12 offset 6</Box>
            </Col>
          </Row>
          <Row gutter="sm">
            <Col xs={0} md={8}>
              <Box>{t("responsive.mdUp")}</Box>
            </Col>
            <Col xs={24} md={16}>
              <Box>xs=24 md=16</Box>
            </Col>
          </Row>
        </div>
      </Example>

      <Example
        id="grid"
        code={`<Grid columns={4}><Grid.Item span={2}>…</Grid.Item><Grid.Item>…</Grid.Item></Grid>`}
      >
        <Grid columns={4} gap="sm">
          <Grid.Item span={2}>
            <Box>span 2</Box>
          </Grid.Item>
          <Grid.Item>
            <Box>1</Box>
          </Grid.Item>
          <Grid.Item>
            <Box>1</Box>
          </Grid.Item>
          <Grid.Item span={4}>
            <Box>span 4</Box>
          </Grid.Item>
          <Grid.Item span={3}>
            <Box>span 3</Box>
          </Grid.Item>
          <Grid.Item>
            <Box>1</Box>
          </Grid.Item>
        </Grid>
      </Example>

      <Example
        id="aside"
        code={`<Grid aside="end" asideWidth="md" gap="md">
  <div>main</div>
  <div>aside</div>
</Grid>`}
      >
        <Grid aside="end" asideWidth="sm" gap="sm">
          <Box>{t("aside.main")}</Box>
          <Box>{t("aside.side")}</Box>
        </Grid>
      </Example>

      <Example id="auto-grid" code={`<Grid minColumnWidth="sm">…</Grid>`}>
        <Grid minColumnWidth="sm" gap="sm">
          {Array.from({ length: 7 }, (_, i) => (
            <Box key={i}>Card {i + 1}</Box>
          ))}
        </Grid>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Row" />
        <ApiReference component="Col" />
        <ApiReference component="Grid" />
        <ApiReference component="Grid.Item" />
        <Text tone="secondary">{t.rich("api.note")}</Text>
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
