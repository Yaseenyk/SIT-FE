"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorNotice, Modal } from "@/components/ui/interactive";
import { Badge, Skeleton } from "@/components/ui/primitives";
import {
  events as eventsApi,
  registrations as registrationsApi,
} from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { AisaEvent } from "@/types/api";
import {
  DeleteButton,
  FIELD,
  Field,
  ImagePicker,
  Notice,
  Panel,
  TableShell,
  useActionState,
} from "./shared";

export function EventsPanel() {
  const events = useApi(() => eventsApi.list(), []);
  const { notice, busy, run, clearNotice } = useActionState();

  const [draft, setDraft] = useState<{
    id: string | null;
    bannerUrl: string | null;
    bannerPublicId: string | null;
  } | null>(null);
  const [editing, setEditing] = useState<AisaEvent | null>(null);
  const [attendeesFor, setAttendeesFor] = useState<AisaEvent | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const data = new FormData(event.currentTarget);

    const body = {
      title: String(data.get("title") ?? ""),
      startsOn: String(data.get("startsOn") ?? ""),
      // An empty date input submits "", which is not a date. Send null so the server
      // treats it as absent rather than rejecting it as malformed.
      endsOn: String(data.get("endsOn") ?? "") || null,
      dateLabel: String(data.get("dateLabel") ?? ""),
      tag: String(data.get("tag") ?? ""),
      emoji: String(data.get("emoji") ?? ""),
      description: String(data.get("description") ?? ""),
      linkUrl: String(data.get("linkUrl") ?? ""),
      bannerUrl: draft.bannerUrl,
      bannerPublicId: draft.bannerPublicId,
    };

    const ok = await run(
      () => (draft.id ? eventsApi.update(draft.id, body) : eventsApi.create(body)),
      draft.id ? "Event updated" : "Event added",
    );
    if (ok) {
      setDraft(null);
      events.reload();
    }
  }

  return (
    <Panel
      title="Events"
      description="Upcoming and past are decided by the date — there is no tab to set."
      action={
        <Button
          onClick={() => {
            setEditing(null);
            setDraft({ id: null, bannerUrl: null, bannerPublicId: null });
          }}
        >
          Add event
        </Button>
      }
    >
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      {events.loading ? (
        <Skeleton className="h-64" />
      ) : events.error ? (
        <ErrorNotice error={events.error} onRetry={events.reload} />
      ) : (
        <TableShell>
          <thead className="bg-card2 text-[0.65rem] tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 text-start">Event</th>
              <th className="px-4 py-3 text-start">When</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(events.data ?? []).map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span aria-hidden className="me-2">
                    {item.emoji}
                  </span>
                  {item.title}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">{item.dateLabel}</td>
                <td className="px-4 py-3">
                  <Badge tone={item.status === "upcoming" ? "green" : "muted"}>
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setAttendeesFor(item)}>
                      Attendees
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(item);
                        setDraft({ id: item.id, bannerUrl: item.bannerUrl, bannerPublicId: null });
                      }}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      disabled={busy}
                      onConfirm={async () => {
                        const ok = await run(() => eventsApi.remove(item.id), "Event deleted");
                        if (ok) events.reload();
                      }}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <AttendeesModal event={attendeesFor} onClose={() => setAttendeesFor(null)} />

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={editing ? `Edit ${editing.title}` : "Add event"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button type="submit" form="event-form" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form id="event-form" onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" htmlFor="e-title" required>
            <input id="e-title" name="title" required defaultValue={editing?.title} className={FIELD} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts on" htmlFor="e-start" required>
              <input
                id="e-start"
                name="startsOn"
                type="date"
                required
                defaultValue={editing?.startsOn}
                className={FIELD}
              />
            </Field>
            <Field label="Ends on" htmlFor="e-end" hint="Only for multi-day events.">
              <input
                id="e-end"
                name="endsOn"
                type="date"
                defaultValue={editing?.endsOn ?? ""}
                className={FIELD}
              />
            </Field>
          </div>

          <Field
            label="Date label"
            htmlFor="e-label"
            hint="Optional. Overrides the generated label — e.g. 'Every Friday in March'."
          >
            <input id="e-label" name="dateLabel" defaultValue={editing?.dateLabel ?? ""} className={FIELD} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tag" htmlFor="e-tag">
              <input
                id="e-tag"
                name="tag"
                defaultValue={editing?.tag ?? ""}
                placeholder="Workshop"
                className={FIELD}
              />
            </Field>
            <Field label="Emoji" htmlFor="e-emoji">
              <input
                id="e-emoji"
                name="emoji"
                defaultValue={editing?.emoji ?? ""}
                placeholder="🔬"
                className={FIELD}
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="e-desc">
            <textarea
              id="e-desc"
              name="description"
              rows={3}
              defaultValue={editing?.description ?? ""}
              className={FIELD}
            />
          </Field>

          <Field label="Registration link" htmlFor="e-link">
            <input
              id="e-link"
              name="linkUrl"
              type="url"
              defaultValue={editing?.linkUrl && editing.linkUrl !== "#" ? editing.linkUrl : ""}
              className={FIELD}
            />
          </Field>

          <Field label="Banner" htmlFor="e-banner">
            <ImagePicker
              folder="events"
              value={{ url: draft?.bannerUrl ?? null, publicId: draft?.bannerPublicId ?? null }}
              onChange={(next) =>
                setDraft((current) =>
                  current
                    ? { ...current, bannerUrl: next.url, bannerPublicId: next.publicId }
                    : current,
                )
              }
            />
          </Field>
        </form>
      </Modal>
    </Panel>
  );
}

