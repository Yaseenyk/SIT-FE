"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/client";

/**
 * The client-side primitives: anything with a handler, focus management, or state.
 *
 * Kept separate from primitives.tsx so importing a Card into a server component does not
 * drag "use client" along with it.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const variants = {
    primary: "bg-sky2 text-bg hover:bg-sky font-bold",
    ghost: "border border-line2 text-sky hover:bg-sky/10",
    danger: "border border-rose/40 text-rose hover:bg-rose/10",
  } as const;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg tracking-wide transition-colors",
        // Disabled buttons must still look disabled while a request is in flight, which
        // is the only time this component is disabled.
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * The filter pills above Structure, Events, Gallery and Achievements.
 *
 * A segmented control in a single bordered track, rather than loose pills floating on the
 * page. The loose version read as four unrelated buttons and gave no hint that picking one
 * deselects the others.
 */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    // A tablist, not a row of divs: this is the control that changes what the section
    // below shows, and a screen reader has to be able to say so.
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-full border border-line bg-bg2/60 p-1 backdrop-blur",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all",
              active
                ? "bg-sky2 text-bg shadow-sm"
                : "text-muted hover:bg-card2 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A modal dialog.
 *
 * Uses the native `<dialog>` element, which gives focus trapping, Escape-to-close, inert
 * background content and the top layer for free — all of which the original site's
 * Bootstrap modals provided and which a hand-rolled div would have to reimplement badly.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // showModal() throws if the dialog is already open, and close() on a closed dialog is
    // a no-op, so both are guarded on the element's own state rather than on `open`.
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Escape and the backdrop both close it. Without the click handler the backdrop is
      // inert, which reads as a frozen page.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[min(38rem,calc(100vw-2rem))] rounded-xl border border-line2 bg-card p-0 text-ink",
        "backdrop:bg-bg/80 backdrop:backdrop-blur-sm",
        "open:animate-fade-in",
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h3 className="font-display text-sm font-bold tracking-tight">{title}</h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-md px-2 py-1 text-muted transition-colors hover:bg-card2 hover:text-ink"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>
      ) : null}
    </dialog>
  );
}

/**
 * The failure state for a section whose data did not load.
 *
 * Every section on this site fetches at runtime, so this is a real, reachable state —
 * the API sleeping on a free tier is enough to produce it — and it offers a retry rather
 * than leaving a blank space.
 */
export function ErrorNotice({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="col-span-full rounded-xl border border-rose/25 bg-rose/8 px-6 py-8 text-center"
    >
      <p className="font-display text-sm font-bold tracking-tight text-rose">
        Could not load this section
      </p>
      <p className="mx-auto mt-2 max-w-md text-xs text-muted">{error.message}</p>
      {onRetry ? (
        <Button variant="ghost" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
