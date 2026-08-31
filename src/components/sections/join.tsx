"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/primitives";
import {
  applications as applicationsApi,
  committees as committeesApi,
  members as membersApi,
} from "@/lib/api/endpoints";
import { useAuth } from "@/lib/auth/context";
import { useApi } from "@/lib/hooks/use-api";
import { useReveal } from "@/lib/hooks/use-reveal";

/**
 * How a student joins, and which posts are currently open.
 *
 * <p>Added because the site answered every question except the one a student visiting it
 * actually has. The open-position list is derived from real data — committees that no
 * member is currently assigned to — rather than being a static list someone has to
 * remember to update, so it is correct the moment the roster changes.
 *
 * <p>It is now an application FORM rather than a "get in touch" instruction. The previous
 * version told a student to speak to an office-bearer, which is exactly the informal
 * process that leaves no record and no reply.
 */
export function Join() {
  const { state } = useAuth();
  const committees = useApi(() => committeesApi.list(), []);
  const members = useApi(() => membersApi.list(), []);
  const mine = useApi(
    () => (state === "active" ? applicationsApi.mine() : Promise.resolve([])),
    [state],
  );
  const reveal = useReveal<HTMLDivElement>();

  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const open = useMemo(() => {
    const filled = new Set(
      (members.data ?? []).map((m) => m.committeeId).filter(Boolean) as string[],
    );
    return (committees.data ?? [])
      .filter((c) => c.type !== "advisory" && !filled.has(c.id))
      .sort((a, b) => a.order - b.order);
  }, [committees.data, members.data]);

  // Applying is allowed to any non-advisory committee, not only the empty ones: a
  // committee can want more people without being empty. The "open" list is a prompt.
  const choosable = useMemo(
    () => (committees.data ?? []).filter((c) => c.type !== "advisory").sort((a, b) => a.order - b.order),
    [committees.data],
  );

  const pending = new Set(
    (mine.data ?? []).filter((a) => a.status === "PENDING").map((a) => a.committeeId),
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(null);
    try {
      await applicationsApi.apply({
        committeeId: String(data.get("committeeId") ?? ""),
        motivation: String(data.get("motivation") ?? ""),
      });
      setNotice({
        tone: "success",
        text: "Application sent. You can follow it from your account page.",
      });
      setSelected("");
      event.currentTarget.reset();
      mine.reload();
    } catch (applyError) {
      setNotice({
        tone: "error",
        text: applyError instanceof Error ? applyError.message : "Could not send your application.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="join" className="band-deep pattern-dots relative isolate overflow-hidden py-20 text-white sm:py-24">
      <div ref={reveal} className="reveal mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-sky uppercase">
              Membership
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight font-bold text-white sm:text-4xl">
              Join the association
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80">
              Membership is open to every student of the Department of CSE (AI&nbsp;&amp;&nbsp;ML).
              Committee positions are filled at the start of each academic year, and students
              from all years are welcome to volunteer for events, workshops and outreach at
              any time.
            </p>

            <ol className="mt-9 grid gap-6 sm:grid-cols-3">
              {[
                { step: "01", title: "Create an account", body: "Sign up with your institute email address." },
                { step: "02", title: "Pick a committee", body: "Choose the one whose work matches your interests." },
                { step: "03", title: "Start contributing", body: "An office-bearer reviews your application and gets in touch." },
              ].map((item) => (
                <li key={item.step} className="border-t-2 border-sky pt-4">
                  <span className="font-mono text-xs font-semibold text-sky tabular-nums">
                    {item.step}
                  </span>
                  <h3 className="mt-2 font-display text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65">{item.body}</p>
                </li>
              ))}
            </ol>

            {/*
              Only rendered when something is actually open. An "open positions" panel that
              says "none" reads as neglect rather than as a full roster.
            */}
            {open.length > 0 ? (
              <div className="mt-10 rounded-lg border border-white/15 bg-white/[0.06] p-6">
                <h3 className="font-display text-base font-bold text-white">
                  Committees with no member listed
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {open.map((committee) => (
                    <li key={committee.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(committee.id)}
                        className="rounded border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 transition-colors hover:border-sky hover:text-white"
                      >
                        {committee.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* ── The form ──────────────────────────────────────────────────── */}
          <aside className="self-start rounded-lg border border-white/15 bg-white/[0.07] p-7 shadow-float backdrop-blur-sm">
            <h3 className="font-display text-xl font-bold text-white">Apply to a committee</h3>

            {state === "loading" ? (
              <p className="mt-5 animate-pulse text-sm text-white/60">Checking your account…</p>
            ) : state !== "active" ? (
              <div className="mt-5 space-y-5">
                <p className="text-sm leading-relaxed text-white/70">
                  Applications are tied to your account, so the committee can reply to you
                  and you can see where your application stands.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={state === "signed-out" ? "/signup/" : "/account/"}
                    className="rounded-md bg-sky px-5 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-sky3"
                  >
                    {state === "signed-out" ? "Create an account" : "Finish setting up"}
                  </Link>
                  {state === "signed-out" ? (
                    <Link
                      href="/login/"
                      className="rounded-md border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      Sign in
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-5 space-y-5">
                <div>
                  <label htmlFor="committeeId" className="block text-sm font-semibold text-white">
                    Committee
                  </label>
                  <select
                    id="committeeId"
                    name="committeeId"
                    required
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    className="mt-2 w-full rounded-md border border-white/25 bg-bg px-3.5 py-2.5 text-sm text-white focus:border-sky focus:outline-none"
                  >
                    <option value="">Choose a committee…</option>
                    {choosable.map((committee) => (
                      <option key={committee.id} value={committee.id} disabled={pending.has(committee.id)}>
                        {committee.name}
                        {pending.has(committee.id) ? " — already applied" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="motivation" className="block text-sm font-semibold text-white">
                    Why do you want to join?
                  </label>
                  <p className="mt-0.5 text-xs text-white/55">
                    A few sentences. At least 20 characters.
                  </p>
                  <textarea
                    id="motivation"
                    name="motivation"
                    required
                    minLength={20}
                    maxLength={2000}
                    rows={5}
                    placeholder="What you would like to work on, and anything relevant you have done before."
                    className="mt-2 w-full rounded-md border border-white/25 bg-bg px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-sky focus:outline-none"
                  />
                </div>

                {notice ? (
                  <p
                    role="alert"
                    className={`rounded-md border px-3.5 py-2.5 text-sm ${
                      notice.tone === "success"
                        ? "border-emerald/40 bg-emerald/15 text-white"
                        : "border-rose/40 bg-rose/15 text-white"
                    }`}
                  >
                    {notice.text}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-md bg-sky px-5 py-3 text-sm font-bold text-bg transition-all hover:-translate-y-0.5 hover:bg-sky3 disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send application"}
                </button>

                {(mine.data ?? []).length > 0 ? (
                  <p className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                    <Badge tone="gold">{(mine.data ?? []).length}</Badge>
                    application{(mine.data ?? []).length === 1 ? "" : "s"} so far —{" "}
                    <Link href="/account/" className="font-semibold text-sky hover:underline">
                      see them on your account
                    </Link>
                  </p>
                ) : null}
              </form>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
