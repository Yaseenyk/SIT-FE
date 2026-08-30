"use client";

import { Avatar, Fact, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { committees as committeesApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useSettings } from "@/lib/settings-context";
import { SITE } from "@/lib/site";

export function About() {
  const { settings, loading } = useSettings();
  const committees = useApi(() => committeesApi.list(), []);

  // Blank entries are dropped rather than rendered as empty cards — an admin who fills in
  // two of the four should get two, not two and two empty boxes.
  const features = (settings?.features ?? []).filter((f) => f.title || f.description);

  /*
   * The advisory committee, surfaced.
   *
   * It was fetched and then deliberately filtered out of the Structure grid, so the
   * faculty who oversee the association appeared nowhere on the site at all. On a college
   * page that is the wrong omission to make: the faculty advisors are usually the first
   * thing a parent or a visiting department looks for.
   */
  const advisory = (committees.data ?? []).find((c) => c.type === "advisory") ?? null;

  return (
    <section id="about" className="border-b border-rule py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="prose-block">
            <SectionHeading
              eyebrow="About us"
              title={settings?.aboutTitle ?? `About ${SITE.name}`}
              className="mb-6"
            />

            {loading ? (
              <Skeleton className="h-24" />
            ) : (
              <p className="text-[0.95rem] leading-relaxed text-body">
                {settings?.aboutDescription}
              </p>
            )}

            {features.length > 0 ? (
              <>
                <h3 className="mt-10 mb-4 font-serif text-lg font-bold text-ink">
                  What the association does
                </h3>
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                  {features.map((feature, index) => (
                    <div key={feature.title ?? index} className="border-l-2 border-gold pl-4">
                      <h4 className="font-serif text-base font-bold text-ink">{feature.title}</h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-body">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <aside className="space-y-8">
            {/* A labelled facts panel — the "at a glance" box college pages always carry. */}
            <div className="card p-6">
              <h3 className="font-serif text-base font-bold text-ink">At a glance</h3>
              <dl className="mt-3">
                <Fact label="Department">Computer Science &amp; Engineering (AI &amp; ML)</Fact>
                <Fact label="Institute">{SITE.institute}</Fact>
                <Fact label="Location">{settings?.address ?? `${SITE.city}, Maharashtra`}</Fact>
                <Fact label="Committees">
                  {committees.data ? `${committees.data.length} active` : "—"}
                </Fact>
              </dl>
            </div>

            {advisory ? (
              <div className="card p-6">
                <h3 className="font-serif text-base font-bold text-ink">{advisory.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  Academic and administrative oversight of the association.
                </p>
                <ul className="mt-4 space-y-4">
                  {advisory.coordinator ? (
                    <li className="flex items-center gap-3">
                      <Avatar src={advisory.coordinatorPhoto} name={advisory.coordinator} />
                      <span>
                        <span className="block text-sm font-semibold text-ink">
                          {advisory.coordinator}
                        </span>
                        <span className="block text-xs text-muted">
                          {advisory.coordLabel}
                          {advisory.coordinatorSub ? ` · ${advisory.coordinatorSub}` : null}
                        </span>
                      </span>
                    </li>
                  ) : null}
                  {advisory.coordinator2 ? (
                    <li className="flex items-center gap-3">
                      <Avatar src={advisory.coordinator2Photo} name={advisory.coordinator2} />
                      <span>
                        <span className="block text-sm font-semibold text-ink">
                          {advisory.coordinator2}
                        </span>
                        <span className="block text-xs text-muted">{advisory.coord2Label}</span>
                      </span>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
