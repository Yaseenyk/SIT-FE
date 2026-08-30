"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/interactive";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { SITE } from "@/lib/site";
import { FIELD, Field } from "./shared";

/**
 * The admin sign-in screen.
 *
 * Notably absent, compared with the original: the arithmetic captcha and the attempt
 * counter. Both lived in browser JavaScript, where `attempts` reset on every reload and
 * `capChecked` could be set from the console — they deterred nobody who was actually
 * attacking. Lockout is now enforced server-side per account (see AdminUser), which is
 * where it cannot be edited away.
 */
export function LoginForm() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setBusy(true);
    setError(null);
    try {
      await signIn(String(data.get("username") ?? ""), String(data.get("password") ?? ""));
    } catch (signInError) {
      setError(
        signInError instanceof ApiError
          ? signInError.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-serif text-2xl font-extrabold tracking-tight text-navy2">
            {SITE.name}
          </Link>
          <h1 className="mt-4 font-serif text-sm font-bold tracking-tight">Admin sign in</h1>
          <p className="mt-1 text-xs text-muted">Committee members only.</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <Field label="Username" htmlFor="username" required>
            <input
              id="username"
              name="username"
              required
              autoComplete="username"
              autoFocus
              className={FIELD}
            />
          </Field>

          <Field label="Password" htmlFor="password" required>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className={`${FIELD} pe-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 end-0 px-3 text-[0.65rem] font-semibold text-muted hover:text-navy2"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          {error ? (
            <p role="alert" className="rounded-lg border border-red/25 bg-red/10 px-3 py-2 text-xs text-red">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="hover:text-navy2">
            ← Back to the site
          </Link>
        </p>
      </div>
    </main>
  );
}
