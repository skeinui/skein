import { Alert, Card, Flex, Text, Title, toast } from "@skeinui/ui";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
{{#if shell}}
import { Toolbar } from "@/modules/toolbar";
{{/if}}
import { useAuthStore } from "@/store/auth-store";
import { login } from "./api";
import { LoginForm } from "./components/login-form";
import { useLoginTranslation } from "./locales";

export function LoginPage() {
  const { t } = useLoginTranslation();
  const navigate = useNavigate();
  // The session ended by itself (lib/http.ts): say so
  const expired = useAuthStore((s) => s.expired);
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
    <main className="login">
{{#if shell}}
      <div className="login-toolbar">
        <Toolbar place="login" />
      </div>
{{/if}}
      <div className="login-card">
        <Card>
          <Card.Body>
            <Flex direction="column" gap="lg">
              <Flex direction="column" gap="xs">
                <Title level={3}>{t("title", { app: "{{title}}" })}</Title>
                <Text tone="secondary">{t("subtitle")}</Text>
              </Flex>
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
{{#if mock}}
              <Text tone="secondary">{t("mockHint")}</Text>
{{/if}}
            </Flex>
          </Card.Body>
        </Card>
      </div>
    </main>
  );
}
