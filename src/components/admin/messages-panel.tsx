"use client";

import { Button, ErrorNotice } from "@/components/ui/interactive";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { messages as messagesApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { gmailComposeUrl, timeAgo } from "@/lib/utils";
import { DeleteButton, Notice, Panel, useActionState } from "./shared";

export function MessagesPanel() {
  const inbox = useApi(() => messagesApi.list(), []);
  const { notice, busy, run, clearNotice } = useActionState();

  return (
    <Panel title="Inbox" description="Messages sent through the contact form.">
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      {inbox.loading ? (
        <Skeleton className="h-64" />
      ) : inbox.error ? (
        <ErrorNotice error={inbox.error} onRetry={inbox.reload} />
      ) : (inbox.data ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-xs text-muted">
          No messages yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {(inbox.data ?? []).map((message) => (
            <li
              key={message.id}
              className={`card p-5 ${message.read ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {message.name}
                    {!message.read ? <Badge tone="green">New</Badge> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    <a href={`mailto:${message.email}`} className="hover:text-sky">
                      {message.email}
                    </a>
                    {" · "}
                    {timeAgo(message.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/*
                    Replying opens Gmail's compose window pre-filled rather than a mailto:
                    link. mailto: needs a configured desktop mail client, which most phones
                    and lab machines do not have — the reply button would simply do nothing.
                  */}
                  <a
                    href={gmailComposeUrl(
                      message.email,
                      `Re: ${message.subject || "your message to AISA"}`,
                      `\n\n---\nOn ${new Date(message.createdAt).toLocaleString("en-IN")} you wrote:\n${message.body}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-line2 px-3 py-1.5 text-xs text-sky hover:bg-sky2/10"
                  >
                    Reply
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={async () => {
                      const ok = await run(
                        () => messagesApi.markRead(message.id, !message.read),
                        message.read ? "Marked unread" : "Marked read",
                      );
                      if (ok) inbox.reload();
                    }}
                  >
                    {message.read ? "Mark unread" : "Mark read"}
                  </Button>
                  <DeleteButton
                    disabled={busy}
                    onConfirm={async () => {
                      const ok = await run(
                        () => messagesApi.remove(message.id),"Message deleted",
                      );
                      if (ok) inbox.reload();
                    }}
                  />
                </div>
              </div>

              {message.subject ? (
                <p className="mt-3 text-xs font-semibold text-sky">{message.subject}</p>
              ) : null}
              {/* whitespace-pre-wrap: the message is stored exactly as typed, so the
                  paragraph breaks the sender made should survive to the screen. */}
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">
                {message.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
