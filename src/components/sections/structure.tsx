"use client";

import { useMemo, useState } from "react";
import { ErrorNotice } from "@/components/ui/interactive";
import { Avatar, Badge, EmptyState, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { committees as committeesApi, members as membersApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useReveal } from "@/lib/hooks/use-reveal";
import type { Committee, CommitteeType, Member } from "@/types/api";

/**
 * The association's structure: advisory, executive, then the functional committees.
 *
 * <h2>Why the cards are colour-coded</h2>
 *
 * <p>Thirteen committees in one grid, each a white rectangle with a title, is a wall of
 * identical boxes — the eye has nothing to navigate by and the section reads as a list
 * that happens to be laid out in columns. A coloured top bar per card gives each one an
 * identity and makes the grid scannable.
 *
 * <p>The colour is DERIVED from the committee id rather than stored. Storing it would mean
 * an admin picking a colour for every new committee, and the one who forgets leaves a
 * blank card; deriving it means the palette is automatic, stable for a given committee
 * across reloads, and impossible to leave unset.
 */

/**
 * The bar across the top of each committee card.
 *
 * <p>It comes from {@code committee.gradient} — a per-record value the admin authors, and
 * one of the two documented places in this codebase where an inline style is correct,
 * because a value that arrives from the database cannot be a Tailwind class.
 *
 * <p>An earlier version derived the colour from a hash of the committee id instead. That
 * was wrong twice over: it ignored data the API was already returning, and the palette it
 * cycled through included `rose` and `emerald` — the STATUS colours. A "Vice President"
 * card with a red bar reads as an error, not as an identity.
 *
 * <p>The fallback is the brand accent, never a status colour, for the same reason.
 */
function barStyle(gradient: string | null): React.CSSProperties {
  return { background: gradient ?? "linear-gradient(135deg,#0ea5e9,#22d3ee)" };
}

const GROUPS: { type: CommitteeType; label: string; blurb: string }[] = [
  {
    type: "advisory",
    label: "Faculty advisory",
    blurb: "The faculty who oversee the association and guide its academic activities.",
  },
  {
    type: "executive",
    label: "Executive body",
    blurb: "The elected office-bearers responsible for running the association day to day.",
  },
  {
    type: "functional",
    label: "Functional committees",
    blurb:
      "Each committee owns one area of the association's work — from technical events to " +
      "documentation, sponsorship and outreach.",
  },
];

export function Structure() {
  const committees = useApi(() => committeesApi.list(), []);
  const members = useApi(() => membersApi.list(), []);
  const reveal = useReveal<HTMLDivElement>();

  // Grouped once per data change rather than on every render — thirteen committees is
  // small, but the members lookup below is O(committees x members) without it.
  const byCommittee = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const member of members.data ?? []) {
      if (!member.committeeId) continue;
      const list = map.get(member.committeeId) ?? [];
      list.push(member);
      map.set(member.committeeId, list);
    }
    return map;
  }, [members.data]);

  const grouped = useMemo(() => {
    const all = committees.data ?? [];
    return GROUPS.map((group) => ({
      ...group,
      items: all.filter((c) => c.type === group.type).sort((a, b) => a.order - b.order),
    })).filter((group) => group.items.length > 0);
  }, [committees.data]);

  return (
    <section id="structure" className="border-t border-line bg-bg2 py-20 sm:py-24">
      <div ref={reveal} className="reveal mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Organisation"
          title="How the association is organised"
          description="AISA runs through a faculty advisory board, an elected executive body, and functional committees that each own one area of the association's work."
        />

        {committees.loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-56" />
            ))}
          </div>
        ) : committees.error ? (
          <ErrorNotice error={committees.error} onRetry={committees.reload} />
        ) : grouped.length === 0 ? (
          <EmptyState
            title="No committees listed yet"
            hint="Committees added from the dashboard appear here."
          />
        ) : (
          <div className="space-y-16">
            {grouped.map((group) => (
              <div key={group.type}>
                <div className="mb-7 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line2 pb-3">
                  <h3 className="font-display text-xl font-bold text-ink sm:text-2xl">
                    {group.label}
                  </h3>
                  <p className="max-w-xl text-sm text-muted">{group.blurb}</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((committee) => (
                    <CommitteeCard
                      key={committee.id}
                      committee={committee}
                      members={byCommittee.get(committee.id) ?? []}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CommitteeCard({ committee, members }: { committee: Committee; members: Member[] }) {
  const [open, setOpen] = useState(false);
  const responsibilities = committee.responsibilities ?? [];
  const shown = open ? responsibilities : responsibilities.slice(0, 3);

  // The coordinator is a committee field; the members are separate records. Both are
  // people on this committee, so both belong on the card.
  const people = [
    ...(committee.coordinator
      ? [{ name: committee.coordinator, role: committee.coordLabel ?? "Coordinator", photo: committee.coordinatorPhoto }]
      : []),
    ...(committee.coordinator2
      ? [{ name: committee.coordinator2, role: committee.coord2Label ?? "Coordinator", photo: committee.coordinator2Photo }]
      : []),
    ...members.map((m) => ({ name: m.name, role: m.role, photo: m.photoUrl })),
  ];

  return (
    <article
      id={`committee-${committee.id}`}
      className="card card-hover relative flex scroll-mt-32 flex-col overflow-hidden p-6"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={barStyle(committee.gradient)}
      />
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-display text-lg leading-snug font-bold text-ink">{committee.name}</h4>
        {committee.badge ? <Badge tone="muted">{committee.badge}</Badge> : null}
      </div>

      {committee.sizeLabel ? (
        <p className="mt-1.5 text-xs font-medium text-muted">{committee.sizeLabel}</p>
      ) : null}

      {/*
        The people, named on the card rather than hidden behind a click.
        "Who do I talk to" is the question this section exists to answer, and an
        expandable panel answers it only for someone who already knows to expand.
      */}
      {people.length > 0 ? (
        <ul className="mt-5 space-y-3 border-t border-line pt-4">
          {people.slice(0, 3).map((person, index) => (
            <li key={`${person.name}-${index}`} className="flex items-center gap-3">
              <Avatar src={person.photo} name={person.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {person.name}
                </span>
                <span className="block truncate text-xs text-muted">{person.role}</span>
              </span>
            </li>
          ))}
          {people.length > 3 ? (
            <li className="ps-12 text-xs font-medium text-muted">
              and {people.length - 3} more
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-5 border-t border-line pt-4 text-xs text-muted italic">
          No members listed yet.
        </p>
      )}

      {responsibilities.length > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2.5 text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase">
            Responsibilities
          </p>
          <ul className="space-y-1.5">
            {shown.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-body">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky" />
                {item}
              </li>
            ))}
          </ul>
          {responsibilities.length > 3 ? (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="mt-3 text-xs font-semibold text-sky hover:underline"
            >
              {open ? "Show less" : `Show all ${responsibilities.length}`}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
