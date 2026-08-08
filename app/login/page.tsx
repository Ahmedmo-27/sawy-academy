import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

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
