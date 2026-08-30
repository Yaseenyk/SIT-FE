"use client";

import Link from "next/link";
import { AccountNotice } from "@/components/auth/account-notice";
import { AuthShell } from "@/components/auth/shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthProvider, useAuth } from "@/lib/auth/context";
import { SettingsProvider } from "@/lib/settings-context";
import { AccountHome } from "./home";

/**
 * The student account area.
 *
 * <p>Signing in happens IN PLACE rather than by bouncing to `/login/` and back. A student
 * following an emailed link to their account should land on a sign-in form that then shows
 * them the page they asked for — a redirect round trip loses that intent, and on a static
 * export there is no server to remember it for us.
 */
function Gate() {
  const { state, configured } = useAuth();

  if (!configured) {
    return (
      <AuthShell
        title="Accounts are not set up yet"
        intro="This site is deployed without its Firebase configuration."
      >
        <p className="text-sm text-muted">
          Everything else on the site works — this only affects accounts.
        </p>
      </AuthShell>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-sm text-muted">Loading your account…</p>
      </div>
    );
  }

  if (state === "signed-out") {
    return (
      <AuthShell
        title="Sign in to your account"
        intro="Your registrations, applications and profile live here."
        footer={
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup/" className="font-semibold text-navy2 hover:underline">
              Create one
            </Link>
          </>
        }
      >
        <SignInForm />
      </AuthShell>
    );
  }

  if (state !== "active") {
    return <AccountNotice />;
  }

  return <AccountHome />;
}

export function AccountGate() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Gate />
      </SettingsProvider>
    </AuthProvider>
  );
}
