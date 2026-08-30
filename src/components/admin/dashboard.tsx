"use client";

import { useState } from "react";
import Link from "next/link";
import { stats as statsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useAuth } from "@/lib/auth/context";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { AchievementsPanel } from "./achievements-panel";
import { ApplicationsPanel } from "./applications-panel";
import { CommitteesPanel } from "./committees-panel";
import { EventsPanel } from "./events-panel";
import { GalleryPanel } from "./gallery-panel";
import { MembersPanel } from "./members-panel";
import { MessagesPanel } from "./messages-panel";
import { UsersPanel } from "./users-panel";
import { AccountPanel, SettingsPanel } from "./settings-panel";

const TABS = [
  { id: "committees", label: "Committees" },
  { id: "members", label: "Members" },
  { id: "events", label: "Events" },
  { id: "gallery", label: "Gallery" },
  { id: "achievements", label: "Achievements" },
  { id: "applications", label: "Applications" },
  { id: "users", label: "Accounts" },
  { id: "messages", label: "Inbox" },
  { id: "settings", label: "Settings" },
  { id: "account", label: "Account" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Dashboard() {
  const { me } = useAuth();
  const [tab, setTab] = useState<TabId>("committees");
  const { data: stats } = useApi(() => statsApi.getForAdmin(), []);

  const counters = [
    { label: "Committees", value: stats?.counts.committees },
    { label: "Members", value: stats?.counts.members },
    { label: "Upcoming", value: stats?.counts.upcomingEvents },
    { label: "Photos", value: stats?.counts.photos },
    { label: "Achievements", value: stats?.counts.achievements },
    { label: "Unread", value: stats?.unreadMessages, alert: true },
  ];

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <div>
            <p className="font-serif text-lg font-extrabold tracking-tight text-navy2">
              {SITE.name} Admin
            </p>
            <p className="mt-0.5 text-xs text-muted">Signed in as {me?.name ?? me?.email}</p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-rule-strong px-3 py-1.5 text-xs text-navy2 hover:bg-navy/10"
          >
            View site →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <dl className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {counters.map((counter) => (
            <div key={counter.label} className="card px-3 py-3 text-center">
              <dd
                className={cn("font-mono text-xl font-bold tabular-nums",
                  // Unread messages are the one counter that should pull the eye, and
                  // only when there actually are any.
                  counter.alert && (counter.value ?? 0) > 0 ? "text-gold" : "text-navy2",
                )}
              >
                {counter.value ?? "—"}
              </dd>
              <dt className="mt-0.5 text-[0.6rem] tracking-wider text-muted uppercase">
                {counter.label}
              </dt>
            </div>
          ))}
        </dl>

        <div
          role="tablist"
          aria-label="Admin sections"
          className="mb-8 flex flex-wrap gap-2 border-b border-rule pb-3"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn("rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                tab === item.id
                  ? "bg-navy/12 text-navy2"
                  : "text-muted hover:bg-sunken hover:text-ink",
              )}
            >
              {item.label}
              {item.id === "messages" && (stats?.unreadMessages ?? 0) > 0 ? (
                <span className="ms-1.5 rounded-full bg-gold px-1.5 font-mono text-[0.6rem] text-bg">
                  {stats?.unreadMessages}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/*
          Each panel is mounted only while its tab is open, so switching tabs refetches.
          Deliberate: these panels edit the same underlying data as each other, and a
          cached members list that a committee deletion has since orphaned is worse than
          one extra request.
        */}
        {tab === "committees" ? <CommitteesPanel /> : null}
        {tab === "members" ? <MembersPanel /> : null}
        {tab === "events" ? <EventsPanel /> : null}
        {tab === "gallery" ? <GalleryPanel /> : null}
        {tab === "achievements" ? <AchievementsPanel /> : null}
        {tab === "applications" ? <ApplicationsPanel /> : null}
        {tab === "users" ? <UsersPanel /> : null}
        {tab === "messages" ? <MessagesPanel /> : null}
        {tab === "settings" ? <SettingsPanel /> : null}
        {tab === "account" ? <AccountPanel /> : null}
      </div>
    </div>
  );
}
