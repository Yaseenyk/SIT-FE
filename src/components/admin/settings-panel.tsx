"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorNotice } from "@/components/ui/interactive";
import { Skeleton } from "@/components/ui/primitives";
import { settings as settingsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { useAuth } from "@/lib/auth/context";
import { auth as authApi } from "@/lib/api/endpoints";
import { setAuthToken } from "@/lib/api/client";
import { FIELD, Field, Notice, Panel, useActionState } from "./shared";

export function SettingsPanel() {
  const data = useApi(() => settingsApi.getForAdmin(), []);
  const { notice, busy, run, clearNotice } = useActionState();

  const current = data.data?.publicSettings;
  const features = current?.features ?? [];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "");

    const ok = await run(
      () =>
        settingsApi.update({
          phone: value("phone"),
          email: value("email"),
          address: value("address"),
          website: value("website"),
          linkedin: value("linkedin"),
          instagram: value("instagram"),
          notificationEmail: value("notificationEmail"),
          aboutTitle: value("aboutTitle"),
          aboutDescription: value("aboutDescription"),
          feature1Title: value("feature1Title"),
          feature1Description: value("feature1Description"),
          feature2Title: value("feature2Title"),
          feature2Description: value("feature2Description"),
          feature3Title: value("feature3Title"),
          feature3Description: value("feature3Description"),
          feature4Title: value("feature4Title"),
          feature4Description: value("feature4Description"),
        }),"Settings saved — every page picks this up on next load",
    );
    if (ok) data.reload();
  }

  if (data.loading) return <Skeleton className="h-96" />;
  if (data.error) return <ErrorNotice error={data.error} onRetry={data.reload} />;

  return (
    <Panel title="Site settings" description="Contact details and the About copy.">
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="mb-2 font-serif text-xs font-bold tracking-wider text-navy2 uppercase">
            Contact
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="s-phone">
              <input id="s-phone" name="phone" defaultValue={current?.phone ?? ""} className={FIELD} />
            </Field>
            <Field label="Public email" htmlFor="s-email">
              <input
                id="s-email"
                name="email"
                type="email"
                defaultValue={current?.email ?? ""}
                className={FIELD}
              />
            </Field>
          </div>
          <Field label="Address" htmlFor="s-address">
            <textarea
              id="s-address"
              name="address"
              rows={2}
              defaultValue={current?.address ?? ""}
              className={FIELD}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Website" htmlFor="s-website">
              <input id="s-website" name="website" defaultValue={current?.website ?? ""} className={FIELD} />
            </Field>
            <Field label="LinkedIn" htmlFor="s-linkedin">
              <input id="s-linkedin" name="linkedin" defaultValue={current?.linkedin ?? ""} className={FIELD} />
            </Field>
            <Field label="Instagram" htmlFor="s-instagram">
              <input
                id="s-instagram"
                name="instagram"
                defaultValue={current?.instagram ?? ""}
                className={FIELD}
              />
            </Field>
          </div>
          <Field
            label="Notification email"
            htmlFor="s-notify"
            hint="Admin-only. Never published on the public site."
          >
            <input
              id="s-notify"
              name="notificationEmail"
              type="email"
              defaultValue={data.data?.notificationEmail ?? ""}
              className={FIELD}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-2 font-serif text-xs font-bold tracking-wider text-navy2 uppercase">
            About section
          </legend>
          <Field label="Heading" htmlFor="s-about-title">
            <input
              id="s-about-title"
              name="aboutTitle"
              defaultValue={current?.aboutTitle ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Description" htmlFor="s-about-desc">
            <textarea
              id="s-about-desc"
              name="aboutDescription"
              rows={3}
              defaultValue={current?.aboutDescription ?? ""}
              className={FIELD}
            />
          </Field>

          {/* Four fixed blurbs, matching feature1..feature4 on the API. A repeatable list
              would need a schema change; four is what the design has room for. */}
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="grid gap-4 sm:grid-cols-3">
              <Field label={`Feature ${index + 1} title`} htmlFor={`s-f${index}-t`}>
                <input
                  id={`s-f${index}-t`}
                  name={`feature${index + 1}Title`}
                  defaultValue={features[index]?.title ?? ""}
                  className={FIELD}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label={`Feature ${index + 1} description`} htmlFor={`s-f${index}-d`}>
                  <input
                    id={`s-f${index}-d`}
                    name={`feature${index + 1}Description`}
                    defaultValue={features[index]?.description ?? ""}
                    className={FIELD}
                  />
                </Field>
              </div>
            </div>
          ))}
        </fieldset>

        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Panel>
  );
}

