"use client";

import { useState } from "react";
import { Button, ErrorNotice, FilterTabs } from "@/components/ui/interactive";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { applications as applicationsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { gmailComposeUrl, timeAgo } from "@/lib/utils";
import type { ApplicationSummary } from "@/types/api";
import { FIELD, Notice, Panel, useActionState } from "./shared";

const TABS = [
  { value: "PENDING", label: "Awaiting review" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Not accepted" },
  { value: "", label: "All" },
] as const;

/**
 * The committee application queue.
 *
 * <p>Accepting does two things, and the second is the point: it records the decision AND
 * adds the student to that committee's roster on the public site. The alternative — accept
 * here, then retype the same person into the Members panel — is a step that gets skipped,
 * and a roster that silently falls behind the decisions actually made.
 */
export function ApplicationsPanel() {
  const [tab, setTab] = useState<string>("PENDING");
  const queue = useApi(() => applicationsApi.list(tab || undefined), [tab]);
  const { notice, busy, run, clearNotice } = useActionState();

  return (
    <Panel
      title="Committee applications"
      description="Accepting an application also adds the student to that committee on the public site."
    >
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      <FilterTabs
        label="Filter applications"
        options={TABS}
        value={tab}
        onChange={setTab}
        className="mb-6"
      />

      {queue.loading ? (
        <Skeleton className="h-64" />
      ) : queue.error ? (
        <ErrorNotice error={queue.error} onRetry={queue.reload} />
      ) : (queue.data ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-rule px-6 py-12 text-center text-xs text-muted">
          {tab === "PENDING"
            ? "Nothing waiting for review."
            : "No applications in this category."}
        </p>
      ) : (
        <ul className="space-y-4">
          {(queue.data ?? []).map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              busy={busy}
              onAction={run}
              onDone={queue.reload}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ApplicationCard({
  application,
  busy,
  onAction,
  onDone,
}: {
  application: ApplicationSummary;
  busy: boolean;
  onAction: (fn: () => Promise<unknown>, success: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const [role, setRole] = useState("");
  const pending = application.status === "PENDING";

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {application.applicantName ?? "Unnamed"}
            <span className="ms-2 font-normal text-muted">
              → {application.committeeName ?? application.committeeId}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {application.applicantEmail ? (
              <a href={`mailto:${application.applicantEmail}`} className="hover:text-navy2">
                {application.applicantEmail}
              </a>
            ) : null}
            {application.rollNumber ? ` · ${application.rollNumber}` : ""}
            {application.year ? ` · Year ${application.year}` : ""}
            {" · "}
            {timeAgo(application.appliedAt)}
          </p>
        </div>

        <Badge
          tone={
            application.status === "ACCEPTED"
              ? "green"
              : application.status === "REJECTED"
                ? "muted"
                : "amber"
          }
        >
          {application.status === "ACCEPTED"
            ? "Accepted"
            : application.status === "REJECTED"
              ? "Not accepted"
              : "Awaiting review"}
        </Badge>
      </div>

      {/* whitespace-pre-wrap: stored exactly as typed, so the applicant's paragraph
          breaks survive to the screen. */}
      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-body">
        {application.motivation}
      </p>

      {pending ? (
        <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-rule pt-4">
          <label htmlFor={`role-${application.id}`} className="sr-only">
            Role on the roster
          </label>
          <input
            id={`role-${application.id}`}
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Role (default: Member)"
            className={`${FIELD} max-w-[14rem]`}
          />

          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              const ok = await onAction(
                () => applicationsApi.review(application.id, { status: "ACCEPTED", role }),
                `${application.applicantName ?? "Applicant"} added to ${application.committeeName ?? "the committee"}`,
              );
              if (ok) onDone();
            }}
          >
            Accept
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={async () => {
              const ok = await onAction(
                () => applicationsApi.review(application.id, { status: "REJECTED" }),
                "Application marked as not accepted",
              );
              if (ok) onDone();
            }}
          >
            Decline
          </Button>

          {application.applicantEmail ? (
            /*
              Gmail's compose window rather than a mailto: link. mailto: needs a configured
              desktop mail client, which most phones and lab machines do not have — the
              button would simply do nothing.
            */
            <a
              href={gmailComposeUrl(
                application.applicantEmail,
                `Your AISA application — ${application.committeeName ?? "committee"}`,
                `Hello ${application.applicantName ?? ""},\n\n`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-navy2 hover:underline"
            >
              Email them
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
