"use client";

import { useState } from "react";
import { Avatar, Badge, EmptyState, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { ErrorNotice, FilterTabs, Modal } from "@/components/ui/interactive";
import { committees as committeesApi, members as membersApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { Committee, Member } from "@/types/api";

type Filter = "all" | "executive" | "functional";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "executive", label: "Executive" },
  { value: "functional", label: "Functional" },
] as const;

/**
 * The association structure: committees, their responsibilities, and their members.
 *
 * Committees and members are fetched once each and joined in the browser. Filtering is
 * then local — refetching on every pill click would put a network round trip behind a
 * control that should feel instant.
 */
export function Structure() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Committee | null>(null);

  const committees = useApi(() => committeesApi.list(), []);
  const members = useApi(() => membersApi.list(), []);

  /*
   * The advisory committee is hidden from this grid, exactly as in the original: its
   * details belong in About and the footer, and a "Faculty Advisory" card sitting beside
   * the student committees misrepresents the structure.
   */
  const visible = (committees.data ?? [])
    .filter((committee) => committee.type !== "advisory")
    .filter((committee) => filter === "all" || committee.type === filter);

  const membersByCommittee = new Map<string, Member[]>();
  for (const member of members.data ?? []) {
    if (!member.committeeId) continue;
    const list = membersByCommittee.get(member.committeeId) ?? [];
    list.push(member);
    membersByCommittee.set(member.committeeId, list);
  }

  return (
    <section id="structure" className="edge-top relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            eyebrow="How we are organised"
            title="Association"
            accent="Structure"
            description="Executive office-bearers and the functional committees that run our events, research and outreach."
            className="mb-0"
          />
          <FilterTabs
            label="Filter committees"
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            className="mb-0"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {committees.loading ? (
            [0, 1, 2, 3, 4, 5].map((index) => <Skeleton key={index} className="h-72" />)
          ) : committees.error ? (
            <ErrorNotice error={committees.error} onRetry={committees.reload} />
          ) : visible.length === 0 ? (
            <EmptyState icon="🗂️" title="No committees yet" />
          ) : (
            visible.map((committee) => {
              const committeeMembers = membersByCommittee.get(committee.id) ?? [];
              return (
                <article
                  key={committee.id}
                  id={`committee-${committee.id}`}
                  className="card-surface group flex scroll-mt-nav flex-col p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line2 hover:glow-sky"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      aria-hidden
                      className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg"
                      // The gradient is authored per committee by the admin, so it can
                      // only come through as a style; there is no fixed set to tokenise.
                      style={{ background: committee.gradient ?? undefined }}
                    >
                      {committee.icon}
                    </span>
                    {committee.badge ? (
                      <Badge tone={committee.type === "executive" ? "gold" : "sky"}>
                        {committee.badge}
                      </Badge>
                    ) : null}
                  </div>

                  <h3 className="mt-5 font-display text-lg leading-snug font-bold tracking-wide text-balance">
                    {committee.name}
                  </h3>

                  <p className="mt-1.5 font-mono text-[0.7rem] text-muted">
                    {committee.sizeLabel}
                  </p>

                  {committee.coordinator ? (
                    <p className="mt-3 text-xs text-muted">
                      <span className="text-sky">{committee.coordLabel ?? "Coordinator"}</span>{" "}
                      · {committee.coordinator}
                    </p>
                  ) : null}

                  {/*
                    Overlapping avatars plus a count, rather than a stacked list of every
                    member with their role underneath. The list made a six-person committee
                    three times the height of a two-person one, so the grid never lined up;
                    the names are one click away in the detail dialog.
                  */}
                  {committeeMembers.length > 0 ? (
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex -space-x-2.5">
                        {committeeMembers.slice(0, 4).map((member) => (
                          <Avatar
                            key={member.id}
                            src={member.photoUrl}
                            name={member.name}
                            size="sm"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted">
                        {committeeMembers.length}{" "}
                        {committeeMembers.length === 1 ? "member" : "members"}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-5 text-xs text-muted/70">Positions open</p>
                  )}

                  <button
                    onClick={() => setSelected(committee)}
                    className="mt-auto flex items-center gap-1.5 pt-6 text-start text-xs font-bold text-sky"
                  >
                    {committee.responsibilities.length} responsibilities
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </button>
                </article>
              );
            })
          )}
        </div>
      </div>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
      >
        {selected ? (
          <>
            {selected.coordinator ? (
              <p className="mb-5 rounded-lg border border-line bg-bg2 px-4 py-3 text-xs text-muted">
                <span className="text-sky">{selected.coordLabel ?? "Coordinator"}:</span>{" "}
                {selected.coordinator}
                {selected.coordinatorSub ? ` — ${selected.coordinatorSub}` : null}
              </p>
            ) : null}

            {(membersByCommittee.get(selected.id) ?? []).length > 0 ? (
              <>
                <h4 className="mb-3 font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase">
                  Members
                </h4>
                <ul className="mb-7 space-y-2.5">
                  {(membersByCommittee.get(selected.id) ?? []).map((member) => (
                    <li key={member.id} className="flex items-center gap-3">
                      <Avatar src={member.photoUrl} name={member.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
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
              </>
            ) : null}

            <h4 className="mb-3 font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase">
              Responsibilities
            </h4>
            <ul className="space-y-3">
              {selected.responsibilities.map((responsibility) => (
                <li key={responsibility} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky" />
                  <span>{responsibility}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Modal>
    </section>
  );
}
