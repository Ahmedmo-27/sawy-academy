"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const errorMessage = authError || fieldError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setFieldError("");

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
      const user = await login({ email: trimmedEmail, password });
      // Role-based landing: admins → control room, students → studio dashboard.
      if (user.role === "admin") {
        router.replace("/admin");
      } else {
        // TODO: Confirm student dashboard route once /dashboard ships.
        router.replace("/dashboard");
      }
    } catch (err) {
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
    <div className="hairline-border p-8 lg:p-10 mt-4 bg-concrete/80">
      <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />

      <div className="hairline-b pb-6 mb-6">
        <p className="eyebrow mb-3">Sawy Academy — Access</p>
        <p className="type-heading">Sign In</p>
      </div>

      {errorMessage && (
        <p id={formErrorId} className="type-body text-clay mb-6" role="alert">
          {errorMessage}
        </p>
      )}

      <form className="space-y-8" onSubmit={handleSubmit} noValidate>
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
            className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
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
            className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          className="cta-entrance w-full justify-center"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="hairline-t mt-8 pt-6 space-y-3">
        <p className="type-infill">
          New here?{" "}
          <Link href="/signup" className="action-secondary">
            Create an account
          </Link>
        </p>
        {/* TODO: Wire forgot-password once /api/auth/forgot-password exists.
        <p className="type-infill">
          <Link href="/forgot-password" className="action-secondary">
            Forgot password?
          </Link>
        </p>
        */}
      </div>
    </div>
  );
}
