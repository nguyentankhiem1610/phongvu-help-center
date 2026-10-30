import { LoginScreen } from "@/views/components/login-screen";
export default function LoginPage({
  legacyAuth = false,
}: {
  legacyAuth?: boolean;
}) {
  return <LoginScreen legacyAuth={legacyAuth} />;
}
