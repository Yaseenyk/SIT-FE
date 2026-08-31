"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorNotice, Modal } from "@/components/ui/interactive";
import { Skeleton } from "@/components/ui/primitives";
import { committees as committeesApi, members as membersApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { AdminMember } from "@/types/api";
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

type Draft = {
  id: string | null;
  photoUrl: string | null;
  photoPublicId: string | null;
};

export function MembersPanel() {
  // The admin route, not the public one: this panel edits phone and email, and the
  // public listing deliberately carries neither.
  const members = useApi(() => membersApi.listForAdmin(), []);
  const committees = useApi(() => committeesApi.list(), []);
  const { notice, busy, run, clearNotice } = useActionState();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<AdminMember | null>(null);

  function openNew() {
    setEditing(null);
    setDraft({ id: null, photoUrl: null, photoPublicId: null });
  }

  function openEdit(member: AdminMember) {
    setEditing(member);
    // photoPublicId is not on the response DTO (it is an admin-only storage detail), so
    // an edit that does not touch the photo sends null and the server keeps what it has.
    setDraft({ id: member.id, photoUrl: member.photoUrl, photoPublicId: null });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const data = new FormData(event.currentTarget);

    const body = {
      name: String(data.get("name") ?? ""),
      role: String(data.get("role") ?? ""),
      committeeId: String(data.get("committeeId") ?? "") || null,
      academicYear: String(data.get("academicYear") ?? ""),
      linkedinUrl: String(data.get("linkedinUrl") ?? ""),
      githubUrl: String(data.get("githubUrl") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      photoUrl: draft.photoUrl,
      photoPublicId: draft.photoPublicId,
    };

    const ok = await run(
      () => (draft.id ? membersApi.update(draft.id, body) : membersApi.create(body)),
      draft.id ? "AdminMember updated" : "AdminMember added",
    );
    if (ok) {
      setDraft(null);
      members.reload();
    }
  }

  return (
    <Panel
      title="Members"
      description="Student office-bearers shown in the Structure section."
      action={<Button onClick={openNew}>Add member</Button>}
    >
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      {members.loading ? (
        <Skeleton className="h-64" />
      ) : members.error ? (
        <ErrorNotice error={members.error} onRetry={members.reload} />
      ) : (
        <TableShell>
          <thead className="bg-card2 text-[0.65rem] tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 text-start">Name</th>
              <th className="px-4 py-3 text-start">Role</th>
              <th className="px-4 py-3 text-start">Committee</th>
              <th className="px-4 py-3 text-start">Year</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(members.data ?? []).map((member) => (
              <tr key={member.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2.5">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt="" className="size-8 rounded-full object-cover" />
                    ) : null}
                    {member.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{member.role}</td>
                <td className="px-4 py-3 text-muted">
                  {/* An unassigned member is the visible consequence of deleting a
                      committee, and it must be obvious rather than an empty cell. */}
                  {member.committeeName ?? <span className="text-sky">Unassigned</span>}
                </td>
                <td className="px-4 py-3 text-muted">{member.academicYear}</td>
                <td className="px-4 py-3">
                  <span className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(member)}>
                      Edit
                    </Button>
                    <DeleteButton
                      disabled={busy}
                      onConfirm={async () => {
                        const ok = await run(
                          () => membersApi.remove(member.id),
                          `${member.name} removed`,
                        );
                        if (ok) members.reload();
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
        title={editing ? `Edit ${editing.name}` : "Add member"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            {/* The form is in the modal body and this button is in its footer, so they
                are linked by form= rather than by nesting. */}
            <Button type="submit" form="member-form" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form id="member-form" onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="m-name" required>
              <input id="m-name" name="name" required defaultValue={editing?.name} className={FIELD} />
            </Field>
            <Field label="Role" htmlFor="m-role" required>
              <input id="m-role" name="role" required defaultValue={editing?.role} className={FIELD} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Committee" htmlFor="m-committee">
              <select
                id="m-committee"
                name="committeeId"
                defaultValue={editing?.committeeId ?? ""}
                className={FIELD}
              >
                <option value="">— none —</option>
                {(committees.data ?? []).map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {committee.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Academic year" htmlFor="m-year">
              <input
                id="m-year"
                name="academicYear"
                defaultValue={editing?.academicYear ?? ""}
                placeholder="3rd Year"
                className={FIELD}
              />
            </Field>
          </div>

          <Field label="Email" htmlFor="m-email">
            <input
              id="m-email"
              name="email"
              type="email"
              defaultValue={editing?.email ?? ""}
              className={FIELD}
            />
          </Field>

          <Field
            label="Mobile number"
            htmlFor="m-phone"
            hint="Never shown on the public site — dashboard only."
          >
            <input
              id="m-phone"
              name="phone"
              inputMode="tel"
              defaultValue={editing?.phone ?? ""}
              className={FIELD}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedIn URL" htmlFor="m-linkedin">
              <input
                id="m-linkedin"
                name="linkedinUrl"
                type="url"
                defaultValue={editing?.linkedinUrl ?? ""}
                className={FIELD}
              />
            </Field>
            <Field label="GitHub URL" htmlFor="m-github">
              <input
                id="m-github"
                name="githubUrl"
                type="url"
                defaultValue={editing?.githubUrl ?? ""}
                className={FIELD}
              />
            </Field>
          </div>

          <Field label="Photo" htmlFor="m-photo" hint="Uploaded straight to Cloudinary.">
            <ImagePicker
              folder="members"
              value={{ url: draft?.photoUrl ?? null, publicId: draft?.photoPublicId ?? null }}
              onChange={(next) =>
                setDraft((current) =>
                  current ? { ...current, photoUrl: next.url, photoPublicId: next.publicId } : current,
                )
              }
            />
          </Field>
        </form>
      </Modal>
    </Panel>
  );
}
