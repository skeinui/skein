import { useState } from "react";
import { Button, Card, Masonry } from "@skeinui/ui";
import type { MasonryItem } from "@skeinui/ui";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** `MasonryItem`'s fields and the exported helpers; their descriptions are the page's `api.<key>` messages. */
const ITEM_FIELDS = [
  { key: "key", type: "string | number" },
  { key: "data", type: "T" },
  { key: "column", type: "number" },
  { key: "height", type: "number" },
  { key: "children", type: "ReactNode" },
];
const HELPERS = [
  { key: "layoutMasonry", type: "(heights, columns, gapY, fixed?) => …" },
  { key: "resolveResponsive", type: "(value, width, fallback) => number" },
];

/** The styling hooks the component writes; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "masonry", name: "masonry" },
  { key: "item", name: "masonry-item" },
];

const HEIGHTS = [120, 80, 150, 100, 60, 130, 90, 170, 70, 110, 140, 85, 95, 125, 75];
const COLORS = ["#dbeafe", "#dcfce7", "#fef3c7", "#fee2e2", "#ede9fe", "#cffafe"];

const Tile = ({ n, h }: { n: number; h: number }) => (
  <div
    style={{
      height: h,
      display: "grid",
      placeItems: "center",
      borderRadius: 8,
      background: COLORS[n % COLORS.length],
      color: "#27272a",
      fontWeight: 600,
    }}
  >
    {n + 1}
  </div>
);

const PHOTO_SIZES = [
  [400, 560],
  [400, 300],
  [400, 480],
  [400, 360],
  [400, 620],
  [400, 280],
  [400, 440],
  [400, 520],
  [400, 340],
  [400, 400],
  [400, 580],
  [400, 320],
] as const;

function Photos() {
  return (
    <Masonry columns={{ xs: 2, md: 3, xl: 4 }} gutter={12} aria-label="Photos">
      {PHOTO_SIZES.map(([w, h], i) => (
        <img
          key={i}
          src={`https://picsum.photos/seed/skein-${i}/${w}/${h}`}
          alt={`Sample photo ${i + 1}`}
          width={w}
          height={h}
          style={{ display: "block", width: "100%", height: "auto", borderRadius: 8 }}
        />
      ))}
    </Masonry>
  );
}

function Dynamic() {
  const t = usePageT();
  const [items, setItems] = useState<MasonryItem<number>[]>(
    HEIGHTS.slice(0, 8).map((h, i) => ({ key: i, data: h })),
  );
  const [layout, setLayout] = useState<Record<string, number>>({});
  return (
    <div className="pg-stack">
      <div className="pg-flex pg-flex--center">
        <Button
          size="sm"
          onClick={() =>
            setItems((list) => [
              { key: list.length, data: 60 + Math.round(Math.random() * 120) },
              ...list,
            ])
          }
        >
          {t("dynamic.add")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            // Pin each item's current column: items added at the front later won't change columns for existing ones
            setItems((list) =>
              list.map((it) => ({ ...it, column: layout[String(it.key)] ?? it.column })),
            )
          }
        >
          {t("dynamic.pin")}
        </Button>
      </div>
      <Masonry
        columns={4}
        gutter={12}
        items={items}
        onLayoutChange={(l) =>
          setLayout(Object.fromEntries(l.map((x) => [String(x.key), x.column])))
        }
        itemRender={(item) => <Tile n={Number(item.key)} h={item.data ?? 80} />}
        aria-label="Dynamic items"
      />
    </div>
  );
}

export default function MasonryPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Masonry</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { Masonry } from "@skeinui/ui";

<Masonry columns={4} gutter={12}>
  {items.map((item) => <Card key={item.id}>…</Card>)}
</Masonry>`}
      >
        <Masonry columns={4} gutter={12} aria-label="Tiles">
          {HEIGHTS.map((h, i) => (
            <Tile key={i} n={i} h={h} />
          ))}
        </Masonry>
      </Example>

      <Example
        id="responsive"
        code={`<Masonry columns={{ xs: 1, sm: 2, md: 3, xl: 4 }} gutter={{ xs: 8, md: 16 }}>…</Masonry>`}
      >
        <Masonry
          columns={{ xs: 1, sm: 2, md: 3, xl: 4 }}
          gutter={{ xs: 8, md: 16 }}
          aria-label="Responsive tiles"
        >
          {HEIGHTS.map((h, i) => (
            <Card key={i}>
              <Card.Body>
                <div style={{ height: h - 40 > 20 ? h - 40 : 20 }}>Card {i + 1}</div>
              </Card.Body>
            </Card>
          ))}
        </Masonry>
      </Example>

      <Example
        id="images"
        code={`<Masonry columns={{ xs: 2, md: 3, xl: 4 }} gutter={12}>
  {photos.map((p) => <img key={p.id} src={p.src} width={p.w} height={p.h} alt={p.alt} />)}
</Masonry>`}
      >
        <Photos />
      </Example>

      <Example
        id="dynamic"
        code={`<Masonry items={items} onLayoutChange={saveLayout} itemRender={(item) => <Tile {...item.data} />} />
// item.column pins an item to a column`}
      >
        <Dynamic />
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Masonry" />
        <p className="pg-desc">{t.rich("api.item")}</p>
        <PropsTable
          first={t("api.field")}
          rows={ITEM_FIELDS.map((f) => ({
            name: f.key,
            type: f.type,
            description: t.rich(`api.${f.key}`),
          }))}
        />
        <p className="pg-desc">{t("api.helpers")}</p>
        <PropsTable
          first={t("api.helper")}
          rows={HELPERS.map((f) => ({
            name: f.key,
            type: f.type,
            description: t.rich(`api.${f.key}`),
          }))}
        />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
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
