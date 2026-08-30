"use client";

import { useEffect, useRef } from "react";

/**
 * Adds `is-visible` to an element the first time it scrolls into view, which is what
 * `.reveal` in globals.css animates against.
 *
 * <p>Two things here are deliberate.
 *
 * It **unobserves after the first reveal**. Re-animating a section every time it
 * re-enters the viewport turns scrolling back up into a flicker, and it is the reason
 * scroll animations usually feel cheap.
 *
 * It **falls back to visible**. If IntersectionObserver is missing, or the element is
 * already past the viewport on load (a deep link to `#contact`, say), the class is
 * applied immediately — because the failure mode of this hook is a permanently invisible
 * section, and content that never appears is far worse than content that never animates.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      element.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      // A little before the element's top edge arrives, so the animation is finishing
      // as it becomes properly readable rather than starting then.
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}
