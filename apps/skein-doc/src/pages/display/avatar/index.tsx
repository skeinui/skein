import { Avatar, AvatarGroup, COLORS, RADII } from "@skeinui/ui";
const PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#7c3aed"/><circle cx="20" cy="16" r="7" fill="#ddd6fe"/><path d="M6 40c2-10 8-14 14-14s12 4 14 14z" fill="#ddd6fe"/></svg>',
  );

import { usePageT } from "@/site/i18n.tsx";
import { ApiReference, DocHeading, Example, Lead, PropsTable } from "@/doc/doc.tsx";

/** The styling hooks (all `data-slot`); their descriptions are the page's `styling.<name>` messages. */
const HOOKS = ["avatar-group", "avatar", "avatar-image", "avatar-fallback"];

/** Demo members: photos are public avatars from randomuser.me; if they fail to load (offline) or there is no photo, the name's initials are shown */
const MEMBERS = [
  { name: "Emma Wilson", photo: "women/44" },
  { name: "Liam Johnson", photo: "men/32" },
  { name: "Isabella Nguyen" },
  { name: "Jackson Lee", photo: "men/75" },
  { name: "Sofia Davis", photo: "women/68" },
  { name: "Olivia Martin", photo: "women/12" },
  { name: "William Kim", photo: "men/46" },
];

function Member({ name, photo }: { name: string; photo?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("");
  return (
    <Avatar
      src={photo ? `https://randomuser.me/api/portraits/${photo}.jpg` : undefined}
      alt={name}
      fallback={initials}
      color="primary"
    />
  );
}

export default function AvatarPage() {
  const t = usePageT();
  return (
    <article className="pg-doc">
      <h1 className="pg-doc-title">Avatar</h1>
      <Lead />

      <DocHeading id="examples" />

      <Example
        id="usage"
        code={`import { Avatar } from "@skeinui/ui";

<Avatar src="/avatar.png" alt="Jane" fallback="JD" />
<Avatar fallback="JD" />`}
      >
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Avatar src={PHOTO} alt="Sample" fallback="JD" />
          <Avatar src="/missing.png" alt="Broken" fallback="JD" />
          <Avatar fallback="AB" />
        </div>
      </Example>

      <Example id="sizes" code={`<Avatar size="sm" fallback="S" />`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          <Avatar size="sm" fallback="S" />
          <Avatar size="md" fallback="M" />
          <Avatar size="lg" fallback="L" />
        </div>
      </Example>

      <Example id="colors" code={`<Avatar color="success" fallback="OK" />`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {COLORS.map((c) => (
            <Avatar key={c} color={c} fallback={c.slice(0, 2)} />
          ))}
        </div>
      </Example>

      <Example id="radius" code={`<Avatar radius="md" fallback="AB" />`}>
        <div className="pg-flex pg-flex--center pg-flex--loose">
          {RADII.map((r) => (
            <Avatar key={r} radius={r} fallback={r.slice(0, 2)} />
          ))}
        </div>
      </Example>

      <Example
        id="group"
        code={`<AvatarGroup max={4} aria-label="Project members">
  <Avatar src="https://randomuser.me/api/portraits/women/44.jpg" alt="Emma Wilson" fallback="EW" />
  …
</AvatarGroup>`}
      >
        <div className="pg-stack">
          {(["sm", "md", "lg"] as const).map((size) => (
            <AvatarGroup key={size} size={size} max={4} aria-label={t("group.members", { size })}>
              {MEMBERS.map((m) => (
                <Member key={m.name} {...m} />
              ))}
            </AvatarGroup>
          ))}
          <AvatarGroup aria-label={t("group.reviewers")}>
            {MEMBERS.slice(0, 3).map((m) => (
              <Member key={m.name} {...m} />
            ))}
          </AvatarGroup>
        </div>
      </Example>

      <DocHeading id="reference" />

      <section id="api" className="pg-example">
        <h3>{t("api.title")}</h3>
        <ApiReference component="Avatar" />
        <h4>AvatarGroup</h4>
        <ApiReference component="AvatarGroup" />
      </section>

      <section id="styling" className="pg-example">
        <h3>{t("styling.title")}</h3>
        <p className="pg-desc">{t.rich("styling.description")}</p>
        <PropsTable
          first={t("styling.hook")}
          rows={HOOKS.map((name) => ({ name, type: "slot", description: t(`styling.${name}`) }))}
        />
      </section>
    </article>
  );
}
