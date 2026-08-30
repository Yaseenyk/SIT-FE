# SIT-FE — AISA frontend

The website of the **AIML Student Association**, Department of CSE (AI & ML), Dr. Bapuji
Salunkhe Institute of Engineering & Technology, Kolhapur.

Next.js 16 · React 19 · TypeScript · Tailwind v4 · **static export → GitHub Pages**

> **Backend:** [Yaseenyk/SIT-BE](https://github.com/Yaseenyk/SIT-BE) — Spring Boot + PostgreSQL.
> This repo is the public site and the admin UI; it holds no data and no secrets.

---

## Quick start

The site needs the API running to show anything, so start that first
(see the [SIT-BE README](https://github.com/Yaseenyk/SIT-BE)).

```bash
cp .env.example .env.local     # defaults already point at http://localhost:8080
npm install
npm run dev                    # http://localhost:3000
```

Admin panel at `/admin/`.

---

## Why it is built this way

**GitHub Pages serves static files.** There is no Node process: no SSR, no route handlers,
no image optimiser. `output: "export"` emits a folder of HTML/CSS/JS and nothing else.

The site's content is admin-editable and changes without a rebuild, so every section
**fetches its data in the browser** from the API at `NEXT_PUBLIC_API_BASE_URL`. That makes
loading, error and empty states normal cases rather than edge cases — which is why every
section handles all three, and why `useApi` exists.

Nothing here is a security boundary. `AdminGate` picks which screen to show; the actual
check is on the server. Anyone can load the dashboard markup, and it will be empty.

---

## Configuration

Both variables are `NEXT_PUBLIC_*`, meaning they are **compiled into the JavaScript the
browser downloads**. Neither is secret, and no secret can ever live in this repo.

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_SITE_URL` | Where the site is published. `basePath` and every canonical URL derive from it |
| `NEXT_PUBLIC_API_BASE_URL` | The SIT-BE origin. No trailing slash |

`NEXT_PUBLIC_SITE_URL` is the single source of truth — `next.config.ts`, `src/lib/site.ts`
and `scripts/postbuild.mjs` all read it, so they cannot disagree:

- `https://yaseenyk.github.io/SIT-FE` → `basePath` becomes `/SIT-FE`
- `https://aisa.example.org` → `basePath` is `""` and a `CNAME` is written

Moving to a custom domain is that one change. Nothing in `src/` moves.

---

## Deploying

1. **Settings → Pages → Source: GitHub Actions** (not "Deploy from a branch").
2. **Settings → Secrets and variables → Actions → Variables** — add the two variables
   above. The *Variables* tab, not Secrets.
3. Push to `main`, or run the workflow manually.

Both variables are baked in at build time, so **changing either needs a rebuild** —
Actions → Deploy to GitHub Pages → Run workflow.

Then set `CORS_ALLOWED_ORIGINS` on the backend to this site's exact origin. If the site
loads but every section reports an error, that is almost always why — check the browser
console for the origin it actually sent.

---

## Layout

```
src/
├── app/            layout, page, /admin, globals.css (design tokens)
├── components/
│   ├── core/       navbar, footer, announcement bar, neuron canvas
│   ├── sections/   hero, about, structure, events, gallery, achievements, contact
│   ├── ui/         primitives (server) + interactive (client)
│   └── admin/      login, dashboard, one panel per content type
├── lib/
│   ├── api/        client, endpoints, upload
│   ├── auth/       session context
│   └── hooks/      useApi
└── types/api.ts    mirrors the Java DTOs
```

---

## Checks

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

CI runs all four and refuses to publish if any fails.

---

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — binding conventions for changes to this repo
- [`docs/ui-system.md`](docs/ui-system.md) — design tokens, components, accessibility
- [SIT-BE `docs/architecture.md`](https://github.com/Yaseenyk/SIT-BE/blob/main/docs/architecture.md)
  — the system as a whole, the data model, the security model
