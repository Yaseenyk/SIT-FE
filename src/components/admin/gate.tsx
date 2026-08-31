"use client";

import Link from "next/link";
import { AccountNotice } from "@/components/auth/account-notice";
import { AuthProvider, useAuth } from "@/lib/auth/context";
import { SettingsProvider } from "@/lib/settings-context";
import { Dashboard } from "./dashboard";
import { LoginForm } from "./login-form";

/**
 * Shows the dashboard, the sign-in form, or an explanation.
 *
 * <p>Note what this is NOT: a security boundary. Everything here runs in the browser, and
 * on a static export there is no middleware that could gate a route. Anyone can load the
 * dashboard markup by editing their own JavaScript — and it will be empty, because every
 * request it makes needs a token the server validates. The real check is
 * {@code SecurityConfig}; this is a convenience so the right person sees the right screen.
 *
 * <p>The branch on `state` rather than on a boolean is the point. A student who signs in
 * here holds a completely valid session and still has no dashboard, and so does an admin
 * who has not confirmed their address — each needs to be told which, or the screen is a
 * dead end.
 */
function Gate() {
  const { state, isAdmin, me } = useAuth();

  // Blank until the stored session has been checked. Rendering the sign-in form first
  // would flash it at an already-signed-in admin on every reload.
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-sm text-muted">Checking your session…</p>
      </div>
    );
  }

  if (state === "signed-out") {
    return <LoginForm />;
  }

  if (state !== "active") {
    return <AccountNotice />;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-sky uppercase">
          Not an administrator
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold">
          You are signed in as a student
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {me?.email} does not have dashboard access. An existing administrator can grant
          it from the Accounts panel — signing up can never grant it, by design.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/account/"
            className="rounded-md bg-sky2 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Go to my account
          </Link>
          <Link
            href="/"
            className="rounded-md border border-line2 px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Back to the site
          </Link>
        </div>
      </main>
    );
  }

  return <Dashboard />;
}

export function AdminGate() {
  return (
    <AuthProvider>
      {/* The account panel reads the live announcement, so it needs settings too. */}
      <SettingsProvider>
        <Gate />
      </SettingsProvider>
    </AuthProvider>
  );
}
