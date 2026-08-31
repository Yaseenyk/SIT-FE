"use client";

import { useEffect, useState } from "react";
import { SLOW_REQUEST_EVENT } from "@/lib/api/client";

/**
 * Explains the wait while the API is starting up.
 *
 * <p>The backend runs on a free tier that stops after fifteen minutes of inactivity and
 * takes around forty seconds to come back. Nothing is wrong during those forty seconds,
 * but a page of empty skeletons is indistinguishable from a broken site — and the first
 * visitor of the morning is exactly the person most likely to conclude that.
 *
 * <p>One banner, driven by a signal from the API client, rather than a "still loading"
 * state threaded through all eight sections. It appears only once a request has been slow
 * for six seconds, so a warm API — which is the normal case — never shows it at all.
 */
export function WakingNotice() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    const onSlow = (event: Event) => {
      const detail = (event as CustomEvent<{ pending: number }>).detail;
      setWaking((detail?.pending ?? 0) > 0);
    };
    window.addEventListener(SLOW_REQUEST_EVENT, onSlow);
    return () => window.removeEventListener(SLOW_REQUEST_EVENT, onSlow);
  }, []);

  if (!waking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-gold/25 bg-gold-soft"
    >
      <p className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-sm text-sky sm:px-6">
        <span
          aria-hidden
          className="size-2 shrink-0 animate-pulse rounded-full bg-gold"
        />
        Waking the server — the site is hosted on a free tier that sleeps when idle. This
        takes up to a minute the first time, then everything is instant.
      </p>
    </div>
  );
}
