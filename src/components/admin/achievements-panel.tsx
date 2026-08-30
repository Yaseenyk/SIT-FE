"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorNotice, Modal } from "@/components/ui/interactive";
import { Skeleton } from "@/components/ui/primitives";
import { achievements as achievementsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { formatDate } from "@/lib/utils";
import type { Achievement } from "@/types/api";
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

export function AchievementsPanel() {
  const achievements = useApi(() => achievementsApi.list(), []);
  const { notice, busy, run, clearNotice } = useActionState();

  const [draft, setDraft] = useState<{
    id: string | null;
    photoUrl: string | null;
    photoPublicId: string | null;
  } | null>(null);
  const [editing, setEditing] = useState<Achievement | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const data = new FormData(event.currentTarget);

    const body = {
      title: String(data.get("title") ?? ""),
      student: String(data.get("student") ?? ""),
      category: String(data.get("category") ?? ""),
      achievedOn: String(data.get("achievedOn") ?? "") || null,
      description: String(data.get("description") ?? ""),
      photoUrl: draft.photoUrl,
      photoPublicId: draft.photoPublicId,
    };

    const ok = await run(
      () => (draft.id ? achievementsApi.update(draft.id, body) : achievementsApi.create(body)),
      draft.id ? "Achievement updated" : "Achievement added",
    );
    if (ok) {
      setDraft(null);
      achievements.reload();
    }
  }

  return (
    <Panel
      title="Achievements"
      description="Competitions won, papers published, offers earned."
      action={
        <Button
          onClick={() => {
            setEditing(null);
            setDraft({ id: null, photoUrl: null, photoPublicId: null });
          }}
        >
          Add achievement
        </Button>
      }
    >
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      {achievements.loading ? (
        <Skeleton className="h-64" />
      ) : achievements.error ? (
        <ErrorNotice error={achievements.error} onRetry={achievements.reload} />
      ) : (
        <TableShell>
          <thead className="bg-card2 text-[0.65rem] tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 text-start">Title</th>
              <th className="px-4 py-3 text-start">Student</th>
              <th className="px-4 py-3 text-start">Category</th>
              <th className="px-4 py-3 text-start">Date</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(achievements.data ?? []).map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3 text-muted">{item.student}</td>
                <td className="px-4 py-3 text-muted">{item.category}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
                  {formatDate(item.achievedOn)}
                </td>
                <td className="px-4 py-3">
                  <span className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(item);
                        setDraft({ id: item.id, photoUrl: item.photoUrl, photoPublicId: null });
                      }}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      disabled={busy}
                      onConfirm={async () => {
                        const ok = await run(
                          () => achievementsApi.remove(item.id),
                          "Achievement deleted",
                        );
                        if (ok) achievements.reload();
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
        title={editing ? "Edit achievement" : "Add achievement"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button type="submit" form="achievement-form" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form id="achievement-form" onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" htmlFor="a-title" required>
            <input id="a-title" name="title" required defaultValue={editing?.title} className={FIELD} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student" htmlFor="a-student" required>
              <input
                id="a-student"
                name="student"
                required
                defaultValue={editing?.student}
                className={FIELD}
              />
            </Field>
            <Field label="Category" htmlFor="a-category">
              {/* The same four values the public filter offers. A free-text field here
                  produces categories no filter can reach. */}
              <select
                id="a-category"
                name="category"
                defaultValue={editing?.category ?? ""}
                className={FIELD}
              >
                <option value="">— none —</option>
                <option value="competition">Competition</option>
                <option value="research">Research</option>
                <option value="internship">Internship</option>
              </select>
            </Field>
          </div>

          <Field label="Date" htmlFor="a-date">
            <input
              id="a-date"
              name="achievedOn"
              type="date"
              defaultValue={editing?.achievedOn ?? ""}
              className={FIELD}
            />
          </Field>

          <Field label="Description" htmlFor="a-desc">
            <textarea
              id="a-desc"
              name="description"
              rows={3}
              defaultValue={editing?.description ?? ""}
              className={FIELD}
            />
          </Field>

          <Field label="Photo" htmlFor="a-photo">
            <ImagePicker
              folder="achievements"
              value={{ url: draft?.photoUrl ?? null, publicId: draft?.photoPublicId ?? null }}
              onChange={(next) =>
                setDraft((current) =>
                  current
                    ? { ...current, photoUrl: next.url, photoPublicId: next.publicId }
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
