"use client";

import { useMemo } from "react";
import { committees as committeesApi, members as membersApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useReveal } from "@/lib/hooks/use-reveal";
import { SITE } from "@/lib/site";

/**
 * How a student joins, and which posts are currently open.
 *
 * <h2>Why this is a Google Form and not an in-app application</h2>
 *
 * <p>It used to be a form tied to an account: sign up, confirm an email address, then
 * apply. That put a signup wall in front of the one action the association most wants a
 * student to take, and it is the wrong trade — an account is worth asking for to register
 * for an event, where an organiser needs to reach a named person on the day, and not worth
 * asking for to express interest in joining.
 *
 * <p>Accounts are untouched; joining simply no longer needs one.
 *
 * <p>The open-position list is still derived from real data — committees that no member is
 * currently assigned to — rather than a static list someone has to remember to update, so
 * it stays correct the moment the roster changes.
 */
export function Join() {
  const committees = useApi(() => committeesApi.list(), []);
  const members = useApi(() => membersApi.list(), []);
  const reveal = useReveal<HTMLDivElement>();

  const open = useMemo(() => {
    const filled = new Set(
      (members.data ?? []).map((m) => m.committeeId).filter(Boolean) as string[],
    );
    return (committees.data ?? [])
      .filter((c) => c.type !== "advisory" && !filled.has(c.id))
      .sort((a, b) => a.order - b.order);
  }, [committees.data, members.data]);

  return (
    <section
      id="join"
      className="band-deep pattern-dots relative isolate overflow-hidden py-20 text-white sm:py-24"
    >
      <div ref={reveal} className="reveal mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-sky uppercase">
              Membership
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight font-bold text-white sm:text-4xl">
              Join the association
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80">
              Membership is open to every student of the Department of CSE (AI&nbsp;&amp;&nbsp;ML).
              Committee positions are filled at the start of each academic year, and students
              from all years are welcome to volunteer for events, workshops and outreach at
              any time.
            </p>

            <ol className="mt-9 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Fill in the form",
                  body: "A few minutes, and no account needed.",
                },
                {
                  step: "02",
                  title: "Pick a committee",
                  body: "Choose the one whose work matches your interests.",
                },
                {
                  step: "03",
                  title: "Start contributing",
                  body: "An office-bearer reviews it and gets in touch.",
                },
              ].map((item) => (
                <li key={item.step} className="border-t-2 border-sky pt-4">
                  <span className="font-mono text-xs font-semibold text-sky tabular-nums">
                    {item.step}
                  </span>
                  <h3 className="mt-2 font-display text-base font-bold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">{item.body}</p>
                </li>
              ))}
            </ol>

            {/*
              Only rendered when something is actually open. An "open positions" panel that
              says "none" reads as neglect rather than as a full roster.
            */}
            {open.length > 0 ? (
              <div className="mt-10 rounded-lg border border-white/15 bg-white/[0.06] p-6">
                <h3 className="font-display text-base font-bold text-white">
                  Committees with no member listed
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {open.map((committee) => (
                    <li
                      key={committee.id}
                      className="rounded border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85"
                    >
                      {committee.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* ── The application ───────────────────────────────────────────── */}
          <aside className="self-start rounded-lg border border-white/15 bg-white/[0.07] p-7 shadow-float backdrop-blur-sm">
            <h3 className="font-display text-xl font-bold text-white">Apply to a committee</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Applications are collected through a short Google Form. You do not need an
              account on this site to apply — fill it in and an office-bearer will get back
              to you.
            </p>

            <a
              href={SITE.joinFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky px-5 py-3 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:bg-sky3"
            >
              Open the application form
              <span aria-hidden>↗</span>
            </a>

            <p className="mt-4 text-xs leading-relaxed text-white/55">
              The form opens in a new tab. Have your roll number and year to hand.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
