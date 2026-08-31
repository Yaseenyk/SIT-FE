"use client";

import { useMemo, useState } from "react";
import { Button, ErrorNotice } from "@/components/ui/interactive";
import { Avatar, Badge, Skeleton } from "@/components/ui/primitives";
import { users as usersApi } from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/context";
import { useApi } from "@/lib/hooks/use-api";
import type { UserSummary } from "@/types/api";
import { DeleteButton, Notice, Panel, TableShell, useActionState } from "./shared";

/**
 * Every account, and the two things an admin can do to one: change its role, or suspend it.
 *
 * <h2>This panel is the ONLY way to become an admin</h2>
 *
 * <p>Signing up always produces a student — the server assigns the role and ignores
 * anything the client sends. So promotion happens here, deliberately: it is an
 * authenticated action by someone who already has the power, rather than a field on a
 * public form.
 *
 * <p>The server refuses to demote or suspend the last remaining admin, and refuses to let
 * anyone change their own role. Both are enforced there rather than here — this panel just
 * hides the buttons so the admin does not have to discover the rule by hitting it.
 */
export function UsersPanel() {
  const { me } = useAuth();
  const accounts = useApi(() => usersApi.list(), []);
  const { notice, busy, run, clearNotice } = useActionState();
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const all = accounts.data ?? [];
    const needle = filter.trim().toLowerCase();
    if (!needle) return all;
    return all.filter((user) =>
      [user.name, user.email, user.rollNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [accounts.data, filter]);

  const adminCount = (accounts.data ?? []).filter((u) => u.role === "ADMIN").length;

  return (
    <Panel
      title="Accounts"
      description="Students who have signed up, and who among them can administer the site."
    >
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search by name, email or roll number"
          aria-label="Search accounts"
          className="w-full max-w-sm rounded-lg border border-line bg-bg2 px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted">
          {(accounts.data ?? []).length} account
          {(accounts.data ?? []).length === 1 ? "" : "s"} · {adminCount} admin
          {adminCount === 1 ? "" : "s"}
        </p>
      </div>

      {accounts.loading ? (
        <Skeleton className="h-64" />
      ) : accounts.error ? (
        <ErrorNotice error={accounts.error} onRetry={accounts.reload} />
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-xs text-muted">
          {filter ? "No account matches that search." : "Nobody has signed up yet."}
        </p>
      ) : (
        <TableShell>
          <thead className="bg-card2 text-[0.65rem] tracking-wider text-muted uppercase">
            <tr>
              <th className="px-4 py-3 text-start">Person</th>
              <th className="px-4 py-3 text-start">Year / roll</th>
              <th className="px-4 py-3 text-start">Role</th>
              <th className="px-4 py-3 text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <UserRow
                key={user.uid}
                user={user}
                isSelf={user.uid === me?.uid}
                lastAdmin={user.role === "ADMIN" && adminCount <= 1}
                busy={busy}
                onAction={run}
                onDone={accounts.reload}
              />
            ))}
          </tbody>
        </TableShell>
      )}
    </Panel>
  );
}

function UserRow({
  user,
  isSelf,
  lastAdmin,
  busy,
  onAction,
  onDone,
}: {
  user: UserSummary;
  isSelf: boolean;
  lastAdmin: boolean;
  busy: boolean;
  onAction: (fn: () => Promise<unknown>, success: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const suspended = user.status === "SUSPENDED";
  // Both guards exist on the server too. Hiding the buttons only saves the admin from
  // discovering the rule by being refused.
  const locked = isSelf || lastAdmin;

  return (
    <tr className={`border-t border-line ${suspended ? "opacity-60" : ""}`}>
      <td className="px-4 py-3">
        <span className="flex items-center gap-3">
          <Avatar src={user.photoUrl} name={user.name ?? user.email ?? "?"} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-ink">
              {user.name ?? "—"}
              {isSelf ? <span className="ms-2 text-xs font-normal text-muted">(you)</span> : null}
            </span>
            <span className="block truncate text-xs text-muted">{user.email}</span>
          </span>
        </span>
      </td>

      <td className="px-4 py-3 text-xs text-muted">
        {user.year ? `Year ${user.year}` : "—"}
        {user.rollNumber ? ` · ${user.rollNumber}` : ""}
      </td>

      <td className="px-4 py-3">
        <span className="flex flex-wrap gap-1.5">
          <Badge tone={user.role === "ADMIN" ? "navy" : "muted"}>
            {user.role === "ADMIN" ? "Admin" : "Student"}
          </Badge>
          {suspended ? <Badge tone="red">Suspended</Badge> : null}
        </span>
      </td>

      <td className="px-4 py-3">
        <span className="flex justify-end gap-2">
          {locked ? (
            <span className="self-center text-xs text-muted">
              {isSelf ? "Cannot change your own role" : "Only admin"}
            </span>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  const next = user.role === "ADMIN" ? "STUDENT" : "ADMIN";
                  const ok = await onAction(
                    () => usersApi.update(user.uid, { role: next }),
                    next === "ADMIN"
                      ? `${user.name ?? user.email} is now an administrator`
                      : `${user.name ?? user.email} is now a student`,
                  );
                  if (ok) onDone();
                }}
              >
                {user.role === "ADMIN" ? "Make student" : "Make admin"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={async () => {
                  const next = suspended ? "ACTIVE" : "SUSPENDED";
                  const ok = await onAction(
                    () => usersApi.update(user.uid, { status: next }),
                    suspended ? "Account restored" : "Account suspended",
                  );
                  if (ok) onDone();
                }}
              >
                {suspended ? "Restore" : "Suspend"}
              </Button>

              <DeleteButton
                disabled={busy}
                onConfirm={async () => {
                  const ok = await onAction(
                    () => usersApi.remove(user.uid),
                    "Account deleted",
                  );
                  if (ok) onDone();
                }}
              />
            </>
          )}
        </span>
      </td>
    </tr>
  );
}
