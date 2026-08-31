"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AUTH_INPUT, AuthField } from "@/components/auth/shell";
import { Button, ErrorNotice } from "@/components/ui/interactive";
import { Avatar, DateBlock, EmptyState, Skeleton } from "@/components/ui/primitives";
import {
  auth as authApi,
  registrations as registrationsApi,
} from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/context";
import { useApi } from "@/lib/hooks/use-api";
import { SITE } from "@/lib/site";

/**
 * A student's own page: their profile, what they are signed up for, and where their
 * committee applications stand.
 *
 * <p>All three on one screen rather than behind tabs. A student visits this page a handful
 * of times a term, with one of three questions, and tabs would hide two of the three
 * answers behind a click every time.
 */
export function AccountHome() {
  const { me, isAdmin, signOut } = useAuth();
  const registrations = useApi(() => registrationsApi.mine(), []);

  return (
    <div className="min-h-screen bg-bg2">
      <header className="band-deep pattern-dots relative isolate overflow-hidden text-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar src={me?.photoUrl ?? null} name={me?.name ?? "?"} size="xl" />
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-sky uppercase">
                  {isAdmin ? "Administrator" : "Student member"}
                </p>
                <h1 className="mt-2 font-display text-3xl font-bold text-white">
                  {me?.name ?? "Your account"}
                </h1>
                <p className="mt-1.5 text-sm text-white/65">{me?.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAdmin ? (
                <Link
                  href="/admin/"
                  className="rounded-md bg-sky px-5 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-sky3"
                >
                  Open the dashboard
                </Link>
              ) : null}
              <Link
                href="/"
                className="rounded-md border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Back to {SITE.name}
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="rounded-md border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-12 sm:px-6">
        <ProfileCard />

        {/* ── Registrations ────────────────────────────────────────────────── */}
        <section className="card p-7">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">My event registrations</h2>
            <Link href="/#events" className="text-sm font-semibold text-sky hover:underline">
              Browse events →
            </Link>
          </div>

          {registrations.loading ? (
            <Skeleton className="h-28" />
          ) : registrations.error ? (
            <ErrorNotice error={registrations.error} onRetry={registrations.reload} />
          ) : (registrations.data ?? []).length === 0 ? (
            <EmptyState
              title="You are not signed up for anything yet"
              hint="Registering for an event puts you on its attendance list and lets the organisers reach you."
              action={
                <Link
                  href="/#events"
                  className="rounded-md bg-sky2 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  See upcoming events
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {(registrations.data ?? []).map((registration) => (
                <li key={registration.eventId} className="flex items-center gap-4 py-4 first:pt-0">
                  <DateBlock iso={registration.startsOn} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold text-ink">{registration.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{registration.dateLabel}</p>
                  </div>
                  <CancelButton
                    eventId={registration.eventId}
                    onDone={registrations.reload}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>


      </main>
    </div>
  );
}


function CancelButton({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="shrink-0 rounded-md border border-line2 px-3.5 py-2 text-xs font-semibold text-muted hover:text-rose"
      >
        Cancel
      </button>
    );
  }

  return (
    <span className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await registrationsApi.cancel(eventId);
            onDone();
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-md bg-rose px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {busy ? "…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md border border-line2 px-3 py-2 text-xs font-semibold text-muted"
      >
        Keep
      </button>
    </span>
  );
}


/**
 * The editable profile.
 *
 * <p>These fields are not vanity: the roll number and year are what appear on an event's
 * attendance list and on a committee application, so a student who fills them in once
 * saves the organisers chasing them every time.
 */
function ProfileCard() {
  const { me, setMe, sendReset } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const yearValue = String(data.get("year") ?? "");

    setBusy(true);
    setNotice(null);
    try {
      const updated = await authApi.updateProfile({
        name: String(data.get("name") ?? ""),
        rollNumber: String(data.get("rollNumber") ?? "") || null,
        year: yearValue ? Number(yearValue) : null,
        // Photo uploads are wired through the dashboard's ImagePicker; keeping the
        // existing value here means saving the form never silently drops it.
        photoUrl: me?.photoUrl ?? null,
        photoPublicId: null,
      });
      setMe(updated);
      setNotice({ tone: "success", text: "Profile saved." });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Could not save your profile.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-7">
      <h2 className="mb-6 font-display text-xl font-bold text-ink">My details</h2>

      <form onSubmit={onSubmit} className="space-y-5">
        <AuthField label="Full name" htmlFor="p-name">
          <input id="p-name" name="name" required defaultValue={me?.name ?? ""} className={AUTH_INPUT} />
        </AuthField>

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField label="Roll number" htmlFor="p-roll">
            <input id="p-roll" name="rollNumber" defaultValue={me?.rollNumber ?? ""} className={AUTH_INPUT} />
          </AuthField>

          <AuthField label="Year of study" htmlFor="p-year">
            <select id="p-year" name="year" defaultValue={me?.year ?? ""} className={AUTH_INPUT}>
              <option value="">Not set</option>
              <option value="1">First year</option>
              <option value="2">Second year</option>
              <option value="3">Third year</option>
              <option value="4">Final year</option>
            </select>
          </AuthField>
        </div>

        <AuthField label="Email address" htmlFor="p-email" hint="Your sign-in address cannot be changed here.">
          <input id="p-email" value={me?.email ?? ""} readOnly disabled className={`${AUTH_INPUT} bg-card2`} />
        </AuthField>

        {notice ? (
          <p
            role="status"
            className={`rounded-md border px-3.5 py-2.5 text-sm ${
              notice.tone === "success"
                ? "border-emerald/25 bg-emerald-soft text-emerald"
                : "border-rose/25 bg-rose-soft text-rose"
            }`}
          >
            {notice.text}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>

          {/*
            Changing a password is a password RESET by email, not a form here. Firebase
            requires a recent sign-in to change one directly, so an in-page form would fail
            for anyone whose session is more than a few minutes old — with an error they
            could do nothing about. The emailed link always works.
          */}
          <button
            type="button"
            disabled={busy || !me?.email}
            onClick={async () => {
              if (!me?.email) return;
              setBusy(true);
              setNotice(null);
              try {
                await sendReset(me.email);
                setNotice({ tone: "success", text: `Password reset link sent to ${me.email}.` });
              } catch {
                setNotice({ tone: "error", text: "Could not send the reset email. Try again." });
              } finally {
                setBusy(false);
              }
            }}
            className="text-sm font-semibold text-sky hover:underline disabled:opacity-50"
          >
            Change my password
          </button>
        </div>
      </form>
    </section>
  );
}
