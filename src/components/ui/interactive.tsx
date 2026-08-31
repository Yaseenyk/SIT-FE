"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/api/client";

/**
 * The client-side primitives: anything with a handler, focus management, or state.
 * Kept separate from primitives.tsx so importing a Card into a server component does not
 * drag "use client" along with it.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
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
    primary: "bg-sky2 text-white hover:bg-sky3",
    secondary: "border border-line2 bg-bg text-ink hover:bg-bg2",
    ghost: "text-sky hover:bg-sky-tint",
    danger: "border border-rose/30 text-rose hover:bg-rose-soft",
  } as const;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded font-semibold transition-colors",
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
 * The filter control above Structure, Events, Gallery and Achievements.
 *
 * An underlined tab strip rather than floating pills. Tabs sitting on a rule are the
 * convention for switching a list's contents, and they read as part of the page furniture
 * instead of as decoration.
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
      className={cn("flex flex-wrap items-end gap-6 border-b border-line", className)}
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
              "-mb-px border-b-2 pb-2.5 text-sm font-semibold transition-colors",
              active
                ? "border-gold text-ink"
                : "border-transparent text-muted hover:border-line2 hover:text-ink",
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
        "m-auto w-[min(40rem,calc(100vw-2rem))] rounded border border-line bg-bg p-0 text-body",
        "backdrop:bg-sky2/40",
      )}
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded px-2 py-1 text-muted transition-colors hover:bg-bg2 hover:text-ink"
        >
          ✕
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-line bg-bg2 px-6 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}

/**
 * The failure state for a section whose data did not load.
 *
 * Every section fetches at runtime, so this is a real, reachable state — the API sleeping
 * on a free tier is enough to produce it — and it offers a retry rather than a blank space.
 */
export function ErrorNotice({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="col-span-full rounded border border-rose/25 bg-rose-soft px-6 py-6 text-center"
    >
      <p className="font-display text-base font-semibold text-rose">Could not load this section</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-body">{error.message}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
