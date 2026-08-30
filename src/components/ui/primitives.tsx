import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The small shared pieces. One file because each is a handful of lines and they are
 * always imported together; splitting them would be six files of boilerplate.
 *
 * All server components — none of them holds state or takes a handler.
 */

/**
 * A section's heading block.
 *
 * `align` exists because the first version centred every heading on the page, and seven
 * identically-centred sections read as one long undifferentiated column. Left-aligned is
 * now the default, with a rule under the eyebrow to anchor it; centring is reserved for
 * the two sections that are genuinely symmetrical.
 */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: string;
  /** Rendered in the gradient after `title`. Split so the h2 stays one element. */
  accent?: string;
  description?: string;
  align?: "start" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-14",
        centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-4 flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.25em] text-sky uppercase",
            centered && "justify-center",
          )}
        >
          <span aria-hidden className="h-px w-8 bg-sky/50" />
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl leading-[1.1] font-black tracking-tight text-balance sm:text-[2.75rem]">
        {title} {accent ? <span className="text-gradient">{accent}</span> : null}
      </h2>
      {description ? (
        <p className="mt-5 text-sm leading-relaxed text-muted sm:text-base">{description}</p>
      ) : null}
    </div>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "card-surface p-6 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-line2 hover:glow-sky",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "sky",
  className,
}: {
  children: ReactNode;
  tone?: "sky" | "emerald" | "gold" | "rose" | "muted";
  className?: string;
}) {
  // Full class strings, never `bg-${tone}/10` — Tailwind scans source text, so a
  // constructed class name is not in the output CSS and the badge renders unstyled.
  const tones = {
    sky: "bg-sky/10 text-sky border-sky/25",
    emerald: "bg-emerald/10 text-emerald border-emerald/25",
    gold: "bg-gold/10 text-gold border-gold/25",
    rose: "bg-rose/10 text-rose border-rose/25",
    muted: "bg-muted/10 text-muted border-muted/25",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 font-mono text-[0.6rem] tracking-[0.12em] uppercase",
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
 * An event's date is the thing a visitor scans for, and it was previously a line of small
 * mono text lost under the title. Rendering the day large and the month above it makes the
 * list scannable at a glance, the way a calendar is.
 */
export function DateBlock({ iso, className }: { iso: string; className?: string }) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return (
    <div
      className={cn(
        "flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border border-line2 bg-bg/60",
        className,
      )}
    >
      <span className="font-mono text-[0.6rem] tracking-widest text-sky uppercase">
        {date.toLocaleDateString("en-IN", { month: "short" })}
      </span>
      <span className="font-display text-lg leading-none font-black tabular-nums">
        {date.getDate()}
      </span>
    </div>
  );
}

/** A placeholder with the same footprint as the content it stands in for. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-card2", className)} aria-hidden />;
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-card/30 px-6 py-20 text-center">
      <span className="mb-4 text-4xl opacity-60" aria-hidden>
        {icon}
      </span>
      <p className="font-display text-sm font-bold tracking-tight">{title}</p>
      {hint ? <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">{hint}</p> : null}
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
  const sizes = { sm: "size-8 text-[0.6rem]", md: "size-10 text-xs", lg: "size-16 text-sm" } as const;
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
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-line2", sizes[size])}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-card2 font-mono font-bold text-sky ring-2 ring-line2",
        sizes[size],
      )}
    >
      {initials}
    </span>
  );
}