/**
 * Who has signed up for one event.
 *
 * <p>Exists because a registration nobody can read is not a feature. The copy button is
 * the point of it in practice: the organiser wants the list in a spreadsheet or a message,
 * and asking them to retype twenty names is how the feature stops being used.
 */
function AttendeesModal({ event, onClose }: { event: AisaEvent | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const attendees = useApi(
    () => (event ? registrationsApi.forEvent(event.id) : Promise.resolve([])),
    [event?.id ?? ""],
  );
  const rows = attendees.data ?? [];

  return (
    <Modal
      open={event !== null}
      onClose={onClose}
      title={event ? `Attendees — ${event.title}` : "Attendees"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            disabled={rows.length === 0}
            onClick={async () => {
              // Tab-separated, so it pastes into a spreadsheet as columns rather than
              // as one string per row.
              const text = [
                ["Name", "Email", "Roll number", "Year", "Registered"].join("\t"),
                ...rows.map((r) =>
                  [
                    r.name ?? "",
                    r.email ?? "",
                    r.rollNumber ?? "",
                    r.year ?? "",
                    new Date(r.registeredAt).toLocaleString("en-IN"),
                  ].join("\t"),
                ),
              ].join("\n");
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                // Clipboard access denied (an insecure origin, or a permission prompt
                // refused). The list is still on screen to read.
              }
            }}
          >
            {copied ? "Copied" : `Copy ${rows.length} row${rows.length === 1 ? "" : "s"}`}
          </Button>
        </>
      }
    >
      {attendees.loading ? (
        <Skeleton className="h-40" />
      ) : attendees.error ? (
        <ErrorNotice error={attendees.error} onRetry={attendees.reload} />
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-6 py-10 text-center text-xs text-muted">
          Nobody has registered yet.
        </p>
      ) : (
        <TableShell>
          <thead className="bg-card2 text-[0.65rem] tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-2.5 text-start">Name</th>
              <th className="px-4 py-2.5 text-start">Roll / year</th>
              <th className="px-4 py-2.5 text-start">Registered</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((person) => (
              <tr key={person.uid} className="border-t border-line">
                <td className="px-4 py-2.5">
                  <span className="block text-sm font-medium text-ink">{person.name ?? "—"}</span>
                  <span className="block text-xs text-muted">{person.email}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted">
                  {person.rollNumber ?? "—"}
                  {person.year ? ` · Year ${person.year}` : ""}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted">
                  {new Date(person.registeredAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </Modal>
  );
}
