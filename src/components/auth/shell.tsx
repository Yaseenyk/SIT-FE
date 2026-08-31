"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";

/**
 * The frame every account screen sits in.
 *
 * <p>A split page: the association's identity on the navy side, the form on the paper
 * side. A bare centred card on an empty page is the default shape of a generated auth
 * screen and tells the person nothing about where they are — which matters most here,
 * because a sign-in page is often the first thing a student sees after following a link
 * from somewhere else.
 *
 * <p>The left panel is hidden below `lg`. On a phone it would push the form below the
 * fold, and the form is the only thing anyone came for.
 */
export function AuthShell({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="band-deep pattern-dots relative isolate hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-white/10 font-display text-[0.7rem] leading-none font-bold text-white ring-1 ring-white/20"
          >
            AISA
          </span>
          <span className="font-display text-lg font-bold">{SITE.longName}</span>
        </Link>

        <div className="max-w-md">
          <p className="text-xs font-semibold tracking-[0.18em] text-sky uppercase">
            {SITE.department}
          </p>
          <p className="mt-5 font-display text-3xl leading-tight font-bold text-balance">
            One account for events, committees and your profile.
          </p>
          <ul className="mt-8 space-y-3.5 text-sm text-white/75">
            {[
              "Register for workshops and hackathons in one click",
              "Apply to the committee whose work you want to join",
              "Keep your year, roll number and photo up to date",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-sky" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/45">
          {SITE.institute}, {SITE.city}
        </p>
      </aside>

      <div className="flex flex-col justify-center bg-bg px-4 py-14 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          {/* The wordmark repeats here because the panel beside it is hidden on mobile,
              where this becomes the only thing identifying the site. */}
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2.5 font-display text-lg font-bold text-sky2 lg:hidden"
          >
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-sm bg-sky2 text-[0.6rem] leading-none font-bold text-white"
            >
              AISA
            </span>
            {SITE.name}
          </Link>

          <h1 className="font-display text-3xl leading-tight font-bold text-ink">{title}</h1>
          {intro ? <p className="mt-3 text-sm leading-relaxed text-muted">{intro}</p> : null}

          <div className="mt-8">{children}</div>

          {footer ? <div className="mt-8 text-sm text-muted">{footer}</div> : null}

          <p className="mt-10 text-sm">
            <Link href="/" className="text-muted hover:text-sky">
              ← Back to the site
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

/** The shared field wrapper for every account form. */
export function AuthField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export const AUTH_INPUT =
  "w-full rounded-md border border-line2 bg-card px-3.5 py-2.5 text-sm text-ink " +
  "placeholder:text-muted/70 focus:border-sky focus:outline-none";

/** A form-level message. `role="alert"` so a screen reader announces the failure. */
export function AuthNotice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const tones = {
    error: "border-rose/25 bg-rose-soft text-rose",
    success: "border-emerald/25 bg-emerald-soft text-emerald",
  } as const;
  return (
    <p role="alert" className={`rounded-md border px-3.5 py-2.5 text-sm ${tones[tone]}`}>
      {children}
    </p>
  );
}
