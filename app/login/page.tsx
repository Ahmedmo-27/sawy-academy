import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthPageShell
      mode="login"
      doorwayLabel="ACCESS THRESHOLD"
      frameLabel="Credential sheet"
    >
      <LoginForm />
    </AuthPageShell>
  );
}
