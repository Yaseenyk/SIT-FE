"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SECTIONS, SITE } from "@/lib/site";
import { useSettings } from "@/lib/settings-context";
import { cn, telHref } from "@/lib/utils";

/**
 * The site header: a utility bar, an institutional masthead, then the navigation.
 *
 * This three-band arrangement is the convention on essentially every college and
 * university site, and it is convention for a good reason — it answers "whose site is
 * this, and how do I contact them" before the visitor has scrolled at all. The previous
 * header was a single floating translucent bar with a gradient logo tile, which told a
 * visitor nothing and looked like a product landing page.
 */
export function Navbar() {
  const { settings } = useSettings();
  const [active, setActive] = useState<string>("home");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // The section nearest the top wins, so a tall section does not hold the highlight
        // while a short one is actually on screen.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );
    for (const section of SECTIONS) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Band 1 — contact details and the link up to the parent institute. */}
      <div className="utility-bar hidden md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-1.5 text-xs sm:px-6">
          <div className="flex items-center gap-5">
            {settings?.email ? (
              <a href={`mailto:${settings.email}`} className="hover:text-white">
                {settings.email}
              </a>
            ) : null}
            {settings?.phone ? (
              <a href={telHref(settings.phone)} className="hover:text-white">
                {settings.phone}
              </a>
            ) : null}
          </div>
          <div className="flex items-center gap-5">
            {settings?.website ? (
              <a
                href={settings.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                Institute website ↗
              </a>
            ) : null}
            <Link href="/admin/" className="hover:text-white">
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Band 2 — the masthead. Association, department, institute, in that order. */}
      <div className="border-b border-rule bg-page">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3.5" onClick={() => setOpen(false)}>
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-navy font-serif text-[0.7rem] leading-none font-bold text-white"
            >
              AISA
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-lg font-bold text-ink sm:text-xl">
                {SITE.longName}
              </span>
              <span className="block text-[0.72rem] text-muted">
                {SITE.department} · {SITE.institute}
              </span>
            </span>
          </Link>

          <button
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="primary-nav"
            aria-label="Toggle navigation"
            className="rounded border border-rule-strong px-3 py-2 text-ink lg:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Band 3 — the navigation itself, on the institutional navy. */}
      <nav aria-label="Main" className="hidden border-b border-navy3 bg-navy2 lg:block">
        <ul className="mx-auto flex max-w-6xl items-stretch px-4 sm:px-6">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
                className={cn("flex h-11 items-center border-b-[3px] px-4 text-[0.82rem] font-semibold tracking-wide text-white/85 transition-colors",
                  active === section.id
                    ? "border-gold bg-white/10 text-white"
                    : "border-transparent hover:bg-white/10 hover:text-white",
                )}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* `hidden` rather than conditional rendering, so the links stay in the DOM for
          in-page anchors and the panel does not remount on every toggle. */}
      <div id="primary-nav" hidden={!open} className="border-b border-rule bg-page lg:hidden">
        <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={() => setOpen(false)}
                className="block border-b border-rule py-3 text-sm font-semibold text-ink"
              >
                {section.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/admin/"
              onClick={() => setOpen(false)}
              className="block py-3 text-sm font-semibold text-navy2"
            >
              Admin
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
