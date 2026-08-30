"use client";

import { useState } from "react";
import { Avatar, Badge, EmptyState, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { ErrorNotice, FilterTabs, Modal } from "@/components/ui/interactive";
import { committees as committeesApi, members as membersApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { Committee, Member } from "@/types/api";

type Filter = "all" | "executive" | "functional";

const FILTERS = [
  { value: "all", label: "All committees" },
  { value: "executive", label: "Executive" },
  { value: "functional", label: "Functional" },
] as const;

/**
 * The association structure: committees, their responsibilities, and their members.
 *
 * Committees and members are fetched once each and joined in the browser. Filtering is
 * then local — refetching on every tab click would put a network round trip behind a
 * control that should feel instant.
 */
export function Structure() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Committee | null>(null);

  const committees = useApi(() => committeesApi.list(), []);
  const members = useApi(() => membersApi.list(), []);

  // The advisory committee is shown in About instead, where the faculty belong.
  const visible = (committees.data ?? [])
    .filter((c) => c.type !== "advisory")
    .filter((c) => filter === "all" || c.type === filter);

  const membersByCommittee = new Map<string, Member[]>();
  for (const member of members.data ?? []) {
    if (!member.committeeId) continue;
    const list = membersByCommittee.get(member.committeeId) ?? [];
    list.push(member);
    membersByCommittee.set(member.committeeId, list);
  }

  return (
    <section id="structure" className="border-b border-rule bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Organisation"
          title="Association structure"
          description="The executive office-bearers and the functional committees that run the association's events, research and outreach activities."
        />

        <FilterTabs
          label="Filter committees"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          className="mb-8"
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {committees.loading ? (
            [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-56" />)
          ) : committees.error ? (
            <ErrorNotice error={committees.error} onRetry={committees.reload} />
          ) : visible.length === 0 ? (
            <EmptyState title="No committees listed" />
          ) : (
            visible.map((committee) => {
              const committeeMembers = membersByCommittee.get(committee.id) ?? [];
              return (
                <article
                  key={committee.id}
                  id={`committee-${committee.id}`}
                  className="card card-hover flex scroll-mt-32 flex-col p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-base leading-snug font-bold text-ink text-balance">
                      {committee.name}
                    </h3>
                    {committee.badge ? (
                      <Badge tone={committee.type === "executive" ? "gold" : "navy"}>
                        {committee.badge}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs text-muted">{committee.sizeLabel}</p>

                  {committee.coordinator ? (
                    <p className="mt-3 border-t border-rule pt-3 text-xs text-body">
                      <span className="font-semibold text-ink">
                        {committee.coordLabel ?? "Coordinator"}:
                      </span>{" "}
                      {committee.coordinator}
                    </p>
                  ) : null}

                  {/*
                    Named members, not just overlapping avatars. On a college page the
                    people ARE the content — a visitor is looking for who holds a post,
                    and hiding the names behind a click was the wrong call.
                  */}
                  {committeeMembers.length > 0 ? (
                    <ul className="mt-3 space-y-2 border-t border-rule pt-3">
                      {committeeMembers.map((member) => (
                        <li key={member.id} className="flex items-center gap-2.5">
                          <Avatar src={member.photoUrl} name={member.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-ink">
                              {member.name}
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {member.role}
                              {member.academicYear ? ` · ${member.academicYear}` : null}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 border-t border-rule pt-3 text-xs text-muted">
                      Positions open — contact the association to apply.
                    </p>
                  )}

                  <button
                    onClick={() => setSelected(committee)}
                    className="mt-auto pt-4 text-start text-xs font-semibold text-navy2 hover:underline"
                  >
                    View {committee.responsibilities.length} responsibilities &rarr;
                  </button>
                </article>
              );
            })
          )}
        </div>
      </div>

      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.name ?? ""}>
        {selected ? (
          <>
            {selected.coordinator ? (
              <p className="mb-5 rounded border border-rule bg-surface px-4 py-3 text-sm text-body">
                <span className="font-semibold text-ink">
                  {selected.coordLabel ?? "Coordinator"}:
                </span>{" "}
                {selected.coordinator}
                {selected.coordinatorSub ? ` — ${selected.coordinatorSub}` : null}
              </p>
            ) : null}

            <h4 className="mb-3 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
              Responsibilities
            </h4>
            <ol className="space-y-2.5">
              {selected.responsibilities.map((responsibility, index) => (
                <li key={responsibility} className="flex gap-3 text-sm leading-relaxed text-body">
                  <span className="shrink-0 font-semibold text-gold tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{responsibility}</span>
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </Modal>
    </section>
  );
}
