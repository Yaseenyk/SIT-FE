"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SECTIONS, SITE } from "@/lib/site";
import { useAuth } from "@/lib/auth/context";
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
            <AccountLink className="hover:text-white" />
          </div>
        </div>
      </div>

      {/* Band 2 — the masthead. Association, department, institute, in that order. */}
      <div className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-3.5" onClick={() => setOpen(false)}>
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-sky2 to-cyan font-display text-[0.6rem] leading-none font-bold text-bg"
            >
              AISA
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold text-ink sm:text-xl">
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
            className="rounded border border-line2 px-3 py-2 text-ink lg:hidden"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Band 3 — the navigation itself, on the institutional navy. */}
      {/* Dark and translucent, as the original's fixed bar was — the accent belongs on
          the active item, not spread across the whole band. */}
      <nav
        aria-label="Main"
        className="hidden border-b border-line bg-bg2/85 backdrop-blur-xl lg:block"
      >
        <ul className="mx-auto flex max-w-6xl items-stretch px-4 sm:px-6">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
                className={cn("flex h-11 items-center border-b-[3px] px-4 text-[0.82rem] font-semibold tracking-wide transition-colors",
                  active === section.id
                    ? "border-sky bg-sky-tint text-sky"
                    : "border-transparent text-muted hover:bg-sky-tint hover:text-ink",
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
      <div id="primary-nav" hidden={!open} className="border-b border-line bg-bg lg:hidden">
        <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={() => setOpen(false)}
                className="block border-b border-line py-3 text-sm font-semibold text-ink"
              >
                {section.label}
              </a>
            </li>
          ))}
          <li>
            <AccountLink
              onNavigate={() => setOpen(false)}
              className="block py-3 text-sm font-semibold text-sky"
            />
          </li>
        </ul>
      </div>
    </header>
  );
}

/**
 * The one link in the header that changes with who is looking.
 *
 * <p>It used to say "Admin" for everybody, which pointed the overwhelming majority of
 * visitors — students — at a dashboard they cannot open. Now it offers the door that is
 * actually theirs: sign in, their account, or the dashboard if they run the site.
 */
function AccountLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { state, isAdmin, me } = useAuth();

  // Nothing at all until the session is known. A link that says "Sign in" for a moment
  // and then becomes the person's own name is worse than one that arrives a beat late.
  if (state === "loading") return null;

  if (state === "signed-out") {
    return (
      <Link href="/login/" onClick={onNavigate} className={className}>
        Sign in
      </Link>
    );
  }

  return (
    <Link href={isAdmin ? "/admin/" : "/account/"} onClick={onNavigate} className={className}>
      {isAdmin ? "Dashboard" : (me?.name?.split(" ")[0] ?? "My account")}
    </Link>
  );
}
