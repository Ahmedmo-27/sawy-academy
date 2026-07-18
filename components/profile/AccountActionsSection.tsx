"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ThresholdFrame } from "@/components/layout/ThresholdFrame";
import { useToast } from "@/components/feedback/ToastProvider";
import { useAuth } from "@/hooks/useAuth";
import { changePassword } from "@/lib/api/users";
import { ApiClientError } from "@/lib/api/client";

type PasswordStatus = "idle" | "submitting" | "error";

/**
 * Change-password-while-logged-in only.
 * Forgot-password / reset-by-email is a separate flow — do not conflate the two.
 */
export function AccountActionsSection() {
  const router = useRouter();
  const { logout } = useAuth();
  const { success } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const [status, setStatus] = useState<PasswordStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setValidationError("");
    setErrorMessage("");
    setStatus("idle");

    if (newPassword.length < 8) {
      setValidationError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError("New password and confirmation do not match.");
      return;
    }

    setStatus("submitting");

    try {
      // TODO: Confirm PUT /api/users/me/password once auth API ships.
      await changePassword({
        currentPassword,
        newPassword,
      });
      setStatus("idle");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      success("Password updated");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to change password."
      );
    }
  }

  function confirmLogout() {
    setLogoutOpen(false);
    logout();
    router.replace("/");
  }

  return (
    <ThresholdFrame label="ACCOUNT ACTIONS" labelAsHeading>
      <div className="hairline-border mt-4 bg-concrete/80">
        <form
          onSubmit={(event) => void handlePasswordSubmit(event)}
          className="p-8 space-y-6 hairline-b"
        >
          <div>
            <p className="eyebrow text-clay mb-2">Change password</p>
            <p className="type-infill max-w-md">
              Update the password for this signed-in session. Password reset by
              email is a separate flow.
            </p>
          </div>

          <div>
            <label
              htmlFor="current-password"
              className="label-caps block mb-2"
            >
              Current password
              <span className="text-clay"> *</span>
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              aria-required="true"
              aria-invalid={Boolean(validationError || status === "error")}
              aria-describedby={
                validationError || status === "error"
                  ? "account-password-error"
                  : undefined
              }
              className="w-full max-w-md bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="label-caps block mb-2">
              New password
              <span className="text-clay"> *</span>
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              aria-required="true"
              aria-invalid={Boolean(validationError || status === "error")}
              aria-describedby={
                validationError || status === "error"
                  ? "account-password-error"
                  : undefined
              }
              className="w-full max-w-md bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="label-caps block mb-2"
            >
              Confirm new password
              <span className="text-clay"> *</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              aria-required="true"
              aria-invalid={Boolean(validationError || status === "error")}
              aria-describedby={
                validationError || status === "error"
                  ? "account-password-error"
                  : undefined
              }
              className="w-full max-w-md bg-transparent border-0 border-b border-hairline px-0 py-3 type-body text-charcoal focus-visible:border-clay transition-colors duration-200"
            />
          </div>

          {(validationError || status === "error") && (
            <p id="account-password-error" className="type-body text-clay" role="alert">
              {validationError || errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="cta-entrance"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Updating…" : "Update password"}
          </button>
        </form>

        <div className="p-8">
          <p className="eyebrow text-clay mb-3">Session</p>
          <button
            type="button"
            className="action-secondary"
            onClick={() => setLogoutOpen(true)}
          >
            Log out
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Log out?"
        message="You will need to sign in again to access your account."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        variant="public"
        confirmTone="primary"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </ThresholdFrame>
  );
}
