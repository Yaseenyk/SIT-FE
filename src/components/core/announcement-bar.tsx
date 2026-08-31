"use client";

import { useSyncExternalStore } from "react";
import { useSettings } from "@/lib/settings-context";

const DISMISSED_KEY = "aisa.announcement.dismissed";

/*
 * localStorage as an external store.
 *
 * `useSyncExternalStore` is the primitive React provides for exactly this, and it earns
 * its keep twice here: the `getServerSnapshot` argument makes the prerendered HTML and
 * the first client render agree (this page is built statically, when localStorage does
 * not exist), and reading in render rather than in an effect means the bar never flashes
 * on screen before being hidden again.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Also listen for the storage event, so dismissing in one tab hides it in the others.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    // Private mode, or site data blocked. Showing the bar is the better failure.
    return null;
  }
}

/** Nothing is dismissed at build time, so the static HTML always contains the bar. */
function getServerSnapshot(): string | null {
  return null;
}

function dismiss(text: string): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, text);
  } catch {
    // Dismissal simply will not persist across reloads.
  }
  // `storage` does not fire in the tab that made the change, so notify this one directly.
  listeners.forEach((listener) => listener());
}

/**
 * The announcement strip above the navbar.
 *
 * Expiry is decided by the SERVER — `settings.announcement` is already null once it has
 * passed, so there is no date comparison here. The original compared the expiry against
 * the visitor's own clock, so a device with the wrong date kept showing an announcement
 * that had ended weeks earlier.
 *
 * Dismissal is keyed by the announcement's own text, so publishing a new one shows it
 * again to somebody who dismissed the last.
 */
export function AnnouncementBar() {
  const { settings } = useSettings();
  const dismissedText = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const announcement = settings?.announcement ?? null;
  if (!announcement || dismissedText === announcement.text) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-60 flex items-center justify-center gap-3 bg-gradient-to-r from-sky to-violet px-4 py-2 text-center text-xs font-semibold text-bg"
    >
      <span>{announcement.text}</span>
      <button
        onClick={() => dismiss(announcement.text)}
        aria-label="Dismiss announcement"
        className="rounded px-1.5 leading-none font-bold hover:bg-bg/15"
      >
        ✕
      </button>
    </div>
  );
}
