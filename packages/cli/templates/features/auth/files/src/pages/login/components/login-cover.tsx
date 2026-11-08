{{#if shell}}
import { Text, Title } from "@skeinui/ui";
import { useLoginTranslation } from "../locales";
import { LoginIllustration } from "./login-illustration";

/** The middle of the split sign-in page's cover (the layout puts the brand and the glow around it): a drawing and a tagline. */
export function LoginCover() {
  const { t } = useLoginTranslation();
  return (
    <>
      <LoginIllustration />
      <Title level={3}>{t("cover.title")}</Title>
      <Text tone="secondary">{t("cover.description")}</Text>
    </>
  );
}
{{/if}}
