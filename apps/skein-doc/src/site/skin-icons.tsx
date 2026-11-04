import type { ThemeStyle } from "@/site/settings.ts";

/**
 * Small icons used in theme style selection: a simplified mark of the UI library for each theme style (not an exact copy of the official logo, only distinctive traits:
 * colors and main shapes), Skein uses its own favicon. The icon tile's background is the brand color and doesn't change with theme style / mode.
 */
const TILE: Record<ThemeStyle, { bg: string; fg: string }> = {
  heroui: { bg: "#18181b", fg: "#ffffff" },
  antd: { bg: "#1677ff", fg: "#ffffff" },
  shadcn: { bg: "#09090b", fg: "#fafafa" },
  default: { bg: "#ffffff", fg: "#0f172a" },
};

function Mark({ themeStyle }: { themeStyle: ThemeStyle }) {
  const common = { viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  switch (themeStyle) {
    case "heroui":
      // A bold H, two verticals plus a crossbar, round ends
      return (
        <svg {...common} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M7.5 5.5v13M16.5 5.5v13M7.5 12h9" />
        </svg>
      );
    case "antd":
      // A small diamond nested in a diamond, with a touch of red (Ant Design's blue + red)
      return (
        <svg {...common}>
          <path
            d="M12 3.5 20.5 12 12 20.5 3.5 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M12 8.2 15.8 12 12 15.8 8.2 12Z" fill="#ff4d4f" />
        </svg>
      );
    case "shadcn":
      // Two diagonal lines
      return (
        <svg {...common} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M16.5 6.5 6.5 16.5M18 11.5 11.5 18" />
        </svg>
      );
    default:
      return <img src="/favicon.svg" alt="" width="22" height="22" />;
  }
}

export function SkinIcon({ themeStyle }: { themeStyle: ThemeStyle }) {
  const { bg, fg } = TILE[themeStyle];
  return (
    <span
      className="pg-skin-icon"
      data-theme-style-icon={themeStyle}
      style={{ background: bg, color: fg }}
    >
      <Mark themeStyle={themeStyle} />
    </span>
  );
}
