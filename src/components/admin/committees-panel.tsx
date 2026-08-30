"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorNotice, Modal } from "@/components/ui/interactive";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { committees as committeesApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { Committee } from "@/types/api";
import {
  DeleteButton,
  FIELD,
  Field,
  Notice,
  Panel,
  TableShell,
  useActionState,
} from "./shared";

/** A slug from a name, matching the server's `^[a-z0-9][a-z0-9-]*$` rule. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CommitteesPanel() {
  const committees = useApi(() => committeesApi.list(), []);
  const { notice, busy, run, clearNotice } = useActionState();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Committee | null>(null);
  const [slug, setSlug] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const body = {
      id: editing ? editing.id : slug,
      name: String(data.get("name") ?? ""),
      type: String(data.get("type") ?? "functional"),
      icon: String(data.get("icon") ?? ""),
      gradient: String(data.get("gradient") ?? ""),
      sizeLabel: String(data.get("sizeLabel") ?? ""),
      badge: String(data.get("badge") ?? ""),
      coordLabel: String(data.get("coordLabel") ?? ""),
      coordinator: String(data.get("coordinator") ?? ""),
      coordinatorSub: String(data.get("coordinatorSub") ?? ""),
      coordinatorPhoto: editing?.coordinatorPhoto ?? null,
      coordinatorPhotoId: null,
      coord2Label: String(data.get("coord2Label") ?? ""),
      coordinator2: String(data.get("coordinator2") ?? ""),
      coordinator2Photo: editing?.coordinator2Photo ?? null,
      coordinator2PhotoId: null,
      // One bullet per line — the shape the textarea already has, so no separate
      // repeatable-row UI is needed for a list that is edited a few times a year.
      responsibilities: String(data.get("responsibilities") ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    };

    const ok = await run(
      () => (editing ? committeesApi.update(editing.id, body) : committeesApi.create(body)),
      editing ? "Committee updated" : "Committee created",
    );
    if (ok) {
      setOpen(false);
      setEditing(null);
      setSlug("");
      committees.reload();
    }
  }

  const list = committees.data ?? [];

  return (
    <Panel
      title="Committees"
      description="The structure of the association. Order here is the order on the site."
      action={
        <Button
          onClick={() => {
            setEditing(null);
            setSlug("");
            setOpen(true);
          }}
        >
          Add committee
        </Button>
      }
    >
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      {committees.loading ? (
        <Skeleton className="h-64" />
      ) : committees.error ? (
        <ErrorNotice error={committees.error} onRetry={committees.reload} />
      ) : (
        <TableShell>
          <thead className="bg-sunken text-[0.65rem] tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 text-start">Committee</th>
              <th className="px-4 py-3 text-start">Type</th>
              <th className="px-4 py-3 text-start">Members</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((committee, index) => (
              <tr key={committee.id} className="border-t border-rule">
                <td className="px-4 py-3">
                  <span aria-hidden className="me-2">
                    {committee.icon}
                  </span>
                  {committee.name}
                  <span className="ms-2 font-mono text-[0.65rem] text-muted">
                    #{committee.id}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={committee.type === "executive" ? "gold" : "navy"}>
                    {committee.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">{committee.memberCount}</td>
                <td className="px-4 py-3">
                  <span className="flex justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Move ${committee.name} up`}
                      disabled={busy || index === 0}
                      onClick={async () => {
                        const ok = await run(
                          () => committeesApi.move(committee.id, "up"),"Order updated",
                        );
                        if (ok) committees.reload();
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Move ${committee.name} down`}
                      disabled={busy || index === list.length - 1}
                      onClick={async () => {
                        const ok = await run(
                          () => committeesApi.move(committee.id, "down"),"Order updated",
                        );
                        if (ok) committees.reload();
                      }}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(committee);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      disabled={busy}
                      onConfirm={async () => {
                        const ok = await run(
                          () => committeesApi.remove(committee.id),
                          `${committee.name} deleted — its members are now unassigned`,
                        );
                        if (ok) committees.reload();
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
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add committee"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="committee-form" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form id="committee-form" onSubmit={onSubmit} className="space-y-4">
          <Field label="Name" htmlFor="c-name" required>
            <input
              id="c-name"
              name="name"
              required
              defaultValue={editing?.name}
              onChange={(event) => {
                // Only while creating: the id is the public URL fragment and the server
                // rejects a change to it, so an edit must not silently retype it.
                if (!editing) setSlug(slugify(event.target.value));
              }}
              className={FIELD}
            />
          </Field>

          <Field
            label="URL id"
            htmlFor="c-id"
            required
            hint={
              editing
                ? "Fixed once created — the public site links to #committee-<id>."
                : "Lowercase letters, numbers and hyphens."
            }
          >
            <input
              id="c-id"
              value={editing ? editing.id : slug}
              onChange={(event) => setSlug(slugify(event.target.value))}
              disabled={editing !== null}
              required
              className={FIELD}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type" htmlFor="c-type" required>
              <select id="c-type" name="type" defaultValue={editing?.type ?? "functional"} className={FIELD}>
                <option value="executive">Executive</option>
                <option value="functional">Functional</option>
                <option value="advisory">Advisory</option>
              </select>
            </Field>
            <Field label="Icon" htmlFor="c-icon">
              <input id="c-icon" name="icon" defaultValue={editing?.icon ?? ""} placeholder="⚙️" className={FIELD} />
            </Field>
            <Field label="Size label" htmlFor="c-size">
              <input
                id="c-size"
                name="sizeLabel"
                defaultValue={editing?.sizeLabel ?? ""}
                placeholder="4-6 students"
                className={FIELD}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Badge" htmlFor="c-badge">
              <input id="c-badge" name="badge" defaultValue={editing?.badge ?? ""} className={FIELD} />
            </Field>
            <Field label="Gradient" htmlFor="c-gradient" hint="A CSS gradient for the icon tile.">
              <input
                id="c-gradient"
                name="gradient"
                defaultValue={editing?.gradient ?? ""}
                placeholder="linear-gradient(135deg,#0c4a6e,#0369a1)"
                className={FIELD}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Coordinator label" htmlFor="c-clabel">
              <input id="c-clabel" name="coordLabel" defaultValue={editing?.coordLabel ?? ""} className={FIELD} />
            </Field>
            <Field label="Coordinator" htmlFor="c-coord">
              <input id="c-coord" name="coordinator" defaultValue={editing?.coordinator ?? ""} className={FIELD} />
            </Field>
            <Field label="Coordinator subtitle" htmlFor="c-csub">
              <input
                id="c-csub"
                name="coordinatorSub"
                defaultValue={editing?.coordinatorSub ?? ""}
                className={FIELD}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Second coordinator label" htmlFor="c-c2label">
              <input
                id="c-c2label"
                name="coord2Label"
                defaultValue={editing?.coord2Label ?? ""}
                className={FIELD}
              />
            </Field>
            <Field label="Second coordinator" htmlFor="c-coord2">
              <input
                id="c-coord2"
                name="coordinator2"
                defaultValue={editing?.coordinator2 ?? ""}
                className={FIELD}
              />
            </Field>
          </div>

          <Field label="Responsibilities" htmlFor="c-resp" hint="One per line.">
            <textarea
              id="c-resp"
              name="responsibilities"
              rows={7}
              defaultValue={(editing?.responsibilities ?? []).join("\n")}
              className={FIELD}
            />
          </Field>
        </form>
      </Modal>
    </Panel>
  );
}
