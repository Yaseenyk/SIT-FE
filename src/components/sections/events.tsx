"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, DateBlock, EmptyState, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { ErrorNotice, FilterTabs } from "@/components/ui/interactive";
import {
  events as eventsApi,
  registrations as registrationsApi,
} from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/context";
import { useApi } from "@/lib/hooks/use-api";
import { useReveal } from "@/lib/hooks/use-reveal";
import type { AisaEvent, EventStatus } from "@/types/api";

const TABS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past events" },
] as const;

/**
 * Events, as a dated list with a working register button.
 *
 * <p>The emoji that used to head every row are gone. A page whose section icons are 🧠 ⚡ 🎤
 * reads as generated, because that is how generated pages illustrate themselves; a date
 * block does the same job — telling you where a row starts — while carrying the
 * information a visitor actually came for.
 *
 * <p>Registering used to be an external link to whatever form the organiser had made.
 * It is now an account action, so the association gets one attendance list per event
 * instead of a Google Form nobody can find next year.
 */
export function Events() {
  const [tab, setTab] = useState<EventStatus>("upcoming");
  const reveal = useReveal<HTMLDivElement>();
  const { state } = useAuth();

  /*
   * Refetched per tab rather than fetched once and split locally. Unlike the Structure
   * filters, this is a genuinely different query — the server decides what counts as past
   * against its own clock — and it keeps the payload to the list actually on screen.
   */
  const { data, error, loading, reload } = useApi(() => eventsApi.list(tab), [tab]);
  const events = data ?? [];

  // Only fetched when signed in, so a visitor makes no authenticated request at all.
  const mine = useApi(
    () => (state === "active" ? registrationsApi.mine() : Promise.resolve([])),
    [state],
  );
  const registeredIds = useMemo(
    () => new Set((mine.data ?? []).map((r) => r.eventId)),
    [mine.data],
  );

  return (
    <section id="events" className="border-t border-line py-20 sm:py-24">
      <div ref={reveal} className="reveal mx-auto max-w-6xl px-4 sm:px-6">
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
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28" />
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
          <ul className="grid gap-5 lg:grid-cols-2">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                past={tab === "past"}
                registered={registeredIds.has(event.id)}
                onChanged={mine.reload}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/**
 * One event, as a card rather than a row in a list.
 *
 * <p>Rows were the right call when the section was a bare index; with a banner image, a
 * description and an action they were a cramped line of text with a button hanging off the
 * end. Two columns of cards gives the banner somewhere to go — and the banner is what will
 * make this section look alive once the committee starts uploading them.
 */
function EventCard({
  event,
  past,
  registered,
  onChanged,
}: {
  event: AisaEvent;
  past: boolean;
  registered: boolean;
  onChanged: () => void;
}) {
  const link = event.linkUrl && event.linkUrl !== "#" ? event.linkUrl : null;

  return (
    <li className="card card-hover flex flex-col overflow-hidden">
      {event.bannerUrl ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={event.bannerUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
          {past ? <div className="absolute inset-0 bg-bg/35" /> : null}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 p-6 sm:flex-row sm:gap-5">
        <DateBlock iso={event.startsOn} className={past ? "opacity-60" : undefined} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-lg leading-snug font-bold text-ink">{event.title}</h3>
            {event.tag ? <Badge tone={past ? "muted" : "green"}>{event.tag}</Badge> : null}
          </div>

          <p className="mt-1.5 text-xs font-semibold text-muted">{event.dateLabel}</p>

          {event.description ? (
            // Clamped, not truncated mid-word: three lines is enough to decide whether the
            // event is worth reading about.
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-body">
              {event.description}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
            {past ? null : (
              <RegisterButton event={event} registered={registered} onChanged={onChanged} />
            )}
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-sky hover:underline"
              >
                {past ? "Read more" : "Details"} ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The action, in whichever of its four states applies.
 *
 * <p>A signed-out visitor gets a link to sign in rather than a button that fails: the
 * server would reject them, and a button whose only outcome is an error message is worse
 * than one that says what it needs. The unverified and unregistered cases are handled by
 * the account screens, which is why this only has to distinguish "active" from "not".
 */
function RegisterButton({
  event,
  registered,
  onChanged,
}: {
  event: AisaEvent;
  registered: boolean;
  onChanged: () => void;
}) {
  const { state } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state === "loading") {
    return <Skeleton className="h-9 w-28" />;
  }

  if (state !== "active") {
    return (
      <Link
        href={state === "signed-out" ? "/login/" : "/account/"}
        className="rounded-md border border-line2 px-4 py-2 text-sm font-semibold text-sky transition-colors hover:bg-sky-tint"
      >
        Sign in to register
      </Link>
    );
  }

  if (registered) {
    return (
      <span className="flex flex-wrap items-center gap-3">
        <Badge tone="green">You are registered</Badge>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await registrationsApi.cancel(event.id);
              onChanged();
            } catch {
              setError("Could not cancel. Try again.");
            } finally {
              setBusy(false);
            }
          }}
          className="text-xs font-semibold text-muted hover:text-rose disabled:opacity-50"
        >
          {busy ? "Cancelling…" : "Cancel"}
        </button>
        {error ? <span className="text-xs text-rose">{error}</span> : null}
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await registrationsApi.register(event.id);
            onChanged();
          } catch (registerError) {
            setError(
              registerError instanceof Error ? registerError.message : "Could not register.",
            );
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-md bg-sky2 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky disabled:opacity-50"
      >
        {busy ? "Registering…" : "Register"}
      </button>
      {error ? <span className="text-xs text-rose">{error}</span> : null}
    </span>
  );
}
