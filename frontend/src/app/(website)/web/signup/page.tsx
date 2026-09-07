"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthMessage, AuthPasswordField, AuthShell, AuthTextField } from "@/components/auth/AuthForm";
import { apiFetch } from "@/lib/orm_service";
import {
  AUTH_PASSWORD_MIN_LENGTH,
  AuthFieldErrors,
  isValidEmail,
  readAuthError,
} from "@/lib/auth-form";

const initialForm = {
  name: "",
  email: "",
  login: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const change = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setApiError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: AuthFieldErrors = {};
    if (!form.name.trim()) nextErrors.name = "Full name is required.";
    if (!isValidEmail(form.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!form.login.trim()) nextErrors.login = "Username is required.";
    if (form.password.length < AUTH_PASSWORD_MIN_LENGTH) {
      nextErrors.password = `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters.`;
    }
    if (!form.confirmPassword) nextErrors.confirmPassword = "Confirm your password.";
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setApiError("");
    try {
      const response = await apiFetch({
        url: "/auth/signup",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify(form),
        suppressGlobalError: true,
      });
      if (!response?.ok) {
        const error = await readAuthError(response, "Your account could not be created.");
        setErrors(error.fields);
        setApiError(Object.keys(error.fields).length ? "Review the highlighted fields." : error.message);
        return;
      }
      setCreated(true);
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <AuthShell title="Account Created" description="Your account is ready to use.">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
          <AuthMessage type="success">Account created successfully. You can now login.</AuthMessage>
          <Button asChild className="w-full rounded-xl"><Link href="/web/login">Go to Login</Link></Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create Account"
      description="Create your account to get started"
      footer={<p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/web/login" className="font-medium text-primary hover:underline">Login</Link></p>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthTextField label="Full name" id="name" value={form.name} onChange={(event) => change("name", event.target.value)} autoComplete="name" autoFocus placeholder="Full name" error={errors.name} icon={<UserRound className="size-4 text-muted-foreground" />} />
        <AuthTextField label="Email address" id="email" type="email" value={form.email} onChange={(event) => change("email", event.target.value)} autoComplete="email" placeholder="name@example.com" error={errors.email} icon={<Mail className="size-4 text-muted-foreground" />} />
        <AuthTextField label="Username" id="signup-login" name="login" value={form.login} onChange={(event) => change("login", event.target.value)} autoComplete="username" placeholder="Username" error={errors.login} icon={<UserRound className="size-4 text-muted-foreground" />} />
        <AuthPasswordField label="Password" id="signup-password" name="password" value={form.password} onChange={(event) => change("password", event.target.value)} autoComplete="new-password" placeholder={`At least ${AUTH_PASSWORD_MIN_LENGTH} characters`} error={errors.password} />
        <AuthPasswordField label="Confirm password" id="confirmPassword" value={form.confirmPassword} onChange={(event) => change("confirmPassword", event.target.value)} autoComplete="new-password" placeholder="Confirm password" error={errors.confirmPassword} />
        {apiError && <AuthMessage type="error">{apiError}</AuthMessage>}
        <Button type="submit" disabled={loading} className="w-full cursor-pointer rounded-xl">
          {loading && <Loader2 className="animate-spin" />}{loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}
