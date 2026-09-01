"use client";

import { useEffect, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/lib/auth/context";
import { AccountNotice } from "./account-notice";
import { ForgotPasswordForm } from "./forgot-password-form";
import { AuthNotice, AuthShell } from "./shell";
import { SignInForm } from "./sign-in-form";

/**
 * The three public account routes.
 *
 * <p>Each is its own page rather than one screen with tabs, because they are linked to
 * from different places and a student who lands on "sign up" from the hero should not have
 * to find a tab. They share `AuthShell`, so they are one design.
 *
 * <p>Every one is wrapped in its own `AuthProvider`. That looks redundant next to the one
 * in `AdminGate`, and it is not: this is a static export with no shared layout state
 * between routes, so each entry point has to establish the session for itself.
 */

/**
 * Sends an already-signed-in visitor where they were going.
 *
 * <p>A router push rather than a redirect at build time — there is no server to redirect
 * on. The effect runs after the session check resolves, so it cannot fire against a
 * momentarily-null user on first paint.
 */
function useRedirectWhenSignedIn(state: string, isAdmin: boolean) {
  useEffect(() => {
    if (state !== "active") return;
    window.location.replace("./admin/");
  }, [state, isAdmin]);
}

function Configured({ children }: { children: ReactNode }) {
  const { configured } = useAuth();
  if (configured) return <>{children}</>;

  /*
   * The Firebase variables were never set on this deployment. Saying so plainly beats the
   * alternative — a form that throws from inside its submit handler and looks broken —
   * and it names the exact fix for whoever deployed it.
   */
  return (
    <AuthShell
      title="Accounts are not set up yet"
      intro="This site is deployed without its Firebase configuration, so signing in is not available."
    >
      <div className="space-y-5">
        <AuthNotice tone="error">
          Set the <code className="font-mono text-xs">NEXT_PUBLIC_FIREBASE_*</code> repository
          variables and re-run the deploy workflow.
        </AuthNotice>
        <p className="text-sm leading-relaxed text-muted">
          Everything else on the site works — this only affects accounts.
        </p>
      </div>
    </AuthShell>
  );
}

function SignInInner() {
  const { state, isAdmin } = useAuth();
  useRedirectWhenSignedIn(state, isAdmin);

  if (state === "loading") return <AuthLoading />;
  if (state !== "signed-out" && state !== "active") return <AccountNotice />;

  return (
    <AuthShell
      title="Sign in"
      intro="For students and committee members of the Department of CSE (AI & ML)."
    >
      <SignInForm />
    </AuthShell>
  );
}


function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="animate-pulse text-sm text-muted">Checking your session…</p>
    </div>
  );
}

export function SignInPage() {
  return (
    <AuthProvider>
      <Configured>
        <SignInInner />
      </Configured>
    </AuthProvider>
  );
}


export function ForgotPasswordPage() {
  return (
    <AuthProvider>
      <Configured>
        <AuthShell
          title="Reset your password"
          intro="Enter your address and we will email you a link to set a new password."
        >
          <ForgotPasswordForm />
        </AuthShell>
      </Configured>
    </AuthProvider>
  );
}
