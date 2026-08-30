"use client";

import { useState } from "react";
import { Badge, DateBlock, EmptyState, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { ErrorNotice, FilterTabs } from "@/components/ui/interactive";
import { events as eventsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { AisaEvent, EventStatus } from "@/types/api";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
] as const;

/**
 * Events, as a list rather than a card grid.
 *
 * A row per event with the date pulled out to the left is how a calendar reads, and it
 * lets each event keep a full-width line of description. The previous three-across grid
 * gave every event an identical box and truncated all of them at the same point, so
 * scanning for "when is the hackathon" meant reading all nine.
 */
export function Events() {
  const [tab, setTab] = useState<EventStatus>("upcoming");

  /*
   * Refetched per tab rather than fetched once and split locally. Unlike the Structure
   * filters, this is a genuinely different query — the server decides what counts as past
   * against its own clock — and it keeps the payload to the list actually on screen.
   */
  const { data, error, loading, reload } = useApi(() => eventsApi.list(tab), [tab]);

  const events = data ?? [];
  // The soonest upcoming event gets a larger treatment. Past events are a reverse
  // chronological archive, where promoting the most recent one implies nothing useful.
  const featured = tab === "upcoming" ? events[0] : undefined;
  const rest = featured ? events.slice(1) : events;

  return (
    <section id="events" className="edge-top relative bg-bg2 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            eyebrow="What is on"
            title="Workshops &amp;"
            accent="Events"
            description="Hackathons, bootcamps, guest lectures and competitions run by the association."
            className="mb-0"
          />
          <FilterTabs
            label="Filter events"
            options={TABS}
            value={tab}
            onChange={setTab}
            className="mb-0"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : error ? (
          <ErrorNotice error={error} onRetry={reload} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={tab === "upcoming" ? "📅" : "🗄️"}
            title={tab === "upcoming" ? "Nothing scheduled yet" : "No past events recorded"}
            hint={
              tab === "upcoming"
                ? "Check back soon — new sessions are announced here first."
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {featured ? <FeaturedEvent event={featured} /> : null}
            <ul className="space-y-3">
              {rest.map((event) => (
                <EventRow key={event.id} event={event} muted={tab === "past"} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function FeaturedEvent({ event }: { event: AisaEvent }) {
  return (
    <article className="card-surface group relative overflow-hidden p-7 sm:p-9">
      {/* A wash anchored to the corner the emoji sits in, so the featured card reads as
          lit rather than merely larger. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 80% at 100% 0%, rgb(168 85 247 / 0.14), transparent 70%)",
        }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
        <DateBlock iso={event.startsOn} className="size-20 sm:size-24" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="emerald">Next up</Badge>
            {event.tag ? <Badge tone="sky">{event.tag}</Badge> : null}
          </div>

          <h3 className="mt-4 font-display text-2xl leading-tight font-black tracking-tight text-balance sm:text-3xl">
            {event.title}
          </h3>

          <p className="mt-2 font-mono text-xs text-sky">{event.dateLabel}</p>

          {event.description ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
              {event.description}
            </p>
          ) : null}

          {/* "#" was the placeholder link in the original seed data; treat it as no link. */}
          {event.linkUrl && event.linkUrl !== "#" ? (
            <a
              href={event.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex rounded-lg bg-sky2 px-5 py-2.5 text-xs font-bold text-bg transition-colors hover:bg-sky"
            >
              Register &rarr;
            </a>
          ) : null}
        </div>

        <span aria-hidden className="hidden text-6xl opacity-90 sm:block">
          {event.emoji ?? "📌"}
        </span>
      </div>
    </article>
  );
}

function EventRow({ event, muted }: { event: AisaEvent; muted: boolean }) {
  return (
    <li className="card-surface group flex items-start gap-5 p-5 transition-all duration-300 hover:border-line2 hover:glow-sky sm:items-center">
      <DateBlock iso={event.startsOn} className={muted ? "opacity-60" : undefined} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-display text-base font-bold tracking-tight">{event.title}</h3>
          {event.tag ? <Badge tone={muted ? "muted" : "sky"}>{event.tag}</Badge> : null}
        </div>
        <p className="mt-1 font-mono text-[0.7rem] text-muted">{event.dateLabel}</p>
        {event.description ? (
          // Clamped, not truncated mid-word: two lines is enough to tell whether the
          // event is worth clicking, and the full text is in the admin panel.
          <p className="mt-2 line-clamp-2 max-w-3xl text-xs leading-relaxed text-muted">
            {event.description}
          </p>
        ) : null}
      </div>

      <span aria-hidden className="hidden shrink-0 text-2xl opacity-80 sm:block">
        {event.emoji ?? "📌"}
      </span>

      {event.linkUrl && event.linkUrl !== "#" ? (
        <a
          href={event.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden shrink-0 text-xs font-bold text-sky transition-transform group-hover:translate-x-1 sm:block"
        >
          {muted ? "Read more" : "Register"} &rarr;
        </a>
      ) : null}
    </li>
  );
}
