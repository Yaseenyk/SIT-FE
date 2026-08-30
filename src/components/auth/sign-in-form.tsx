"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/interactive";
import { useAuth } from "@/lib/auth/context";
import { authErrorMessage } from "@/lib/firebase";
import { AUTH_INPUT, AuthField, AuthNotice } from "./shell";

/**
 * Email and password, verified by Firebase.
 *
 * <p>Notably absent, compared with the original single-file site: the arithmetic captcha
 * and the attempt counter. Both lived in browser JavaScript, where `attempts` reset on
 * every reload and `capChecked` could be set from the console — they deterred nobody who
 * was actually attacking. Firebase rate-limits sign-in attempts server-side, which is
 * where it cannot be edited away.
 */
export function SignInForm({ onDone }: { onDone?: () => void }) {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await signIn(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
      onDone?.();
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthField label="Email address" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@bsiet.org"
          className={AUTH_INPUT}
        />
      </AuthField>

      <AuthField label="Password" htmlFor="password">
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            className={`${AUTH_INPUT} pe-16`}
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="absolute inset-y-0 end-0 px-3.5 text-xs font-semibold text-muted hover:text-navy2"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </AuthField>

      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm">
        <Link href="/forgot-password/" className="text-navy2 hover:underline">
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
