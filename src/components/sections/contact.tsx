"use client";

import { useState, type FormEvent } from "react";
import { NeuronCanvas } from "@/components/core/neuron-canvas";
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
  "w-full rounded-xl border border-line bg-bg/70 px-4 py-3 text-sm text-ink " +
  "placeholder:text-muted/60 transition-colors focus:border-sky focus:bg-bg focus:outline-none";

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
        // The honeypot. Hidden from people, filled by naive bots; the server discards
        // any submission that has it set, and answers 202 either way.
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

  const details = [
    settings?.email
      ? { label: "Email", value: settings.email, href: `mailto:${settings.email}`, icon: "✉" }
      : null,
    settings?.phone
      ? { label: "Phone", value: settings.phone, href: telHref(settings.phone), icon: "☎" }
      : null,
    settings?.address
      ? {
          label: "Address",
          value: settings.address,
          href: mapsHref(settings.address),
          icon: "◎",
        }
      : null,
  ].filter((detail) => detail !== null);

  return (
    <section id="contact" className="edge-top relative overflow-hidden py-24 sm:py-32">
      {/* The one section besides the hero that keeps the particle field. It closes the
          page the way the hero opened it; on every section in between it was just noise. */}
      <NeuronCanvas density={40} />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Say hello"
          title="Get in"
          accent="Touch"
          description="Questions about joining, collaborating, or running an event with us? Send a message and we will get back to you."
          align="center"
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            {details.map((detail) => (
              <a
                key={detail.label}
                href={detail.href}
                target={detail.label === "Address" ? "_blank" : undefined}
                rel={detail.label === "Address" ? "noopener noreferrer" : undefined}
                className="card-surface group flex items-start gap-4 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line2 hover:glow-sky"
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line2 bg-bg/60 text-sky"
                >
                  {detail.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[0.65rem] tracking-[0.15em] text-muted uppercase">
                    {detail.label}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed break-words">
                    {detail.value}
                  </span>
                </span>
              </a>
            ))}

            {settings?.linkedin || settings?.instagram ? (
              <div className="flex gap-3 pt-2">
                {settings.linkedin ? (
                  <a
                    href={settings.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl border border-line bg-card/50 px-4 py-3 text-center text-xs font-semibold text-sky transition-colors hover:bg-sky/10"
                  >
                    LinkedIn
                  </a>
                ) : null}
                {settings.instagram ? (
                  <a
                    href={settings.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl border border-line bg-card/50 px-4 py-3 text-center text-xs font-semibold text-sky transition-colors hover:bg-sky/10"
                  >
                    Instagram
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="card-surface p-7 sm:p-8 lg:col-span-3">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="mb-2 block text-xs font-semibold">
                    Name <span className="text-rose">*</span>
                  </label>
                  <input id="c-name" name="name" required maxLength={160} className={FIELD} />
                </div>
                <div>
                  <label htmlFor="c-email" className="mb-2 block text-xs font-semibold">
                    Email <span className="text-rose">*</span>
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
                <label htmlFor="c-subject" className="mb-2 block text-xs font-semibold">
                  Subject
                </label>
                <input id="c-subject" name="subject" maxLength={200} className={FIELD} />
              </div>

              <div>
                <label htmlFor="c-message" className="mb-2 block text-xs font-semibold">
                  Message <span className="text-rose">*</span>
                </label>
                <textarea
                  id="c-message"
                  name="message"
                  required
                  rows={5}
                  maxLength={5000}
                  className={FIELD}
                />
              </div>

              {/*
                The honeypot. Hidden with inline styles rather than `hidden` or a utility
                class: `display:none` on an input is the pattern bots specifically skip,
                and a class name Tailwind might purge would expose the field to real users.
                aria-hidden + tabIndex keeps it away from screen readers and the tab order.
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
                <p role="status" className="text-xs">
                  {status.kind === "sent" ? (
                    <span className="text-emerald">
                      Thanks — we will get back to you soon.
                    </span>
                  ) : status.kind === "failed" ? (
                    <span className="text-rose">{status.message}</span>
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
