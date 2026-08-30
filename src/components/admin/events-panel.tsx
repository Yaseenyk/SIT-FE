"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorNotice, Modal } from "@/components/ui/interactive";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { events as eventsApi } from "@/lib/api/endpoints";
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
                  <Badge tone={item.status === "upcoming" ? "emerald" : "muted"}>
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="flex justify-end gap-2">
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
