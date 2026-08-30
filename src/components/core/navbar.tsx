"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SECTIONS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The fixed navbar, with a scroll spy over the in-page sections.
 *
 * The spy uses IntersectionObserver rather than a scroll listener comparing offsets — the
 * approach the original used, which recomputed every section's position on every scroll
 * event and so ran hundreds of layout reads a second while scrolling.
 */
export function Navbar() {
  const [active, setActive] = useState<string>("home");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // The section nearest the top of the viewport wins, so a tall section does not
        // hold the highlight while a short one is actually on screen.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // Top inset matches the navbar height; bottom inset means a section only counts
      // once it occupies the upper part of the viewport.
      { rootMargin: "-70px 0px -55% 0px", threshold: 0 },
    );

    for (const section of SECTIONS) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-nav border-b backdrop-blur-xl transition-colors",
        scrolled ? "border-line bg-bg/90" : "border-transparent bg-bg/70",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-sky to-violet font-display text-[0.6rem] leading-tight font-black text-bg"
          >
            AISA
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold tracking-tight text-sky">
              {SITE.name}
            </span>
            <span className="block text-[0.58rem] tracking-wider text-muted">
              {SITE.longName}
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? "true" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition-colors",
                  active === section.id
                    ? "bg-sky/10 text-sky"
                    : "text-muted hover:bg-sky/8 hover:text-sky",
                )}
              >
                {section.label}
              </a>
            </li>
          ))}
          <li className="ms-2">
            <Link
              href="/admin/"
              className="rounded-lg border border-line2 px-3 py-1.5 text-xs font-semibold tracking-wider text-sky uppercase transition-colors hover:bg-sky/10"
            >
              Admin
            </Link>
          </li>
        </ul>

        <button
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation"
          className="rounded-md border border-line px-3 py-1.5 text-sky lg:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      </nav>

      {/* `hidden` rather than conditional rendering, so the links stay in the DOM for
          in-page anchors and the panel does not remount on every toggle. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line bg-bg/97 backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto max-w-6xl px-4 py-3">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-semibold tracking-wide text-muted uppercase hover:bg-sky/8 hover:text-sky"
              >
                {section.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              href="/admin/"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-semibold tracking-wide text-sky uppercase hover:bg-sky/8"
            >
              Admin
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
