"use client";

import { useState } from "react";
import { Badge, DateBlock, EmptyState, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { ErrorNotice, FilterTabs } from "@/components/ui/interactive";
import { events as eventsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { AisaEvent, EventStatus } from "@/types/api";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past events" },
] as const;

/**
 * Events, as a dated list.
 *
 * The emoji that used to head every row are gone. A page whose section icons are 🧠 ⚡ 🎤
 * reads as generated, because that is how generated pages illustrate themselves; a date
 * block does the same job — telling you where a row starts — while also carrying the
 * information a visitor actually came for.
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

  return (
    <section id="events" className="border-b border-rule py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Activities"
          title="Events and workshops"
          description="Hackathons, bootcamps, guest lectures and competitions organised by the association through the academic year."
        />

        <FilterTabs
          label="Filter events"
          options={TABS}
          value={tab}
          onChange={setTab}
          className="mb-8"
        />

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : error ? (
          <ErrorNotice error={error} onRetry={reload} />
        ) : events.length === 0 ? (
          <EmptyState
            title={tab === "upcoming" ? "No events currently scheduled" : "No past events recorded"}
            hint={
              tab === "upcoming"
                ? "New sessions are announced here first. Check back at the start of term."
                : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-rule border-y border-rule">
            {events.map((event) => (
              <EventRow key={event.id} event={event} past={tab === "past"} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function EventRow({ event, past }: { event: AisaEvent; past: boolean }) {
  const link = event.linkUrl && event.linkUrl !== "#" ? event.linkUrl : null;

  return (
    <li className="flex items-start gap-5 py-5 transition-colors hover:bg-surface">
      <DateBlock iso={event.startsOn} className={past ? "opacity-60" : undefined} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-serif text-base font-bold text-ink">{event.title}</h3>
          {event.tag ? <Badge tone={past ? "muted" : "green"}>{event.tag}</Badge> : null}
        </div>

        <p className="mt-1 text-xs font-medium text-muted">{event.dateLabel}</p>

        {event.description ? (
          // Clamped, not truncated mid-word: two lines is enough to decide whether the
          // event is worth reading about.
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-body">
            {event.description}
          </p>
        ) : null}
      </div>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden shrink-0 self-center rounded border border-rule-strong px-3.5 py-1.5 text-xs font-semibold text-navy2 transition-colors hover:bg-navy-tint sm:block"
        >
          {past ? "Read more" : "Register"}
        </a>
      ) : null}
    </li>
  );
}
