"use client";

import Link from "next/link";
import { SECTIONS, SITE } from "@/lib/site";
import { useSettings } from "@/lib/settings-context";
import { mapsHref, telHref } from "@/lib/utils";

/**
 * The footer: identity, quick links, contact, and a copyright line.
 *
 * Four columns on a navy ground, which is the arrangement essentially every institutional
 * site uses — and it works because a college footer is a directory, not decoration.
 */
export function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-card text-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-sky2 to-cyan font-display text-[0.55rem] leading-none font-bold text-bg"
            >
              AISA
            </span>
            <span className="font-display text-base font-bold text-white">{SITE.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            {SITE.longName}
            <br />
            {SITE.department}
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-white uppercase">
            Quick links
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="transition-colors hover:text-white">
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold tracking-[0.14em] text-white uppercase">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {/* Every entry is conditional: settings load at runtime and any field may be
                unset, so a missing phone number must leave no empty row behind. */}
            {settings?.address ? (
              <li>
                <a
                  href={mapsHref(settings.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-relaxed transition-colors hover:text-white"
                >
                  {settings.address}
                </a>
              </li>
            ) : null}
            {settings?.email ? (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="break-all transition-colors hover:text-white"
                >
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings?.phone ? (
              <li>
                <a href={telHref(settings.phone)} className="transition-colors hover:text-white">
                  {settings.phone}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold tracking-[0.14em] text-white uppercase">Institute</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {settings?.website ? (
              <li>
                <a
                  href={settings.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  {SITE.institute} ↗
                </a>
              </li>
            ) : null}
            {settings?.linkedin ? (
              <li>
                <a
                  href={settings.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  LinkedIn ↗
                </a>
              </li>
            ) : null}
            {settings?.instagram ? (
              <li>
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Instagram ↗
                </a>
              </li>
            ) : null}
            <li>
              <Link href="/admin/" className="transition-colors hover:text-white">
                Committee login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs sm:px-6">
          <p>
            © {year} {SITE.longName}, {SITE.institute}.
          </p>
          <p>{SITE.city}, Maharashtra, India</p>
        </div>
      </div>
    </footer>
  );
}
