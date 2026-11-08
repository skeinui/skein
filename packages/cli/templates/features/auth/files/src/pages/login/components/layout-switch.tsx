{{#if shell}}
import { Button, Menu } from "@skeinui/ui";
import type { LoginLayoutVariant } from "@skeinui/ui";
import { AlignCenter, Image, PanelLeft } from "lucide-react";
import { useLoginTranslation } from "../locales";

const VARIANTS = [
  { value: "centered", icon: AlignCenter },
  { value: "split", icon: PanelLeft },
  { value: "cover", icon: Image },
] as const;

/** Picks the look of the sign-in page: centered, split or cover. */
export function LayoutSwitch({
  value,
  onValueChange,
}: {
  value: LoginLayoutVariant;
  onValueChange: (value: LoginLayoutVariant) => void;
}) {
  const { t } = useLoginTranslation();
  const Current = VARIANTS.find((v) => v.value === value)?.icon ?? PanelLeft;
  return (
    <Menu>
      <Menu.Trigger
        render={<Button variant="ghost" color="neutral" size="sm" iconOnly />}
        aria-label={t("layout")}
      >
        <Current size={16} />
      </Menu.Trigger>
      <Menu.Content align="end">
        {VARIANTS.map(({ value: v, icon: Icon }) => (
          <Menu.CheckboxItem
            key={v}
            closeOnClick
            checked={value === v}
            onCheckedChange={() => onValueChange(v)}
          >
            <Icon size={14} /> {t(`variant.${v}`)}
          </Menu.CheckboxItem>
        ))}
      </Menu.Content>
    </Menu>
  );
}
{{/if}}
