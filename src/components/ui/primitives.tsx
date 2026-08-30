import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The small shared pieces. Server components — none holds state or takes a handler.
 */

/**
 * A section's heading: a short gold rule, an optional eyebrow, the title, an intro.
 *
 * <p>Left-aligned, one weight, no gradient — a gradient-filled half-title is the single
 * most recognisable "generated" tell there is. What it gained over the previous version
 * is size: section titles now run to 40px, because a page where the headings are barely
 * larger than the body text has no hierarchy and reads as one long undifferentiated
 * document. Ornament is not what was missing; contrast was.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  onDark = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  /** Flips the type colours for the navy bands, where ink-on-navy is unreadable. */
  onDark?: boolean;
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-12",
        centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        className,
      )}
    >
      <div className={cn("section-rule", centered && "flex flex-col items-center")}>
        {eyebrow ? (
          <p
            className={cn(
              "mb-3 text-xs font-semibold tracking-[0.16em] uppercase",
              onDark ? "text-gold-bright" : "text-gold",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "display text-3xl leading-[1.15] font-bold text-balance sm:text-4xl",
            onDark && "text-white",
          )}
        >
          {title}
        </h2>
      </div>
      {description ? (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed",
            onDark ? "text-white/75" : "text-body",
          )}
        >
          {description}
        </p>
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
 * <p>Solid-tinted with a matching border, not a glowing pill. Tones are semantic: navy is
 * structural, green means active/upcoming, amber means attention, red means stop.
 */
export function Badge({
  children,
  tone = "navy",
  className,
}: {
  children: ReactNode;
  tone?: "navy" | "gold" | "clay" | "green" | "amber" | "red" | "muted";
  className?: string;
}) {
  // Full class strings, never `bg-${tone}-soft` — Tailwind scans source text, so a
  // constructed class name is absent from the output CSS and the badge renders unstyled.
  const tones = {
    navy: "bg-navy-tint text-navy2 border-navy2/20",
    gold: "bg-gold-soft text-gold border-gold/30",
    clay: "bg-clay-soft text-clay border-clay/25",
    green: "bg-green-soft text-green border-green/25",
    amber: "bg-amber-soft text-amber border-amber/25",
    red: "bg-red-soft text-red border-red/25",
    muted: "bg-sunken text-muted border-rule",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide",
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
 * <p>The date is what a visitor scans an events list for, so it is pulled out of the
 * prose and set as a block, the way a calendar does it. Navy-filled rather than outlined:
 * as an outline it disappeared into the card border beside it.
 */
export function DateBlock({ iso, className }: { iso: string; className?: string }) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return (
      <div
        className={cn(
          "flex size-16 shrink-0 flex-col items-center justify-center rounded-md border border-rule bg-sunken",
          className,
        )}
      >
        <span className="text-xs font-semibold text-muted">TBC</span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex size-16 shrink-0 flex-col items-center justify-center overflow-hidden rounded-md bg-navy text-white shadow-raise",
        className,
      )}
    >
      <span className="w-full bg-gold py-0.5 text-center text-[0.6rem] font-bold tracking-[0.1em] text-navy-deep uppercase">
        {date.toLocaleDateString("en-IN", { month: "short" })}
      </span>
      <span className="flex flex-1 items-center font-serif text-2xl leading-none font-bold tabular-nums">
        {date.getDate()}
      </span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-sunken", className)} aria-hidden />;
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="col-span-full rounded-lg border border-dashed border-rule-strong bg-surface px-6 py-16 text-center">
      <div
        aria-hidden
        className="image-placeholder mx-auto mb-5 size-14 rounded-lg border border-rule"
      />
      <p className="font-serif text-lg font-bold text-ink">{title}</p>
      {hint ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{hint}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
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
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "size-9 text-[0.7rem]",
    md: "size-11 text-xs",
    lg: "size-16 text-sm",
    xl: "size-24 text-lg",
  } as const;
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
        className={cn(
          "shrink-0 rounded-full border-2 border-paper object-cover shadow-raise",
          sizes[size],
        )}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 border-paper bg-navy font-semibold text-white shadow-raise",
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
 * <p>Colleges publish a lot of small labelled facts — department, affiliation,
 * established, intake. A consistent pair element is what stops them turning into loose
 * paragraphs.
 */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-rule py-3.5 first:border-t-0 first:pt-0">
      <dt className="text-[0.68rem] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}
