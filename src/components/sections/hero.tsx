"use client";

import { NeuronCanvas } from "@/components/core/neuron-canvas";
import { events as eventsApi, stats as statsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useSettings } from "@/lib/settings-context";
import { SITE } from "@/lib/site";

/**
 * The landing section.
 *
 * <p>Still factual — the headline is the association's own name, not a slogan, and the
 * paragraph is its own description pulled from settings so the committee can edit it.
 * What changed is the staging: a flat navy block with type on it read as a placeholder.
 *
 * <p>Three things give it depth, and each is doing a job rather than decorating:
 * a navy gradient with an off-centre light source, so a very wide block is not one dead
 * colour; a faint dot grid, so the empty right-hand space has texture where there is no
 * photograph to put there; and a "next event" card lifted onto a real shadow and pulled
 * down over the section edge, which is what gives the whole band a foreground and a
 * background instead of one plane.
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
      {/* `relative` + `isolate`: the dot-grid ::before is absolutely positioned and must
          not escape, and the lifted card below needs a stacking context to sit above it. */}
      <div className="band-deep relative isolate overflow-hidden text-white">
        {/*
          The original's neuron field, restored. It is the most recognisable thing about
          this design, and it is the reason the hero does not need a photograph.

          Order matters: the grid sits under the particles, both sit under the content.
          NeuronCanvas renders one static frame under prefers-reduced-motion rather than
          nothing, so the hero is never a flat void for anyone who turns motion off.
        */}
        <div aria-hidden className="bg-grid absolute inset-0" />
        <NeuronCanvas density={90} />
        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-14 pb-28 sm:px-6 sm:pt-20 sm:pb-32">
          <div className="grid items-start gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div className="relative">
              <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-sky uppercase">
                <span aria-hidden className="h-px w-8 bg-sky/60" />
                {SITE.department}
              </p>

              {/* The page's only h1. */}
              <h1 className="mt-5 font-display text-4xl leading-[1.08] font-bold text-white text-balance sm:text-5xl lg:text-[3.5rem]">
                {SITE.longName}
              </h1>

              <p className="mt-4 max-w-xl text-[0.95rem] text-white/60">
                {SITE.institute}, {SITE.city}
              </p>

              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/85">
                {settings?.aboutDescription ??
                  `${SITE.name} is the student association of the Department of CSE (AI & ML). ` +
                    "We run the workshops, hackathons, seminars and outreach programmes of the department."}
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#events"
                  className="rounded-md bg-sky px-6 py-3 text-sm font-bold text-bg shadow-lift transition-all hover:-translate-y-0.5 hover:bg-sky3"
                >
                  Upcoming events
                </a>
                {/*
                  "Explore committees", not "Create an account".
                  
                  Nothing a visitor comes here to do needs an account: the committees are
                  public and applying to one is a Google Form. Leading with a signup asked
                  for a commitment before showing any reason to make it.
                */}
                <a
                  href="#structure"
                  className="rounded-md border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  Explore committees
                </a>
              </div>
            </div>

            {/*
              The next event, promoted out of the Events section. "Is anything happening?"
              is the first question a visitor has, and a notice panel is how a college site
              answers it. Rendered only when there is one, so it never becomes an empty box.
            */}
            {nextEvent ? (
              <aside className="relative rounded-lg border border-white/15 bg-white/[0.07] p-7 shadow-float backdrop-blur-sm">
                <span
                  aria-hidden
                  className="absolute -top-px left-7 h-0.5 w-14 bg-sky"
                />
                <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-sky uppercase">
                  Next event
                </p>
                <h2 className="mt-4 font-display text-xl leading-snug font-bold text-white">
                  {nextEvent.title}
                </h2>
                <p className="mt-2 text-sm font-medium text-white/75">{nextEvent.dateLabel}</p>
                {nextEvent.description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/65">
                    {nextEvent.description}
                  </p>
                ) : null}
                <a
                  href="#events"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-sky hover:gap-2.5"
                >
                  All events
                  <span aria-hidden className="transition-all">&rarr;</span>
                </a>
              </aside>
            ) : null}
          </div>
        </div>
      </div>

      {/*
        The counters, pulled UP over the navy band so the card overlaps both sections.
        The overlap is the point: it stitches the two bands together and stops the page
        reading as a stack of unrelated full-width strips.
      */}
      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-card shadow-lift sm:grid-cols-4">
          {counters.map((counter, index) => (
            <div
              key={counter.label}
              className={`px-4 py-7 text-center ${
                index > 0 ? "border-s border-line" : ""
              } ${index === 2 ? "border-s-0 sm:border-s" : ""} ${
                index >= 2 ? "border-t border-line sm:border-t-0" : ""
              }`}
            >
              <dd className="font-display text-3xl font-bold text-sky2 tabular-nums sm:text-4xl">
                {/* An em dash while loading, not 0. A real zero and "not known yet" are
                    different facts, and showing 0 first makes every counter jump. */}
                {counter.value ?? "—"}
              </dd>
              <dt className="mt-2 text-[0.7rem] font-semibold tracking-[0.1em] text-muted uppercase">
                {counter.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
