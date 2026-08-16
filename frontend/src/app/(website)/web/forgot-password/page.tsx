"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthMessage, AuthShell, AuthTextField } from "@/components/auth/AuthForm";
import { apiFetch } from "@/lib/orm_service";
import { isValidEmail, readAuthError } from "@/lib/auth-form";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await apiFetch({
        url: "/auth/forgot-password",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({ email: email.trim() }),
        suppressGlobalError: true,
      });
      if (!response?.ok) {
        const result = await readAuthError(response, "Reset instructions could not be requested.");
        setError(result.fields.email ?? result.message);
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title="Check your email" description="Password reset instructions have been requested.">
        <div className="space-y-4">
          <AuthMessage type="success">If an account exists for this address, we&apos;ve sent instructions for resetting your password.</AuthMessage>
          <Button asChild variant="outline" className="w-full rounded-xl"><Link href="/web/login"><ArrowLeft /> Back to Login</Link></Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot Password" description="Enter your email and we’ll send you a secure password reset link.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthTextField label="Email address" id="forgot-email" name="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} autoComplete="email" autoFocus placeholder="name@example.com" error={error} icon={<Mail className="size-4 text-muted-foreground" />} />
        <Button type="submit" disabled={loading} className="w-full cursor-pointer rounded-xl">
          {loading && <Loader2 className="animate-spin" />}{loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <Button asChild variant="ghost" className="w-full"><Link href="/web/login"><ArrowLeft /> Back to Login</Link></Button>
      </form>
    </AuthShell>
  );
}
