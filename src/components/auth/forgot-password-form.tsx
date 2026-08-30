"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/interactive";
import { useAuth } from "@/lib/auth/context";
import { authErrorMessage } from "@/lib/firebase";
import { AUTH_INPUT, AuthField, AuthNotice } from "./shell";

/**
 * Requesting a password reset.
 *
 * <h2>Why it always says the same thing</h2>
 *
 * <p>The success message is shown whether or not an account exists for the address — and
 * even when Firebase reports `auth/user-not-found`, which is caught and treated as
 * success. Saying "no account found" would turn this form into an oracle for testing
 * whether any given person has an account here, which is exactly what the sign-in form is
 * careful not to be.
 *
 * <p>There is no second screen for choosing the new password: Firebase hosts that page and
 * the emailed link goes straight to it. Building our own would mean handling the reset
 * code ourselves — for no gain, since the code is issued and validated by Firebase either
 * way.
 */
export function ForgotPasswordForm() {
  const { sendReset } = useAuth();
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    setBusy(true);
    setError(null);
    try {
      await sendReset(email);
      setSent(email);
    } catch (resetError) {
      const code =
        typeof resetError === "object" && resetError !== null && "code" in resetError
          ? String((resetError as { code: unknown }).code)
          : "";
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        // Deliberately indistinguishable from success — see the note above.
        setSent(email);
      } else {
        setError(authErrorMessage(resetError));
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <AuthNotice tone="success">
          If an account exists for <span className="font-semibold">{sent}</span>, a reset
          link is on its way. It expires in an hour.
        </AuthNotice>
        <p className="text-sm leading-relaxed text-muted">
          Nothing after a few minutes? Check your spam folder, and make sure you used your
          institute address.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login/"
            className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to sign in
          </Link>
          <button
            type="button"
            onClick={() => setSent(null)}
            className="rounded-md border border-rule-strong px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Use a different address
          </button>
        </div>
      </div>
    );
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

      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Sending…" : "Email me a reset link"}
      </Button>

      <p className="text-center text-sm">
        <Link href="/login/" className="text-navy2 hover:underline">
          Remembered it? Sign in
        </Link>
      </p>
    </form>
  );
}
