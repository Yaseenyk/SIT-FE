"use client";

import { useState, type FormEvent } from "react";
import { SectionHeading } from "@/components/ui/primitives";
import { Button } from "@/components/ui/interactive";
import { ApiError } from "@/lib/api/client";
import { messages } from "@/lib/api/endpoints";
import { useSettings } from "@/lib/settings-context";
import { mapsHref, telHref } from "@/lib/utils";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "failed"; message: string };

const FIELD =
  "w-full rounded border border-rule bg-page px-3 py-2.5 text-sm text-ink " +
  "placeholder:text-muted/70 transition-colors focus:border-navy2 focus:outline-none";

export function Contact() {
  const { settings } = useSettings();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus({ kind: "sending" });
    try {
      await messages.send({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        subject: String(data.get("subject") ?? ""),
        message: String(data.get("message") ?? ""),
        // The honeypot. Hidden from people, filled by naive bots; the server discards any
        // submission that has it set, and answers 202 either way.
        website: String(data.get("website") ?? ""),
      });
      form.reset();
      setStatus({ kind: "sent" });
    } catch (error) {
      setStatus({
        kind: "failed",
        message:
          error instanceof ApiError ? error.message : "Could not send that. Please try again.",
      });
    }
  }

  const sending = status.kind === "sending";

  return (
    <section id="contact" className="border-b border-rule bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Get in touch"
          title="Contact the association"
          description="For questions about joining, collaborating on an event, or inviting the association to participate, write to us using the form below."
        />

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Address block first — the convention on an institutional contact page. */}
          <div className="space-y-4 lg:col-span-2">
            <div className="card p-6">
              <h3 className="font-serif text-base font-bold text-ink">Association office</h3>
              <dl className="mt-4 space-y-4 text-sm">
                {settings?.address ? (
                  <div>
                    <dt className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase">
                      Address
                    </dt>
                    <dd className="mt-1 leading-relaxed text-ink">
                      <a
                        href={mapsHref(settings.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-navy2 hover:underline"
                      >
                        {settings.address}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {settings?.email ? (
                  <div>
                    <dt className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase">
                      Email
                    </dt>
                    <dd className="mt-1 break-all text-ink">
                      <a href={`mailto:${settings.email}`} className="hover:text-navy2 hover:underline">
                        {settings.email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {settings?.phone ? (
                  <div>
                    <dt className="text-[0.7rem] font-semibold tracking-[0.12em] text-muted uppercase">
                      Telephone
                    </dt>
                    <dd className="mt-1 text-ink">
                      <a href={telHref(settings.phone)} className="hover:text-navy2 hover:underline">
                        {settings.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>

              {settings?.linkedin || settings?.instagram ? (
                <div className="mt-5 flex gap-2 border-t border-rule pt-4">
                  {settings.linkedin ? (
                    <a
                      href={settings.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-rule-strong px-3 py-1.5 text-xs font-semibold text-navy2 hover:bg-navy-tint"
                    >
                      LinkedIn
                    </a>
                  ) : null}
                  {settings.instagram ? (
                    <a
                      href={settings.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-rule-strong px-3 py-1.5 text-xs font-semibold text-navy2 hover:bg-navy-tint"
                    >
                      Instagram
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="card p-6 lg:col-span-3 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-1.5 block text-sm font-semibold text-ink">
                    Name <span className="text-red">*</span>
                  </label>
                  <input id="c-name" name="name" required maxLength={160} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="c-email" className="mb-1.5 block text-sm font-semibold text-ink">
                    Email <span className="text-red">*</span>
                  </label>
                  <input
                    id="c-email"
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    className={FIELD}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="c-subject" className="mb-1.5 block text-sm font-semibold text-ink">
                  Subject
                </label>
                <input id="c-subject" name="subject" maxLength={200} className={FIELD} />
              </div>

              <div>
                <label htmlFor="c-message" className="mb-1.5 block text-sm font-semibold text-ink">
                  Message <span className="text-red">*</span>
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  required
                  rows={6}
                  maxLength={5000}
                  className={FIELD}
                />
              </div>

              {/*
                The honeypot. Hidden with inline styles rather than `hidden` or a utility
                class: `display:none` on an input is the pattern bots specifically skip,
                and a class name Tailwind might purge would expose the field to real users.
                aria-hidden + tabIndex keeps it out of the tab order and screen readers.
              */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px" }}
              />

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Button type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Send message"}
                </Button>

                {/* role=status so the outcome is announced, not just shown. */}
                <p role="status" className="text-sm">
                  {status.kind === "sent" ? (
                    <span className="text-green">Thank you — we will reply shortly.</span>
                  ) : status.kind === "failed" ? (
                    <span className="text-red">{status.message}</span>
                  ) : null}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
