import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthPageShell
      mode="login"
      doorwayLabel="SECURITY THRESHOLD"
      frameLabel="Password update sheet"
    >
      <Suspense
        fallback={
          <div className="hairline-border mt-4 bg-concrete/80 p-8 text-center" role="status">
            <p className="label-caps !text-charcoal-muted">Loading reset form…</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
