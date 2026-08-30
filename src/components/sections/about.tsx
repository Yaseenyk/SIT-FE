"use client";

import { SectionHeading, Skeleton } from "@/components/ui/primitives";
import { useSettings } from "@/lib/settings-context";

/** Icons for the four feature blurbs. Positional, matching feature1..feature4 on the API. */
const FEATURE_ICONS = ["🎓", "⚙️", "🔬", "🤝"] as const;

/**
 * What the association does.
 *
 * A two-column split — heading on the left, the four pillars stacked on the right — rather
 * than a centred heading over a four-across row. The row gave each pillar a narrow column
 * roughly a hundred pixels wide, which is not enough for a sentence, so every card was a
 * word and a fragment. Two-up gives them room to say something.
 */
export function About() {
  const { settings, loading } = useSettings();

  // Blank entries are dropped rather than rendered as empty cards — an admin who fills in
  // two of the four should get two cards, not two cards and two empty boxes.
  const features = (settings?.features ?? []).filter(
    (feature) => feature.title || feature.description,
  );

  return (
    <section id="about" className="edge-top relative bg-bg2 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow="Who we are"
              title="About"
              accent="AISA"
              description={settings?.aboutDescription ?? undefined}
              className="mb-8"
            />
            <dl className="flex gap-8 border-t border-line pt-8">
              <div>
                <dt className="font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase">
                  Department
                </dt>
                <dd className="mt-1.5 text-sm font-semibold">CSE (AI &amp; ML)</dd>
              </div>
              <div>
                <dt className="font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase">
                  Institute
                </dt>
                <dd className="mt-1.5 text-sm font-semibold">BSIET, Kolhapur</dd>
              </div>
            </dl>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-44" />
              ))}
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <li
                  key={feature.title ?? index}
                  className="card-surface group p-7 transition-all duration-300 hover:-translate-y-1 hover:border-line2 hover:glow-sky"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-3xl" aria-hidden>
                      {FEATURE_ICONS[index] ?? "✦"}
                    </span>
                    {/* A quiet index. It gives the four cards an order to be read in,
                        which a bare grid of icons does not. */}
                    <span className="font-mono text-xs text-muted/50 tabular-nums">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-base font-bold tracking-tight text-sky">
                    {feature.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
