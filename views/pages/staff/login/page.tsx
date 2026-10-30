import { LoginScreen } from "@/views/components/login-screen";
export default function StaffLoginPage({
  legacyAuth = false,
}: {
  legacyAuth?: boolean;
}) {
  return <LoginScreen staff legacyAuth={legacyAuth} />;
}
