"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/interactive";
import { useAuth } from "@/lib/auth/context";
import { authErrorMessage } from "@/lib/firebase";
import { AuthNotice, AuthShell } from "./shell";

/**
 * The screen for an account that is signed in but cannot yet act.
 *
 * <p>This exists because "signed in" is not one state. A student can hold a completely
 * valid Firebase session and still be refused every endpoint — because they never finished
 * registering, because they have not opened the verification email, or because an admin
 * suspended them. Each is a different problem with a different next step, and without this
 * screen all three look identical: a 403 with nothing to do about it.
 *
 * <p>The three cases map one-for-one onto the authority the server grants
 * (`FirebaseAuthenticationFilter.authorityFor`) and the `state` it reports, so the
 * explanation here can never drift from the decision there.
 */
export function AccountNotice() {
  const { state, me, resendVerification, refresh, signOut } = useAuth();
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (state === "unverified") {
    return (
      <AuthShell
        title="Confirm your email address"
        intro={`We sent a link to ${me?.email ?? "your address"}. Open it, then come back and choose "I have confirmed it".`}
      >
        <div className="space-y-5">
          {notice ? <AuthNotice tone={notice.tone}>{notice.text}</AuthNotice> : null}

          <p className="text-sm leading-relaxed text-muted">
            Signing up is open to anyone, so an unconfirmed address proves nothing about
            who owns it. Until the link is opened, your account can sign in but cannot
            register for events or apply to a committee.
          </p>

          <div className="flex flex-wrap gap-3">
            {/*
              The link is opened in a MAIL CLIENT, so this tab has no idea it happened —
              its cached user still says unverified and its token still carries the old
              claim. `refresh()` forces both, which is why this button has to exist at all.
            */}
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setNotice(null);
                try {
                  await refresh();
                  /*
                   * Only reached when the address is STILL unverified: a successful
                   * refresh flips `state` to active and this whole screen is replaced, so
                   * the notice below never renders in that case. Setting it
                   * unconditionally happened to work for that reason and would have
                   * started lying the moment this screen gained another state.
                   */
                  setNotice({
                    tone: "error",
                    text: "Still not confirmed. Open the link in the email, then try again.",
                  });
                } catch (error) {
                  setNotice({ tone: "error", text: authErrorMessage(error) });
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Checking…" : "I have confirmed it"}
            </Button>

            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setNotice(null);
                try {
                  await resendVerification();
                  setNotice({ tone: "success", text: "Sent. Give it a minute to arrive." });
                } catch (error) {
                  setNotice({ tone: "error", text: authErrorMessage(error) });
                } finally {
                  setBusy(false);
                }
              }}
              className="rounded-md border border-line2 px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
            >
              Resend the email
            </button>
          </div>

          <p className="text-sm">
            <button type="button" onClick={signOut} className="text-muted hover:text-sky">
              Sign out
            </button>
          </p>
        </div>
      </AuthShell>
    );
  }

  if (state === "suspended") {
    return (
      <AuthShell
        title="This account is suspended"
        intro="An administrator has disabled it. Your data is intact — the account simply cannot be used until it is restored."
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-muted">
            If you think this is a mistake, contact the association and mention the address
            you signed up with: <span className="font-semibold text-ink">{me?.email}</span>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#contact"
              className="rounded-md bg-sky2 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Contact the association
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-md border border-line2 px-5 py-2.5 text-sm font-semibold text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  /*
   * Unregistered: a Firebase credential with no profile on this site. Reachable if signup
   * was interrupted between creating the credential and calling /auth/register — a dropped
   * connection at exactly the wrong moment. Rare, but it leaves an account that can sign in
   * and do nothing, so it needs a way out.
   */
  return (
    <AuthShell
      title="Finish setting up your account"
      intro="Your sign-in works, but your profile was never created — signing up was probably interrupted partway through."
    >
      <div className="space-y-5">
        {notice ? <AuthNotice tone={notice.tone}>{notice.text}</AuthNotice> : null}
        <p className="text-sm leading-relaxed text-muted">
          Signing out and signing up again with{" "}
          <span className="font-semibold text-ink">{me?.email ?? "the same address"}</span>{" "}
          will complete it.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={signOut}>Sign out and start again</Button>
          <Link
            href="/"
            className="rounded-md border border-line2 px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Back to the site
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
