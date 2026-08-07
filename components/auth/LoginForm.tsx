"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { DeviceLimitPanel } from "@/components/auth/DeviceLimitPanel";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api/client";
import type { RegisteredDevice } from "@/lib/api/devices";
import { postAuthPath } from "@/lib/auth/postAuthPath";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldClass =
  "w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const formErrorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockedDevices, setBlockedDevices] = useState<RegisteredDevice[] | null>(
    null
  );

  const errorMessage = authError || fieldError;

  async function attemptLogin(trimmedEmail: string, loginPassword: string) {
    const user = await login({ email: trimmedEmail, password: loginPassword });
    router.replace(postAuthPath(user));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setFieldError("");
    setBlockedDevices(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFieldError("Email and password are required.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await attemptLogin(trimmedEmail, password);
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        err.code === "DEVICE_LIMIT_REACHED" &&
        err.devices?.length
      ) {
        setBlockedDevices(err.devices);
        return;
      }

      if (err instanceof ApiClientError && err.status === 401) {
        setAuthError("Invalid credentials. Check your email and password.");
      } else {
        setAuthError(
          err instanceof Error
            ? err.message
            : "Unable to sign in. Try again shortly."
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
          <p className="eyebrow text-clay">Credential sheet</p>
          <p className="type-infill mt-1 text-charcoal-infill">
            Sign in to continue your studio work.
          </p>
        </div>
        <ScaleBar scale="1:100" className="max-w-[100px] opacity-70" />
      </div>

      <div className="p-6 sm:p-8 lg:p-10">
      {blockedDevices && <DeviceLimitPanel devices={blockedDevices} />}

      {errorMessage && (
          <p id={formErrorId} className="type-body text-clay mb-6" role="alert">
            {errorMessage}
          </p>
        )}

        <form className="space-y-7" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="login-email" className="label-caps block mb-2">
              Email
              <span className="text-clay"> *</span>
            </label>
            <input
              type="email"
              id="login-email"
              name="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? formErrorId : undefined}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <label htmlFor="login-password" className="label-caps">
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
              id="login-password"
              name="password"
              autoComplete="current-password"
              required
              aria-required="true"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={errorMessage ? formErrorId : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="cta-entrance w-full justify-center"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="hairline-t mt-8 space-y-3 pt-6 lg:hidden">
          <p className="type-infill">
            New here?{" "}
            <Link href="/signup" className="action-secondary">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
