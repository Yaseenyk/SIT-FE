import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The small shared pieces. Server components — none holds state or takes a handler.
 */

/**
 * A section's heading: a short gold rule, an optional eyebrow, the title, an intro.
 *
 * Left-aligned, one weight, no gradient. The previous version split every title into a
 * plain half and a gradient-filled half, which is a landing-page mannerism and the single
 * most recognisable "generated" tell on the page. A rule marks the section; the type just
 * says what it is.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div className={cn("mb-10", centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl", className)}>
      <div className={cn("section-rule", centered && "flex flex-col items-center")}>
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-gold uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl leading-tight font-bold text-balance sm:text-3xl">{title}</h2>
      </div>
      {description ? (
        <p className="mt-4 text-[0.95rem] leading-relaxed text-body">{description}</p>
      ) : null}
    </div>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card card-hover p-6", className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * A small status/category label.
 *
 * Solid-tinted with a matching border, not a glowing pill. Tones are semantic: navy is
 * structural, green means active/upcoming, amber means attention, red means stop.
 */
export function Badge({
  children,
  tone = "navy",
  className,
}: {
  children: ReactNode;
  tone?: "navy" | "gold" | "green" | "amber" | "red" | "muted";
  className?: string;
}) {
  // Full class strings, never `bg-${tone}-soft` — Tailwind scans source text, so a
  // constructed class name is absent from the output CSS and the badge renders unstyled.
  const tones = {
    navy: "bg-navy-tint text-navy2 border-navy2/20",
    gold: "bg-gold-soft text-gold border-gold/30",
    green: "bg-green-soft text-green border-green/25",
    amber: "bg-amber-soft text-amber border-amber/25",
    red: "bg-red-soft text-red border-red/25",
    muted: "bg-sunken text-muted border-rule",
  } as const;

  return (
    <span
      className={cn("inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A calendar-style date block.
 *
 * The date is what a visitor scans an events list for, so it is pulled out of the prose
 * and set as a block, the way a calendar does it.
 */
export function DateBlock({ iso, className }: { iso: string; className?: string }) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return (
      <div className={cn("flex size-14 shrink-0 flex-col items-center justify-center rounded border border-rule bg-sunken", className)}>
        <span className="text-xs text-muted">TBC</span>
      </div>
    );
  }
  return (
    <div
      className={cn("flex size-14 shrink-0 flex-col items-center justify-center rounded border border-rule bg-sunken",
        className,
      )}
    >
      <span className="text-[0.65rem] font-semibold tracking-wider text-navy2 uppercase">
        {date.toLocaleDateString("en-IN", { month: "short" })}
      </span>
      <span className="font-serif text-xl leading-none font-bold text-ink tabular-nums">
        {date.getDate()}
      </span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-sunken", className)} aria-hidden />;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="col-span-full rounded border border-dashed border-rule-strong bg-surface px-6 py-14 text-center">
      <p className="font-serif text-base font-semibold text-ink">{title}</p>
      {hint ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

/** A person's photo, or their initials on a tinted disc when there is none. */
export function Avatar({
  src,
  name,
  size = "md",
}: {
  src: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "size-9 text-[0.7rem]", md: "size-11 text-xs", lg: "size-16 text-sm" } as const;
  const initials = name
    .replace(/[[\]]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn("shrink-0 rounded-full border border-rule object-cover", sizes[size])}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full border border-navy2/15 bg-navy-tint font-semibold text-navy2",
        sizes[size],
      )}
    >
      {initials}
    </span>
  );
}

/**
 * A labelled fact, as used in the About panel and the contact block.
 *
 * Colleges publish a lot of small labelled facts — department, affiliation, established,
 * intake. A consistent pair element is what stops them turning into loose paragraphs.
 */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-rule py-3">
      <dt className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}
