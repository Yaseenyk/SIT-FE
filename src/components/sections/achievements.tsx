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

/** Each category gets its own colour and mark, so the list is scannable by type. */
const CATEGORY = {
  competition: { tone: "gold", icon: "🏆", label: "Competition" },
  research: { tone: "sky", icon: "📄", label: "Research" },
  internship: { tone: "emerald", icon: "💼", label: "Internship" },
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
    <section id="achievements" className="edge-top relative bg-bg2 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            eyebrow="Recognition"
            title="Student"
            accent="Achievements"
            description="Competitions won, papers published, and offers earned by AIML students."
            className="mb-0"
          />
          <FilterTabs
            label="Filter achievements"
            options={FILTERS}
            value={filter}
            onChange={setFilter}
            className="mb-0"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {loading ? (
            [0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-44" />)
          ) : error ? (
            <ErrorNotice error={error} onRetry={reload} />
          ) : (data ?? []).length === 0 ? (
            <EmptyState
              icon="🏆"
              title="No achievements recorded yet"
              hint="Won something? Tell the media committee and it will appear here."
            />
          ) : (
            (data ?? []).map((achievement) => {
              const category = categoryOf(achievement.category);
              return (
                <article
                  key={achievement.id}
                  className="card-surface group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line2 hover:glow-sky"
                >
                  {/* A large, faint category mark. It gives each card a distinguishing
                      shape at a glance without adding another element to read. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -end-3 -top-3 text-7xl opacity-[0.07] transition-opacity group-hover:opacity-[0.12]"
                  >
                    {category?.icon ?? "✦"}
                  </span>

                  <div className="relative flex items-start gap-4">
                    <Avatar src={achievement.photoUrl} name={achievement.student} size="lg" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {category ? (
                          <Badge tone={category.tone}>{category.label}</Badge>
                        ) : null}
                        {achievement.achievedOn ? (
                          <span className="font-mono text-[0.65rem] text-muted">
                            {formatDate(achievement.achievedOn)}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-2.5 font-display text-base leading-snug font-bold tracking-tight text-balance">
                        {achievement.title}
                      </h3>

                      <p className="mt-1.5 text-sm font-semibold text-sky">
                        {achievement.student}
                      </p>
                    </div>
                  </div>

                  {achievement.description ? (
                    <p className="relative mt-4 text-sm leading-relaxed text-muted">
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
