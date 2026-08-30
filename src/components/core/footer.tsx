"use client";

import Link from "next/link";
import { SECTIONS, SITE } from "@/lib/site";
import { useSettings } from "@/lib/settings-context";
import { mapsHref, telHref } from "@/lib/utils";

export function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="edge-top bg-bg2">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky to-violet font-display text-[0.6rem] leading-tight font-black text-bg"
            >
              AISA
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-extrabold tracking-tight text-sky">
                {SITE.name}
              </span>
              <span className="block text-[0.6rem] tracking-wider text-muted">
                {SITE.longName}
              </span>
            </span>
          </div>

          <p className="mt-6 max-w-xs text-xs leading-relaxed text-muted">
            {SITE.department}
            <br />
            {SITE.institute}
            <br />
            {SITE.city}, Maharashtra
          </p>

          {settings?.linkedin || settings?.instagram ? (
            <ul className="mt-6 flex gap-2">
              {settings.linkedin ? (
                <li>
                  <a
                    href={settings.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-lg border border-line px-3 py-1.5 text-[0.7rem] font-semibold text-muted transition-colors hover:border-line2 hover:text-sky"
                  >
                    LinkedIn
                  </a>
                </li>
              ) : null}
              {settings.instagram ? (
                <li>
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-lg border border-line px-3 py-1.5 text-[0.7rem] font-semibold text-muted transition-colors hover:border-line2 hover:text-sky"
                  >
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Footer">
          <h2 className="font-mono text-[0.65rem] tracking-[0.2em] text-ink uppercase">
            Explore
          </h2>
          <ul className="mt-5 space-y-2.5">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-muted transition-colors hover:text-sky"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-[0.65rem] tracking-[0.2em] text-ink uppercase">
            Contact
          </h2>
          <ul className="mt-5 space-y-3.5 text-sm text-muted">
            {/* Every entry is conditional: settings load at runtime and any field may be
                unset, so a missing phone number must leave no empty row behind. */}
            {settings?.email ? (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="break-all transition-colors hover:text-sky"
                >
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings?.phone ? (
              <li>
                <a href={telHref(settings.phone)} className="transition-colors hover:text-sky">
                  {settings.phone}
                </a>
              </li>
            ) : null}
            {settings?.address ? (
              <li>
                <a
                  href={mapsHref(settings.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leading-relaxed transition-colors hover:text-sky"
                >
                  {settings.address}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
          <p className="text-xs text-muted">
            © {year} {SITE.name} — {SITE.longName}.
          </p>
          <Link href="/admin/" className="text-xs text-muted transition-colors hover:text-sky">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