/** The announcement bar, and the admin's own credentials. */
export function AccountPanel() {
  const { setUsername, signOut } = useAuth();
  const data = useApi(() => settingsApi.get(), []);
  const announcement = useActionState();
  const credentials = useActionState();
  const [text, setText] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  return (
    <div className="space-y-12">
      <Panel title="Announcement bar" description="A strip across the top of every page.">
        {announcement.notice ? (
          <Notice tone={announcement.notice.tone} onDismiss={announcement.clearNotice}>
            {announcement.notice.text}
          </Notice>
        ) : null}

        {data.data?.announcement ? (
          <p className="mb-4 rounded-lg border border-rule bg-sunken px-4 py-2.5 text-xs">
            Live now: <span className="text-navy2">{data.data.announcement.text}</span>
          </p>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await announcement.run(
              () =>
                settingsApi.setAnnouncement(
                  text,
                  // datetime-local has no timezone; the browser's own offset is what the
                  // admin meant, so let Date apply it before sending an instant.
                  expiresAt ? new Date(expiresAt).toISOString() : null,
                ),"Announcement published",
            );
            if (ok) {
              setText("");
              setExpiresAt("");
              data.reload();
            }
          }}
        >
          <Field label="Message" htmlFor="an-text" required>
            <input
              id="an-text"
              required
              maxLength={500}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className={FIELD}
            />
          </Field>
          <Field label="Expires" htmlFor="an-expiry" hint="Leave blank to run until removed.">
            <input
              id="an-expiry"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className={FIELD}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={announcement.busy}>
              Publish
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={announcement.busy || !data.data?.announcement}
              onClick={async () => {
                const ok = await announcement.run(
                  () => settingsApi.clearAnnouncement(),"Announcement taken down",
                );
                if (ok) data.reload();
              }}
            >
              Take down
            </Button>
          </div>
        </form>
      </Panel>

      <Panel title="Your account">
        {credentials.notice ? (
          <Notice tone={credentials.notice.tone} onDismiss={credentials.clearNotice}>
            {credentials.notice.text}
          </Notice>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-2">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const ok = await credentials.run(
                () =>
                  authApi.changePassword(
                    String(form.get("currentPassword") ?? ""),
                    String(form.get("newPassword") ?? ""),
                  ),"Password changed",
              );
              if (ok) event.currentTarget?.reset();
            }}
          >
            <h3 className="font-serif text-xs font-bold tracking-wider text-navy2 uppercase">
              Change password
            </h3>
            <Field label="Current password" htmlFor="cp-current" required>
              <input
                id="cp-current"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className={FIELD}
              />
            </Field>
            <Field label="New password" htmlFor="cp-new" required hint="At least 10 characters.">
              <input
                id="cp-new"
                name="newPassword"
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                className={FIELD}
              />
            </Field>
            <Button type="submit" disabled={credentials.busy}>
              Change password
            </Button>
          </form>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const ok = await credentials.run(async () => {
                const response = await authApi.changeUsername(
                  String(form.get("currentPassword") ?? ""),
                  String(form.get("newUsername") ?? ""),
                );
                // The server reissues the token because the old one still names the old
                // username in its claims. Store it, or the next request signs us out.
                setAuthToken(response.token);
                setUsername(response.username);
              }, "Username changed");
              if (ok) event.currentTarget?.reset();
            }}
          >
            <h3 className="font-serif text-xs font-bold tracking-wider text-navy2 uppercase">
              Change username
            </h3>
            <Field label="Password" htmlFor="cu-current" required>
              <input
                id="cu-current"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                className={FIELD}
              />
            </Field>
            <Field label="New username" htmlFor="cu-new" required>
              <input id="cu-new" name="newUsername" required minLength={3} className={FIELD} />
            </Field>
            <Button type="submit" disabled={credentials.busy}>
              Change username
            </Button>
          </form>
        </div>

        <div className="mt-8 border-t border-rule pt-6">
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </Panel>
    </div>
  );
}
