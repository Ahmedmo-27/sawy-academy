import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignupForm } from "@/components/auth/SignupForm";

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
