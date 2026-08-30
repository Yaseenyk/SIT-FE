"use client";

import { committees as committeesApi, members as membersApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useSettings } from "@/lib/settings-context";

/**
 * How a student joins, and which posts are currently open.
 *
 * Added because the site answered every question except the one a student visiting it
 * actually has. The open-position list is derived from real data — committees that no
 * member is currently assigned to — rather than being a static list someone has to
 * remember to update, so it is correct the moment the roster changes.
 */
export function Join() {
  const { settings } = useSettings();
  const committees = useApi(() => committeesApi.list(), []);
  const members = useApi(() => membersApi.list(), []);

  const filled = new Set((members.data ?? []).map((m) => m.committeeId).filter(Boolean));
  const open = (committees.data ?? [])
    .filter((c) => c.type !== "advisory" && !filled.has(c.id))
    .sort((a, b) => a.order - b.order);

  return (
    <section id="join" className="border-b border-rule bg-navy py-14 text-white sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
              Membership
            </p>
            <h2 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
              Join the association
            </h2>
            <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-white/85">
              Membership is open to every student of the Department of CSE (AI &amp; ML).
              Committee positions are filled at the start of each academic year, and students
              from all years are welcome to volunteer for events, workshops and outreach
              activities at any time.
            </p>

            <ol className="mt-7 grid gap-5 sm:grid-cols-3">
              {[
                { step: "01", title: "Get in touch", body: "Write to the association or speak to any office-bearer." },
                { step: "02", title: "Pick a committee", body: "Choose the committee whose work matches your interests." },
                { step: "03", title: "Start contributing", body: "Volunteer on the next event or research activity." },
              ].map((item) => (
                <li key={item.step} className="border-t-2 border-gold pt-3">
                  <span className="text-xs font-semibold text-gold tabular-nums">{item.step}</span>
                  <h3 className="mt-1 font-serif text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{item.body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="rounded bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gold/90"
              >
                Contact the association
              </a>
              {settings?.email ? (
                <a
                  href={`mailto:${settings.email}?subject=${encodeURIComponent("Joining AISA")}`}
                  className="rounded border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Email us
                </a>
              ) : null}
            </div>
          </div>

          {/*
            Only rendered when something is actually open. An "open positions" panel that
            says "none" is worse than no panel — it reads as neglect rather than as a full
            roster.
          */}
          {open.length > 0 ? (
            <aside className="self-start rounded border border-white/15 bg-white/[0.06] p-6">
              <h3 className="font-serif text-base font-bold text-white">
                Positions currently open
              </h3>
              <p className="mt-1 text-sm text-white/60">
                {open.length} committee{open.length === 1 ? "" : "s"} with no member listed.
              </p>
              <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
                {open.map((committee) => (
                  <li key={committee.id} className="flex items-baseline justify-between gap-3 py-2.5">
                    <a
                      href={`#committee-${committee.id}`}
                      className="text-sm font-medium text-white hover:text-gold hover:underline"
                    >
                      {committee.name}
                    </a>
                    <span className="shrink-0 text-xs text-white/50">{committee.sizeLabel}</span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
