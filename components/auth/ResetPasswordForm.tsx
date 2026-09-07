"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useId, useState } from "react";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { resetPasswordRequest, verifyResetTokenRequest } from "@/lib/api/auth";
import { issuesByField, resetPasswordSchema } from "@/lib/validation/forms";

const fieldClass =
  "w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const formErrorId = useId();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenEmail, setTokenEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }

    let active = true;
    verifyResetTokenRequest(token)
      .then((res) => {
        if (active) {
          setTokenValid(Boolean(res.valid));
          if (res.email) setTokenEmail(res.email);
        }
      })
      .catch(() => {
        if (active) {
          setTokenValid(false);
        }
      })
      .finally(() => {
        if (active) setVerifying(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const nextErrors = issuesByField(result.error);
      setFieldErrors(nextErrors);
      setErrorMessage(Object.values(nextErrors)[0] ?? "Check your details.");
      requestAnimationFrame(() => {
        document
          .getElementById(
            nextErrors.password ? "reset-password" : "reset-confirm-password"
          )
          ?.focus();
      });
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await resetPasswordRequest(result.data.password, token);
      setResetSuccess(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to reset password. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (verifying) {
    return (
      <div className="hairline-border mt-4 bg-concrete/80 p-8 text-center" role="status">
        <p className="label-caps !text-charcoal-muted">Verifying recovery link…</p>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="hairline-border mt-4 overflow-hidden bg-concrete/80">
        <div className="border-b border-hairline bg-concrete-dark/35 px-6 py-4 sm:px-8">
          <p className="eyebrow text-clay">Invalid Link</p>
        </div>
        <div className="p-6 sm:p-8 lg:p-10 space-y-6">
          <p className="type-body text-charcoal">
            This password reset link is invalid or has expired. Password reset links
            are single-use and expire after 60 minutes.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/forgot-password"
              className="action-primary inline-flex min-h-11 items-center"
            >
              Request a new reset link
            </Link>
            <Link
              href="/login"
              className="action-secondary inline-flex min-h-11 items-center"
            >
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hairline-border mt-4 overflow-hidden bg-concrete/80">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-concrete-dark/35 px-6 py-4 sm:px-8">
        <div>
          <p className="eyebrow text-clay">New Password</p>
          <p className="type-infill mt-1 text-charcoal-infill">
            {tokenEmail ? `Updating password for ${tokenEmail}` : "Enter your new password."}
          </p>
        </div>
        <ScaleBar scale="1:100" className="max-w-[100px] opacity-70" />
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        {resetSuccess ? (
          <div className="space-y-6">
            <div className="hairline-border bg-concrete-dark/40 p-6">
              <p className="label-caps mb-2 text-clay">Password Updated</p>
              <p className="type-body">
                Your password has been successfully reset. You can now sign in with
                your new credentials.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/login" className="action-primary inline-flex min-h-11 items-center">
                Sign in to your account
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <p id={formErrorId} className="type-body text-clay mb-6" role="alert">
                {errorMessage}
              </p>
            )}

            <form className="space-y-7" onSubmit={handleSubmit} noValidate>
              <FormErrorSummary errors={Object.values(fieldErrors)} />

              <div>
                <div className="mb-2 flex items-baseline justify-between gap-4">
                  <label htmlFor="reset-password" className="label-caps">
                    New Password
                    <span className="text-clay"> * (min 8 chars)</span>
                  </label>
                  <button
                    type="button"
                    className="action-secondary text-[0.625rem]"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="reset-password"
                  name="password"
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password
                      ? "reset-password-error"
                      : errorMessage
                        ? formErrorId
                        : undefined
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={fieldClass}
                  placeholder="••••••••"
                />
                {fieldErrors.password && (
                  <p id="reset-password-error" className="type-infill mt-2 text-clay" role="alert">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reset-confirm-password" className="label-caps block mb-2">
                  Confirm Password
                  <span className="text-clay"> *</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="reset-confirm-password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={
                    fieldErrors.confirmPassword
                      ? "reset-confirm-password-error"
                      : errorMessage
                        ? formErrorId
                        : undefined
                  }
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={fieldClass}
                  placeholder="••••••••"
                />
                {fieldErrors.confirmPassword && (
                  <p
                    id="reset-confirm-password-error"
                    className="type-infill mt-2 text-clay"
                    role="alert"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="cta-entrance w-full justify-center"
                  disabled={submitting}
                  aria-busy={submitting}
                >
                  {submitting ? "Updating password…" : "Reset password"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
