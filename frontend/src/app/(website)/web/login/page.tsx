"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Loader2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthMessage, AuthPasswordField, AuthShell, AuthTextField } from "@/components/auth/AuthForm";
import { apiFetch } from "@/lib/orm_service";
import { AuthFieldErrors, readAuthError } from "@/lib/auth-form";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: AuthFieldErrors = {};
    if (!login.trim()) nextErrors.login = "Username or email is required.";
    if (!password) nextErrors.password = "Password is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setApiError("");
    try {
      const response = await apiFetch({
        url: "/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({ login: login.trim(), password, rememberMe }),
        suppressGlobalError: true,
      });
      if (!response?.ok) {
        const error = await readAuthError(response, "Invalid login credentials.");
        setErrors(error.fields);
        setApiError(response?.status === 401 ? "Invalid login credentials." : error.message);
        return;
      }
      window.location.assign("/web");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome Back"
      description="Login to continue to your account"
      footer={(
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/web/signup" className="font-medium text-primary hover:underline">Sign up</Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthTextField
          id="login"
          name="login"
          label="Username or email"
          type="text"
          value={login}
          onChange={(event) => {
            setLogin(event.target.value);
            setErrors((current) => ({ ...current, login: "" }));
          }}
          autoComplete="username"
          autoFocus
          placeholder="Username or email"
          error={errors.login}
          icon={<UserRound className="size-4 text-muted-foreground" />}
        />
        <AuthPasswordField
          id="password"
          name="password"
          label="Password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: "" }));
          }}
          autoComplete="current-password"
          placeholder="Password"
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-4 rounded border-gray-300 accent-primary"
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <Link href="/web/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </div>

        {apiError && <AuthMessage type="error">{apiError}</AuthMessage>}
        <Button type="submit" disabled={loading} className="w-full cursor-pointer rounded-xl">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthShell>
  );
}
