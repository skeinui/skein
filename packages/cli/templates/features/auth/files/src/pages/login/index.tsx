import { Alert, Flex, LoginLayout, {{#if mock}}Text, {{/if}}toast } from "@skeinui/ui";
{{#if shell}}
import type { LoginLayoutVariant } from "@skeinui/ui";
{{/if}}
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
{{#if shell}}
import { useState } from "react";
import { Toolbar } from "@/modules/toolbar";
import { settings } from "@/settings";
{{/if}}
import { useAuthStore } from "@/store/auth-store";
import { login } from "./api";
{{#if shell}}
import { LayoutSwitch } from "./components/layout-switch";
{{/if}}
import { LoginForm } from "./components/login-form";
import { useLoginTranslation } from "./locales";
{{#if shell}}

const VARIANT_KEY = `${settings.storageKey}-login-layout`;

/** The look picked last time on this browser, else `settings.loginLayout`. */
function storedVariant(): LoginLayoutVariant {
  try {
    const saved = localStorage.getItem(VARIANT_KEY);
    if (saved === "centered" || saved === "split" || saved === "cover") return saved;
  } catch {
    // Blocked storage: the default
  }
  return settings.loginLayout;
}
{{/if}}

export function LoginPage() {
  const { t } = useLoginTranslation();
  const navigate = useNavigate();
  // The session ended by itself (lib/http.ts): say so
  const expired = useAuthStore((s) => s.expired);
{{#if shell}}
  const [variant, setVariant] = useState<LoginLayoutVariant>(storedVariant);
  const chooseVariant = (next: LoginLayoutVariant) => {
    setVariant(next);
    try {
      localStorage.setItem(VARIANT_KEY, next);
    } catch {
      // No storage: the choice lasts until the page is left
    }
  };
{{/if}}
  const signIn = useMutation({
    mutationFn: login,
    onSuccess: ({ token, refreshToken, user }) => {
      const { setSession, intendedPath, setIntendedPath } = useAuthStore.getState();
      setSession(token, user, refreshToken);
      setIntendedPath(null);
      void navigate({ to: intendedPath ?? "/" });
    },
    onError: (error) => toast.danger(error.message || t("failed")),
  });

  return (
    <LoginLayout
{{#if shell}}
      variant={variant}
      coverTitle={t("cover.title")}
      coverDescription={t("cover.description")}
      brand={
        <span className="app-logo">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          {settings.appName}
        </span>
      }
{{else}}
      brand={
        <Flex align="center" gap="sm">
          <img src="/favicon.svg" alt="" width={24} height={24} />
          <strong>{{title}}</strong>
        </Flex>
      }
{{/if}}
      title={t("title")}
      description={t("subtitle")}
{{#if shell}}
      toolbar={
        <>
          <LayoutSwitch value={variant} onValueChange={chooseVariant} />
          <Toolbar place="login" />
        </>
      }
{{/if}}
{{#if mock}}
      footer={<Text tone="secondary">{t("mockHint")}</Text>}
{{/if}}
    >
      <Flex direction="column" gap="lg">
        {expired ? <Alert color="warning">{t("expired")}</Alert> : null}
        <LoginForm
          // The error is shown by onError; don't let the rejection escape the form
          onSubmit={(input) =>
            signIn.mutateAsync(input).then(
              () => undefined,
              () => undefined,
            )
          }
        />
      </Flex>
    </LoginLayout>
  );
}
