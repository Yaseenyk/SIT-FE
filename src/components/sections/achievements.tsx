"use client";

import { useState } from "react";
import { Avatar, Badge, EmptyState, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { ErrorNotice, FilterTabs } from "@/components/ui/interactive";
import { achievements as achievementsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { formatDate } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "competition", label: "Competitions" },
  { value: "research", label: "Research" },
  { value: "internship", label: "Internships" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

/**
 * Each category gets a colour, and nothing else.
 *
 * The previous version stamped a 7xl emoji watermark across every card. That is a
 * generated-page mannerism, and on a page listing students' real accomplishments it
 * trivialised them. A coloured label is enough to scan by.
 */
const CATEGORY = {
  competition: { tone: "gold", label: "Competition" },
  research: { tone: "navy", label: "Research" },
  internship: { tone: "green", label: "Internship" },
} as const;

function categoryOf(value: string | null) {
  return value && value in CATEGORY ? CATEGORY[value as keyof typeof CATEGORY] : null;
}

export function Achievements() {
  const [filter, setFilter] = useState<Filter>("all");

  const { data, error, loading, reload } = useApi(
    () => achievementsApi.list(filter === "all" ? undefined : filter),
    [filter],
  );

  return (
    <section id="achievements" className="border-b border-rule bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Recognition"
          title="Student achievements"
          description="Competitions won, papers published, and internships earned by students of the department."
        />
        <FilterTabs
          label="Filter achievements"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          className="mb-8"
        />

        <div className="grid gap-5 md:grid-cols-2">
          {loading ? (
            [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-40" />)
          ) : error ? (
            <ErrorNotice error={error} onRetry={reload} />
          ) : (data ?? []).length === 0 ? (
            <EmptyState
              title="No achievements recorded yet"
              hint="Won a competition or published a paper? Tell the Media committee and it will be listed here."
            />
          ) : (
            (data ?? []).map((achievement) => {
              const category = categoryOf(achievement.category);
              return (
                <article key={achievement.id} className="card card-hover p-5">
                  <div className="flex items-start gap-4">
                    <Avatar src={achievement.photoUrl} name={achievement.student} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {category ? (
                          <Badge tone={category.tone}>{category.label}</Badge>
                        ) : null}
                        {achievement.achievedOn ? (
                          <span className="text-xs text-muted">
                            {formatDate(achievement.achievedOn)}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-2 font-serif text-base leading-snug font-bold text-ink text-balance">
                        {achievement.title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-navy2">
                        {achievement.student}
                      </p>
                    </div>
                  </div>

                  {achievement.description ? (
                    <p className="mt-3 border-t border-rule pt-3 text-sm leading-relaxed text-body">
                      {achievement.description}
                    </p>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
