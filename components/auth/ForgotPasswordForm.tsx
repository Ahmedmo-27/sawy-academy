"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { forgotPasswordRequest } from "@/lib/api/auth";
import { forgotPasswordSchema, issuesByField } from "@/lib/validation/forms";

const fieldClass =
  "w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200";

export function ForgotPasswordForm() {
  const formErrorId = useId();
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      const nextErrors = issuesByField(result.error);
      setFieldErrors(nextErrors);
      setErrorMessage(Object.values(nextErrors)[0] ?? "Check your details.");
      requestAnimationFrame(() => {
        document.getElementById("forgot-email")?.focus();
      });
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await forgotPasswordRequest(result.data.email);
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to process request. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hairline-border mt-4 overflow-hidden bg-concrete/80">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-concrete-dark/35 px-6 py-4 sm:px-8">
        <div>
          <p className="eyebrow text-clay">Access Recovery</p>
          <p className="type-infill mt-1 text-charcoal-infill">
            Request a password reset link for your account.
          </p>
        </div>
        <ScaleBar scale="1:100" className="max-w-[100px] opacity-70" />
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        {submitted ? (
          <div className="space-y-6">
            <div className="hairline-border bg-concrete-dark/40 p-6">
              <p className="label-caps mb-2 text-clay">Reset link dispatched</p>
              <p className="type-body">
                If an account is associated with <strong>{email}</strong>, a
                password reset link has been generated and sent to that address.
              </p>
              <p className="type-infill mt-4 text-charcoal-muted">
                Please check your inbox (and spam folder). The link will expire in 60 minutes.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/login" className="action-primary inline-flex min-h-11 items-center">
                Return to sign in
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
                <label htmlFor="forgot-email" className="label-caps block mb-2">
                  Account Email
                  <span className="text-clay"> *</span>
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  name="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email
                      ? "forgot-email-error"
                      : errorMessage
                        ? formErrorId
                        : undefined
                  }
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={fieldClass}
                  placeholder="you@example.com"
                />
                {fieldErrors.email && (
                  <p id="forgot-email-error" className="type-infill mt-2 text-clay" role="alert">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
                <Link href="/login" className="action-secondary text-xs">
                  ← Back to sign in
                </Link>
                <button
                  type="submit"
                  className="cta-entrance justify-center"
                  disabled={submitting}
                  aria-busy={submitting}
                >
                  {submitting ? "Sending link…" : "Send reset link"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
