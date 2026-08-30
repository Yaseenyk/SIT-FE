"use client";

import { events as eventsApi, stats as statsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useSettings } from "@/lib/settings-context";
import { SITE } from "@/lib/site";

/**
 * The landing section.
 *
 * Factual, not promotional. The previous version led with "Where AIML students build
 * things that run" set in gradient display type — copy written for a product launch. A
 * department's association introduces itself by saying who it is and what it runs; the
 * headline here is the association's own name and the paragraph is its own description,
 * pulled from settings so the committee can edit it.
 *
 * The dark ground, particle canvas and glowing panels are gone. What replaces them is a
 * plain navy band, which is what an institutional page uses to mark its top.
 */
export function Hero() {
  const { settings } = useSettings();
  const { data: stats } = useApi(() => statsApi.get(), []);
  const { data: upcoming } = useApi(() => eventsApi.list("upcoming"), []);
  const nextEvent = upcoming?.[0] ?? null;

  const counters = [
    { label: "Committees", value: stats?.committees },
    { label: "Office-bearers", value: stats?.members },
    { label: "Events held", value: stats?.events },
    { label: "Achievements", value: stats?.achievements },
  ];

  return (
    <section id="home" className="scroll-mt-0">
      <div className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">
                {SITE.department}
              </p>

              {/* The page's only h1. The association's name, not a slogan. */}
              <h1 className="mt-3 font-serif text-3xl leading-tight font-bold text-white text-balance sm:text-[2.6rem]">
                {SITE.longName}
              </h1>

              <p className="mt-2 text-sm text-white/70">
                {SITE.institute}, {SITE.city}
              </p>

              <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed text-white/85">
                {settings?.aboutDescription ??
                  `${SITE.name} is the student association of the Department of CSE (AI & ML). ` +"We run the workshops, hackathons, seminars and outreach programmes of the department."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#events"
                  className="rounded bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gold/90"
                >
                  Upcoming events
                </a>
                <a
                  href="#structure"
                  className="rounded border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Association structure
                </a>
              </div>
            </div>

            {/*
              The next event, promoted out of the Events section."Is anything happening?" is the first question a visitor has, and a notice
              panel is how a college site answers it. Rendered only when there is one, so
              it never becomes an empty box.
            */}
            {nextEvent ? (
              <aside className="self-start rounded border border-white/15 bg-white/[0.06] p-6">
                <p className="flex items-center gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-gold uppercase">
                  <span aria-hidden className="size-1.5 rounded-full bg-gold" />
                  Next event
                </p>
                <h2 className="mt-3 font-serif text-lg leading-snug font-bold text-white">
                  {nextEvent.title}
                </h2>
                <p className="mt-1.5 text-sm text-white/70">{nextEvent.dateLabel}</p>
                {nextEvent.description ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/70">
                    {nextEvent.description}
                  </p>
                ) : null}
                <a
                  href="#events"
                  className="mt-4 inline-block text-sm font-semibold text-gold hover:underline"
                >
                  All events &rarr;
                </a>
              </aside>
            ) : null}
          </div>
        </div>
      </div>

      {/* The counters, as a band under the header rather than as four floating cards. */}
      <div className="border-b border-rule bg-surface">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-rule sm:grid-cols-4">
          {counters.map((counter) => (
            <div key={counter.label} className="px-4 py-5 text-center sm:px-6">
              <dd className="font-serif text-2xl font-bold text-navy tabular-nums">
                {/* An em dash while loading, not 0. A real zero and "not known yet" are
                    different facts, and showing 0 first makes every counter jump. */}
                {counter.value ?? "—"}
              </dd>
              <dt className="mt-1 text-[0.72rem] font-semibold tracking-wide text-muted uppercase">
                {counter.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
