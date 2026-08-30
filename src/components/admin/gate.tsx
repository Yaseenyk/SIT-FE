"use client";

import { AuthProvider, useAuth } from "@/lib/auth/context";
import { SettingsProvider } from "@/lib/settings-context";
import { Dashboard } from "./dashboard";
import { LoginForm } from "./login-form";

/**
 * Shows the dashboard or the login form.
 *
 * Note what this is NOT: a security boundary. Everything here runs in the browser, and on
 * a static export there is no middleware that could gate a route. Anyone can load the
 * dashboard markup by editing their own JavaScript — and it will be empty, because every
 * request it makes needs a token the server validates. The real check is
 * `SecurityConfig`; this is a convenience so the admin sees the right screen.
 */
function Gate() {
  const { username, ready } = useAuth();

  // Blank until the stored token has been checked. Rendering the login form first would
  // flash it at an already-signed-in admin on every reload.
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse font-mono text-xs text-muted">Checking your session…</p>
      </div>
    );
  }

  return username ? <Dashboard /> : <LoginForm />;
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
