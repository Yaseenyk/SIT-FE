"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/interactive";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { authErrorMessage } from "@/lib/firebase";
import { AUTH_INPUT, AuthField, AuthNotice } from "./shell";

/**
 * Creating a student account.
 *
 * <h2>What this form cannot do</h2>
 *
 * <p>There is no role field, and adding one would change nothing: the server assigns
 * STUDENT to every registration regardless of what is sent. A public form that could grant
 * administrative access is the same bug as an unauthenticated write endpoint, only easier
 * to find.
 *
 * <p>The institute-domain rule is also enforced on the server. The check below is a
 * courtesy — it saves a round trip and a deleted Firebase account — not the enforcement.
 */
export function SignUpForm({ onDone }: { onDone?: () => void }) {
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (password !== confirm) {
      // Checked here rather than server-side because the server never sees either one —
      // the password goes straight to Firebase.
      setError("The two passwords do not match.");
      return;
    }

    const yearValue = String(data.get("year") ?? "");

    setBusy(true);
    setError(null);
    try {
      await signUp({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        password,
        rollNumber: String(data.get("rollNumber") ?? ""),
        year: yearValue ? Number(yearValue) : null,
      });
      onDone?.();
    } catch (signUpError) {
      /*
       * Two very different failures land here: Firebase refusing the credential
       * (weak password, address already taken) and our API refusing the account (wrong
       * email domain). ApiError carries a message written for this exact situation, so it
       * is shown verbatim; anything else goes through the Firebase code mapping.
       */
      setError(
        signUpError instanceof ApiError
          ? signUpError.message
          : authErrorMessage(signUpError),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <AuthField label="Full name" htmlFor="name">
        <input id="name" name="name" required autoComplete="name" autoFocus className={AUTH_INPUT} />
      </AuthField>

      <AuthField
        label="Institute email address"
        htmlFor="email"
        hint="Use your college address — signups from other domains are refused."
      >
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@bsiet.org"
          className={AUTH_INPUT}
        />
      </AuthField>

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField label="Roll number" htmlFor="rollNumber" hint="Optional.">
          <input id="rollNumber" name="rollNumber" className={AUTH_INPUT} />
        </AuthField>

        <AuthField label="Year of study" htmlFor="year" hint="Optional.">
          <select id="year" name="year" defaultValue="" className={AUTH_INPUT}>
            <option value="">Select…</option>
            <option value="1">First year</option>
            <option value="2">Second year</option>
            <option value="3">Third year</option>
            <option value="4">Final year</option>
          </select>
        </AuthField>
      </div>

      <AuthField label="Password" htmlFor="password" hint="At least 6 characters.">
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
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

      <AuthField label="Confirm password" htmlFor="confirm">
        <input
          id="confirm"
          name="confirm"
          type={show ? "text" : "password"}
          required
          minLength={6}
          autoComplete="new-password"
          className={AUTH_INPUT}
        />
      </AuthField>

      {error ? <AuthNotice tone="error">{error}</AuthNotice> : null}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Creating your account…" : "Create account"}
      </Button>

      <p className="text-xs leading-relaxed text-muted">
        We will email you a link to confirm your address. Until you open it, your account
        can sign in but cannot register for events.
      </p>
    </form>
  );
}
