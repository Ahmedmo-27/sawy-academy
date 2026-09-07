import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      mode="login"
      doorwayLabel="RECOVERY THRESHOLD"
      frameLabel="Password recovery sheet"
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
