"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthMessage, AuthPasswordField, AuthShell } from "@/components/auth/AuthForm";
import { apiFetch } from "@/lib/orm_service";
import { AUTH_PASSWORD_MIN_LENGTH, AuthFieldErrors, readAuthError } from "@/lib/auth-form";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: AuthFieldErrors = {};
    if (password.length < AUTH_PASSWORD_MIN_LENGTH) nextErrors.password = `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`;
    if (!confirmPassword) nextErrors.confirmPassword = "Confirm your new password.";
    else if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (!token) setApiError("This password reset link is invalid or has expired.");
    if (Object.keys(nextErrors).length || !token) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setApiError("");
    try {
      const response = await apiFetch({
        url: "/auth/reset-password",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({ token, password, confirmPassword }),
        suppressGlobalError: true,
      });
      if (!response?.ok) {
        const error = await readAuthError(response, "This password reset link is invalid or has expired.");
        setErrors(error.fields);
        setApiError(error.message);
        return;
      }
      setUpdated(true);
      window.history.replaceState({}, "", "/web/reset-password");
    } finally {
      setLoading(false);
    }
  };

  if (updated) {
    return (
      <AuthShell title="Password Updated" description="You can now login using your new password.">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
          <AuthMessage type="success">Password updated successfully.</AuthMessage>
          <Button asChild className="w-full rounded-xl"><Link href="/web/login">Go to Login</Link></Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset Password" description="Choose a new secure password for your account.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthPasswordField label="New password" id="new-password" name="password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: "" })); }} autoComplete="new-password" autoFocus placeholder={`At least ${AUTH_PASSWORD_MIN_LENGTH} characters`} error={errors.password} />
        <AuthPasswordField label="Confirm new password" id="confirm-new-password" name="confirmPassword" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setErrors((current) => ({ ...current, confirmPassword: "" })); }} autoComplete="new-password" placeholder="Confirm new password" error={errors.confirmPassword} />
        {apiError && <AuthMessage type="error">{apiError}</AuthMessage>}
        <Button type="submit" disabled={loading || !token} className="w-full cursor-pointer rounded-xl">
          {loading && <Loader2 className="animate-spin" />}{loading ? "Updating password..." : "Reset Password"}
        </Button>
        <Button asChild variant="ghost" className="w-full"><Link href="/web/login"><ArrowLeft /> Back to Login</Link></Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell title="Reset Password" description="Preparing your secure reset form..."><div className="h-40 animate-pulse rounded-xl bg-muted" /></AuthShell>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
