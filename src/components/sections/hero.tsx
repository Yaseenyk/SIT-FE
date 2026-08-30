"use client";

import { NeuronCanvas } from "@/components/core/neuron-canvas";
import { events as eventsApi, stats as statsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { SITE } from "@/lib/site";

/**
 * The landing section.
 *
 * Left-aligned rather than centred. Centred text with nothing either side of it left the
 * hero reading as a title card floating in a void — the single biggest reason the first
 * version looked unfinished. An asymmetric layout gives the eye somewhere to start and
 * lets the next event sit beside the headline instead of below the fold.
 *
 * The counters come from `/stats`, one request returning six numbers. The original page
 * downloaded every member, event, gallery and achievement record and called `.length` on
 * each array — several hundred kilobytes to display four small numbers.
 */
export function Hero() {
  const { data: stats } = useApi(() => statsApi.get(), []);
  const { data: upcoming } = useApi(() => eventsApi.list("upcoming"), []);
  const nextEvent = upcoming?.[0] ?? null;

  const counters = [
    { label: "Committees", value: stats?.committees },
    { label: "Members", value: stats?.members },
    { label: "Events held", value: stats?.events },
    { label: "Achievements", value: stats?.achievements },
  ];

  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden pt-nav">
      {/* Three stacked layers: grid floor, particle field, then a wash that keeps the
          text legible over both. Order matters — the wash must sit above the canvas. */}
      <div aria-hidden className="bg-grid absolute inset-0" />
      <NeuronCanvas density={90} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 8% 45%, rgb(34 211 238 / 0.16) 0%, transparent 68%)," +
            "radial-gradient(ellipse 55% 55% at 92% 12%, rgb(168 85 247 / 0.15) 0%, transparent 66%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line2 bg-card/60 px-3.5 py-1.5 font-mono text-[0.65rem] tracking-[0.18em] text-sky uppercase backdrop-blur">
              {/* A live dot: the association is active, and the page should say so before
                  it says anything else. */}
              <span aria-hidden className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald" />
              </span>
              {SITE.department}
            </p>

            {/*
              The headline is a claim, not the acronym.
              "AISA" set at 8xl told a first-time visitor nothing they could act on — the
              organisation's name is already in the navbar, the tab title and the footer.
              A sentence earns the space; the name is demoted to the line beneath it.
            */}
            {/* text-balance evens the lines, but it can only work inside a box wide enough
                to have a choice — at max-w-2xl this headline was forced to strand a single
                word on its own line. */}
            <h1 className="max-w-3xl font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-[3.4rem]">
              Where AIML students{" "}
              <span className="text-gradient">build things that run</span>.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
              AISA is the student association of the Department of CSE (AI &amp; ML) at
              BSIET Kolhapur. We run the workshops, hackathons and reading groups that turn
              a syllabus into something you can build with.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#events"
                className="rounded-xl bg-sky2 px-6 py-3.5 text-sm font-bold tracking-wide text-bg shadow-lg shadow-sky2/25 transition-all hover:-translate-y-0.5 hover:bg-sky"
              >
                See what&rsquo;s on
              </a>
              <a
                href="#structure"
                className="rounded-xl border border-line2 bg-card/50 px-6 py-3.5 text-sm font-bold tracking-wide text-sky backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-sky/10"
              >
                Meet the team
              </a>
            </div>
          </div>

          {/*
            The next event, promoted out of the Events section.
            A visitor's first question is "is anything happening?" — answering it in the
            hero is worth more than the decorative panel that would otherwise sit here.
            Rendered only when there is one, so it never becomes an empty box.
          */}
          {nextEvent ? (
            <a
              href="#events"
              className="card-surface group block p-7 transition-all duration-300 hover:-translate-y-1 hover:border-line2 hover:glow-sky"
            >
              <p className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-emerald uppercase">
                <span aria-hidden className="size-1.5 rounded-full bg-emerald" />
                Next up
              </p>

              <p className="mt-5 text-4xl" aria-hidden>
                {nextEvent.emoji ?? "📌"}
              </p>

              <h2 className="mt-4 font-display text-xl leading-snug font-bold tracking-tight text-balance">
                {nextEvent.title}
              </h2>

              <p className="mt-3 font-mono text-xs text-sky">{nextEvent.dateLabel}</p>

              {nextEvent.description ? (
                <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-muted">
                  {nextEvent.description}
                </p>
              ) : null}

              <p className="mt-6 text-xs font-bold text-sky transition-transform group-hover:translate-x-1">
                All events &rarr;
              </p>
            </a>
          ) : null}
        </div>

        {/*
          Counters as one bordered strip rather than four separate boxes. Four small cards
          in a row compete with the hero for attention; a single strip reads as a footnote to it,
          which is what these numbers are.
        */}
        <dl className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {counters.map((counter) => (
            <div key={counter.label} className="bg-bg2/80 px-5 py-6 backdrop-blur">
              <dd className="font-display text-3xl font-black text-sky tabular-nums">
                {/* An em dash while loading, not 0. A real zero and "not known yet" are
                    different facts, and showing 0 first makes every counter jump. */}
                {counter.value ?? "—"}
              </dd>
              <dt className="mt-1.5 font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase">
                {counter.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
