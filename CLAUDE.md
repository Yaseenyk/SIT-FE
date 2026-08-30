# CLAUDE.md — SIT-FE

AI guardrails for this repository. Binding for every code generation, refactor and review.
When a rule here conflicts with a general habit, this file wins.

---

## 0. What this is

The public website and admin UI for **AISA**, the AIML Student Association at BSIET
Kolhapur. Next.js (App Router) + TypeScript + Tailwind v4, **static export** to GitHub Pages.

The API is a separate repository: [Yaseenyk/SIT-BE](https://github.com/Yaseenyk/SIT-BE).

**The constraint that shapes everything:** GitHub Pages serves static files. There is no
Node process — no SSR, no route handlers, no image optimiser. Every piece of
admin-editable content is fetched in the browser at runtime.

---

## 1. No secrets. Ever.

**Anything named `NEXT_PUBLIC_*` is compiled into the JavaScript the browser downloads.**
It is not a secret and never can be.

If you find yourself wanting a secret here — a database URL, an API key, a signing key —
the work belongs in SIT-BE. There is no exception.

**Nothing in this repo is a security boundary.** `AdminGate` decides which screen to show,
not what anyone is allowed to do. Never move a check here and delete the server-side one.

The token lives in `localStorage`. That is a considered trade for a static site with no
server to set an HttpOnly cookie — see the comment in `lib/api/client.ts`. Do not "fix" it
by inventing a cookie the static host cannot set.

---

## 2. Design tokens are mandatory

The palette is declared once in `src/app/globals.css` under `@theme`.

```tsx
// ❌ never
<span className="text-[#38bdf8]">Events</span>
<div style={{ background: "#071e30" }} />

// ✅ always
<span className="text-sky">Events</span>
<div className="bg-card" />
```

- Surfaces: `bg`, `bg2`, `surface`, `card`, `card2`
- Accent: `sky`, `sky2`, `sky3`, `cyan` — `sky` means *interactive*
- Status: `emerald`, `gold`, `rose` — **semantic only**, never decorative, and the brand is
  never used for status
- Text and lines: `ink`, `muted`, `line`, `line2`
- Type: `font-display` (Orbitron) headings, `font-sans` (Exo 2) body, `font-mono`
  (JetBrains Mono) numbers and labels

**The two documented exceptions** are `committee.gradient` and the hero's radial wash —
per-record admin values and one-off art direction, so they can only be inline styles.
Anything else reaching for `style={{}}` is a mistake.

If a value has no token, **propose a token** rather than using an arbitrary value.

### Never build a class name from a variable

Tailwind scans source *text*. `bg-${tone}/10` is not in the output CSS and renders
unstyled. Use a full-string lookup map, as `Badge` does.

### Tailwind only scans `src/`

`globals.css` pins it: `@import "tailwindcss" source(none);` + `@source "../../src";`.
Tailwind v4 otherwise scans the whole project, sweeps up this file and `docs/*.md` — which
*name* utility classes while discussing them — and compiles them into the bundle.
**Do not remove that pair.**

---

## 3. Layout and rhythm

Seven identically-centred sections read as one undifferentiated column; that is most of
why the first version looked unfinished. So:

- `SectionHeading` defaults to **left-aligned**. Centre only genuinely symmetrical sections.
- Sections alternate `bg` / `bg2` and carry `edge-top`.
- Vary the shape: Events is a list with a featured lead, Gallery is a mosaic with a 2×2
  lead tile, About is a two-column split. **Do not flatten these back into uniform grids.**
- The particle canvas is on the **hero and contact only**. On every section it was noise.

---

## 4. RSC by default

- Every component is a Server Component until proven otherwise. `"use client"` goes at the
  lowest leaf that needs it.
- `app/page.tsx` is composition only and stays a Server Component.
- Sections are client components because they fetch at runtime. That is inherent to a
  static export, not laziness — do not "fix" it by fetching in `page.tsx`; there is no
  server to fetch on.
- `components/ui/primitives.tsx` is server-only, `interactive.tsx` is client. Keep that
  split, so importing a `Card` does not drag `"use client"` along with it.

---

## 5. Data fetching

- Components never build a URL. Every call goes through `lib/api/endpoints.ts`.
- Every fetch goes through `useApi`, which gives loading / error / retry.
- **Loading and failure are normal, reachable states** here — the free-tier API sleeps and
  takes ~50 s to wake. A section that renders nothing on failure is incomplete work.
- `useApi` deps must be **primitives**; they are joined into a string key.

---

## 6. Accessibility

- One `<h1>` per page (the hero). Heading levels never skip.
- Real `<button>` and `<a>` elements, keyboard-operable. A `<div onClick>` is a bug.
- Decorative canvases and emoji get `aria-hidden`.
- `:focus-visible` is a visible `sky` outline. **Never removed.**
- `prefers-reduced-motion` is honoured globally and specifically in `NeuronCanvas`.
- Async outcomes are announced: `role="status"` for success, `role="alert"` for errors.

---

## 7. Working agreement

- **Surgical changes only.** No drive-by refactors, no speculative abstractions.
- **Comments explain *why*, never *what*.** Every comment here records a decision, a
  constraint, or the bug the obvious alternative would cause. Match that bar.
- **Verify before claiming done.** If you cannot run something, say so plainly.

---

## 8. Definition of done

- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` all pass
- [ ] Only design tokens; zero arbitrary colour values
- [ ] `"use client"` only where needed, at the leaf
- [ ] Loading, error and empty states all handled
- [ ] Semantic HTML; single `h1`; keyboard-operable
- [ ] Checked at 390 px — no horizontal overflow
- [ ] `docs/ui-system.md` updated if components or tokens changed
- [ ] No secret added anywhere in this repo
