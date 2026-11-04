import { Button, Input, QRCode } from "@skeinui/ui";
import type { QRCodeStatus, QRErrorLevel } from "@skeinui/ui";
import { useEffect, useRef, useState } from "react";
import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks; their descriptions are the page's `styling.<key>` messages. */
const HOOKS = [
  { key: "root", name: "qrcode", type: "slot" },
  { key: "svg", name: "qrcode-svg / qrcode-background / qrcode-modules", type: "slot" },
  { key: "icon", name: "qrcode-icon / qrcode-icon-bg", type: "slot" },
  { key: "mask", name: "qrcode-mask / qrcode-spinner / qrcode-status", type: "slot" },
];

const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#2563eb"/><path d="M20 34l8 8 16-18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  );

function UsageDemo() {
  const t = usePageT();
  const [value, setValue] = useState("https://example.com");
  return (
    <div className="pg-row pg-row--top">
      <QRCode aria-label={t("usage.qr")} value={value || "-"} />
      <Input
        aria-label={t("usage.content")}
        placeholder={t("usage.placeholder")}
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
}

function StatusDemo() {
  const t = usePageT();
  const [status, setStatus] = useState<QRCodeStatus>("expired");
  const [n, setN] = useState(1);
  return (
    <div className="pg-stack pg-stack--start">
      <div className="pg-row pg-row--top">
        {(["active", "loading", "expired", "scanned"] as const).map((s) => (
          <QRCode
            key={s}
            value={`https://example.com/login?s=${s}`}
            size={120}
            status={s}
            onRefresh={() => undefined}
            aria-label={s}
          />
        ))}
      </div>
      <QRCode
        value={`https://example.com/login?token=${n}`}
        size={120}
        status={status}
        onRefresh={() => {
          setStatus("loading");
          setTimeout(() => {
            setN((x) => x + 1);
            setStatus("active");
          }, 800);
        }}
        aria-label={t("status.login")}
      />
      <p className="pg-desc">{t.rich("status.note", { n })}</p>
    </div>
  );
}

type Stage = "loading" | "active" | "scanned" | "expired" | "done";

const newUuid = () => Math.random().toString(36).slice(2, 12);
const LIFETIME = 30;

/**
 * Simulates "WeChat QR code login": in a real integration the QR code content is a link the backend gets from the WeChat API,
 * and the status comes from the frontend polling the backend (which in turn asks WeChat); here a timer and buttons stand in for WeChat and the phone.
 */
function WeChatLoginDemo() {
  const t = usePageT();
  const [stage, setStage] = useState<Stage>("loading");
  const [uuid, setUuid] = useState("");
  const [left, setLeft] = useState(LIFETIME);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchCode = () => {
    setStage("loading");
    clearTimeout(timer.current);
    // Simulated request: in a real scenario it is await api.getWechatLoginUrl()
    timer.current = setTimeout(() => {
      setUuid(newUuid());
      setLeft(LIFETIME);
      setStage("active");
    }, 700);
  };

  useEffect(() => {
    fetchCode();
    return () => clearTimeout(timer.current);
  }, []);

  // QR code validity countdown; it only expires while not yet scanned
  useEffect(() => {
    if (stage !== "active") return;
    const id = setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          setStage("expired");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  if (stage === "done") {
    return (
      <div className="pg-stack pg-stack--start">
        <p>{t.rich("wechat.done")}</p>
        <Button variant="outline" onClick={fetchCode}>
          {t("wechat.restart")}
        </Button>
      </div>
    );
  }

  const hint = t(`wechat.hint.${stage}`, { left });

  return (
    <div className="pg-row pg-row--top">
      <div className="pg-stack">
        <QRCode
          aria-label={t("wechat.title")}
          value={`https://open.weixin.qq.com/connect/confirm?uuid=${uuid || "-"}`}
          status={stage}
          size={180}
          labels={{
            scanned: t("wechat.scanned"),
            expired: t("wechat.expired"),
            refresh: t("wechat.refresh"),
          }}
          onRefresh={fetchCode}
        />
        <span className="pg-desc">{hint}</span>
      </div>
      <div className="pg-stack pg-stack--start">
        <span className="pg-desc">{t("wechat.phone")}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={stage !== "active"}
          onClick={() => setStage("scanned")}
        >
          {t("wechat.scan")}
        </Button>
        <Button
          size="sm"
          color="primary"
          disabled={stage !== "scanned"}
          onClick={() => setStage("done")}
        >
          {t("wechat.confirm")}
        </Button>
        <span className="pg-desc">{t("wechat.wait")}</span>
      </div>
    </div>
  );
}

export default function QRCodePage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">QRCode</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { QRCode } from "@skeinui/ui";

<QRCode value="https://example.com" />`}
      >
        <UsageDemo />
      </Example>

      <Example id="icon" code={`<QRCode value="https://example.com" icon="/logo.png" />`}>
        <QRCode
          aria-label={t("icon.title")}
          value="https://example.com/with-icon"
          icon={LOGO}
          size={180}
        />
      </Example>

      <Example id="colors" code={`<QRCode value="…" color="#1d4ed8" bgColor="#eff6ff" />`}>
        <QRCode
          aria-label={t("colors.title")}
          value="https://example.com/colors"
          color="#1d4ed8"
          bgColor="#eff6ff"
        />
      </Example>

      <Example id="levels" code={`<QRCode value="…" errorLevel="L" /> // L M Q H`}>
        <div className="pg-row pg-row--top">
          {(["L", "M", "Q", "H"] as QRErrorLevel[]).map((level) => (
            <div key={level} className="pg-stack">
              <QRCode
                aria-label={t("levels.level", { level })}
                value="https://example.com/levels"
                errorLevel={level}
                size={110}
              />
              <span className="pg-desc">{level}</span>
            </div>
          ))}
        </div>
      </Example>

      <Example id="status" code={`<QRCode value="…" status="expired" onRefresh={refetch} />`}>
        <StatusDemo />
      </Example>

      <Example
        id="wechat"
        code={`const [stage, setStage] = useState("loading"); // loading → active → scanned → done / expired
<QRCode
  value={wechatUrl}   // the link your backend got from the WeChat API
  status={stage === "done" ? "active" : stage}
  onRefresh={fetchNewUrl}
/>
// poll /api/wechat/login/status?uuid=…: scanned → setStage("scanned"), confirmed → sign in with the returned token, timed out → "expired"`}
      >
        <WeChatLoginDemo />
      </Example>

      <Example id="borderless" code={`<QRCode value="…" bordered={false} size={96} />`}>
        <div className="pg-row pg-row--top">
          <QRCode
            aria-label={t("borderless.small")}
            value="https://example.com/small"
            bordered={false}
            size={96}
          />
          <QRCode aria-label={t("borderless.large")} value="https://example.com/large" size={220} />
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="QRCode" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((h) => ({
            name: h.name,
            type: h.type,
            description: t(`styling.${h.key}`),
          }))}
        />
      </section>
    </article>
  );
}
