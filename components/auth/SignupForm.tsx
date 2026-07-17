"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ScaleBar } from "@/components/decorative/ScaleBar";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError } from "@/lib/api/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setFieldError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setFieldError("All fields are required.");
      return;
    }
    if (trimmedName.length < 2) {
      setFieldError("Enter your full name.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await signup({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
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
    <div className="hairline-border p-8 lg:p-10 mt-4 bg-concrete/80">
      <ScaleBar scale="1:100" className="mb-6 max-w-[120px]" />

      <div className="hairline-b pb-6 mb-6">
        <p className="eyebrow mb-3">Sawy Academy — Access</p>
        <h1 className="type-heading">Sign Up</h1>
      </div>

      {(authError || fieldError) && (
        <p className="type-body text-clay mb-6" role="alert">
          {authError || fieldError}
        </p>
      )}

      <form className="space-y-8" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="signup-name" className="label-caps block mb-2">
            Name
          </label>
          <input
            type="text"
            id="signup-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="label-caps block mb-2">
            Email
          </label>
          <input
            type="email"
            id="signup-email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor="signup-password" className="label-caps">
              Password
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label htmlFor="signup-confirm" className="label-caps block mb-2">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="signup-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            placeholder="Repeat password"
          />
        </div>

        <button
          type="submit"
          className="cta-entrance w-full justify-center"
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <div className="hairline-t mt-8 pt-6">
        <p className="type-infill">
          Already enrolled?{" "}
          <Link href="/login" className="action-secondary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
