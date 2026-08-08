import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AuthPageShell
      mode="signup"
      doorwayLabel="ENROLLMENT THRESHOLD"
      frameLabel="Enrollment sheet"
    >
      <SignupForm />
    </AuthPageShell>
  );
}
