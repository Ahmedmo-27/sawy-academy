"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { DeviceLimitPanel } from "@/components/auth/DeviceLimitPanel";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api/client";
import type { RegisteredDevice } from "@/lib/api/devices";
import { postAuthPath } from "@/lib/auth/postAuthPath";
import { issuesByField, signupSchema } from "@/lib/validation/forms";
const MIN_PASSWORD_LENGTH = 8;

const fieldClass =
  "w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200";

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const formErrorId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockedDevices, setBlockedDevices] = useState<RegisteredDevice[] | null>(
    null
  );

  const errorMessage = authError || fieldError;

  async function attemptSignup(
    trimmedName: string,
    trimmedEmail: string,
    signupPassword: string
  ) {
    const user = await signup({
      name: trimmedName,
      email: trimmedEmail,
      password: signupPassword,
    });

    router.replace(postAuthPath(user));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setFieldError("");
    setBlockedDevices(null);

    const result = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const nextErrors = issuesByField(result.error);
      setFieldErrors(nextErrors);
      setFieldError(Object.values(nextErrors)[0] ?? "Check your details.");
      const first = Object.keys(nextErrors)[0];
      requestAnimationFrame(() =>
        document.getElementById(`signup-${first === "confirmPassword" ? "confirm" : first}`)?.focus()
      );
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await attemptSignup(result.data.name, result.data.email, result.data.password);
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        err.code === "DEVICE_LIMIT_REACHED" &&
        err.devices?.length
      ) {
        setBlockedDevices(err.devices);
        return;
      }

      if (err instanceof ApiClientError && err.status === 409) {
        setAuthError("An account with this email already exists.");
      } else {
        setAuthError(
          err instanceof Error
            ? err.message
            : "Unable to create account. Try again shortly."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="hairline-border mt-4 overflow-hidden bg-concrete/80">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-concrete-dark/35 px-6 py-4 sm:px-8">
        <div>
          <p className="eyebrow text-clay">Enrollment sheet</p>
          <p className="type-infill mt-1 text-charcoal-infill">
            Open a student register for the academy.
          </p>
        </div>
        <ScaleBar scale="1:100" className="max-w-[100px] opacity-70" />
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
        {blockedDevices && (
          <DeviceLimitPanel
            devices={blockedDevices}
            email={email}
          />
        )}

        {errorMessage && (
          <p id={formErrorId} className="type-body text-clay mb-6" role="alert">
            {errorMessage}
          </p>
        )}

        <form className="space-y-7" onSubmit={handleSubmit} noValidate>
          <FormErrorSummary errors={Object.values(fieldErrors)} />
          <div>
            <label htmlFor="signup-name" className="label-caps block mb-2">
              Full name
              <span className="text-clay"> *</span>
            </label>
            <input
              type="text"
              id="signup-name"
              name="name"
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "signup-name-error" : errorMessage ? formErrorId : undefined}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
              placeholder="Your name"
            />
            {fieldErrors.name && <p id="signup-name-error" className="type-infill mt-2 text-clay" role="alert">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="signup-email" className="label-caps block mb-2">
              Email
              <span className="text-clay"> *</span>
            </label>
            <input
              type="email"
              id="signup-email"
              name="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "signup-email-error" : errorMessage ? formErrorId : undefined}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
              placeholder="you@example.com"
            />
            {fieldErrors.email && <p id="signup-email-error" className="type-infill mt-2 text-clay" role="alert">{fieldErrors.email}</p>}
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <label htmlFor="signup-password" className="label-caps">
                Password
                <span className="text-clay"> *</span>
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
              id="signup-password"
              name="password"
              autoComplete="new-password"
              required
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "signup-password-error" : errorMessage ? formErrorId : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            />
            {fieldErrors.password && <p id="signup-password-error" className="type-infill mt-2 text-clay" role="alert">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="signup-confirm" className="label-caps block mb-2">
              Confirm password
              <span className="text-clay"> *</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="signup-confirm"
              name="confirmPassword"
              autoComplete="new-password"
              required
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? "signup-confirm-error" : errorMessage ? formErrorId : undefined}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={fieldClass}
              placeholder="Repeat password"
            />
            {fieldErrors.confirmPassword && <p id="signup-confirm-error" className="type-infill mt-2 text-clay" role="alert">{fieldErrors.confirmPassword}</p>}
          </div>

          <p className="type-infill">
            By creating an account you agree to our{" "}
            <Link href="/privacy" className="action-secondary">
              Privacy Policy
            </Link>
            .
          </p>

          <button
            type="submit"
            className="cta-entrance w-full justify-center"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="hairline-t mt-8 pt-6 lg:hidden">
          <p className="type-infill">
            Already enrolled?{" "}
            <Link href="/login" className="action-secondary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
