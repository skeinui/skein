import { Image } from "@skeinui/ui";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";
import { usePageT } from "@/site/i18n.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "image" },
  { key: "parts", name: "image-img / image-placeholder / image-fallback / image-mask" },
  {
    key: "preview",
    name: "image-preview-backdrop / image-preview / image-preview-stage / image-preview-img",
  },
  { key: "toolbar", name: "image-preview-toolbar / -button / -close / -nav / -counter" },
];

/** Use inline SVGs as sample images, no network needed. */
const art = (a: string, b: string, label: string, w = 400, h = 260) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w * 0.72}" cy="${h * 0.3}" r="${h * 0.14}" fill="rgba(255,255,255,.55)"/><path d="M0 ${h} L${w * 0.35} ${h * 0.55} L${w * 0.6} ${h * 0.8} L${w * 0.8} ${h * 0.6} L${w} ${h * 0.85} V${h} Z" fill="rgba(0,0,0,.25)"/><text x="16" y="${h - 16}" font-family="sans-serif" font-size="22" fill="white">${label}</text></svg>`,
  )}`;
const A = art("#6366f1", "#06b6d4", "Mountains");
const B = art("#f97316", "#ec4899", "Sunset");
const C = art("#10b981", "#3b82f6", "Lake");

export default function ImagePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Image</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="basic"
        code={`import { Image } from "@skeinui/ui";

<Image src="/photo.jpg" alt="Mountains" width={240} />`}
      >
        <Image src={A} alt="Mountains" width={240} />
      </Example>

      <Example
        id="fallback"
        code={`<Image src="/missing.png" alt="…" fallback="/default.png" />
<Image src="/missing.png" alt="…" fallback={<span>No cover</span>} />`}
      >
        <div className="pg-row">
          <Image src="/missing-1.png" alt="Falls back to another image" fallback={B} width={160} />
          <Image src="/missing-2.png" alt="Broken image" width={160} />
          <Image
            src="/missing-3.png"
            alt="Custom fallback"
            fallback={<span>{t("fallback.noCover")}</span>}
            width={160}
          />
        </div>
      </Example>

      <Example id="no-preview" code={`<Image src="/photo.jpg" alt="…" preview={false} />`}>
        <Image src={C} alt="Lake" width={240} preview={false} />
      </Example>

      <Example
        id="group"
        code={`<Image.PreviewGroup>
  <Image src={a} alt="…" /><Image src={b} alt="…" /><Image src={c} alt="…" />
</Image.PreviewGroup>`}
      >
        <Image.PreviewGroup>
          <div className="pg-row">
            <Image src={A} alt="Mountains" width={160} />
            <Image src={B} alt="Sunset" width={160} />
            <Image src={C} alt="Lake" width={160} />
          </div>
        </Image.PreviewGroup>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Image" />
        <h4>Image.PreviewGroup</h4>
        <ApiReference component="Image.PreviewGroup" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: "data-slot",
            description: t.rich(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
