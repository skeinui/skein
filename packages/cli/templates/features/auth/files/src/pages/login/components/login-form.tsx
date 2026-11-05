import { Form } from "@skeinui/ui";
import type { LoginInput } from "../api";
import { useLoginTranslation } from "../locales";

export function LoginForm({ onSubmit }: { onSubmit: (input: LoginInput) => Promise<void> }) {
  const { t } = useLoginTranslation();
  return (
    <Form
      fields={[
        {
          name: "username",
          label: t("username"),
          required: true,
          props: { autoComplete: "username" },
        },
        {
          name: "password",
          label: t("password"),
          type: "password",
          required: true,
          props: { autoComplete: "current-password" },
        },
      ]}
{{#if mock}}
      defaultValues={{ username: "admin", password: "admin123" }}
{{/if}}
      submitLabel={t("submit")}
      onSubmit={(values) => onSubmit(values as unknown as LoginInput)}
    />
  );
}
