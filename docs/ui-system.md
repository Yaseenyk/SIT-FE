# UI system

The visual language, ported from the original site's CSS custom properties.

---

## Tokens

Declared once, in `fe/src/app/globals.css` under `@theme`. Tailwind generates the
utilities. **Consuming them is mandatory** — see `CLAUDE.md` §2.

### Surfaces

| Token | Value | Used for |
| ----- | ----- | -------- |
| `bg` | `#020c18` | Page ground; the hero and Structure sit on it |
| `bg2` | `#041424` | About, Gallery, the footer — the alternating band |
| `surface` | `#061828` | Events, Achievements |
| `card` | `#071e30` | Card interiors (`.card-surface`) |
| `card2` | `#082236` | Table headers, avatar placeholders, hover states |

Sections alternate `bg` → `bg2` → `bg` → `surface` so adjacent sections separate without
needing rules between them.

### Accent

| Token | Value | Used for |
| ----- | ----- | -------- |
| `sky` | `#38bdf8` | **The interactive colour.** Links, active nav, focus rings, the neuron canvas |
| `sky2` | `#0ea5e9` | Primary button fill, scrollbar |
| `sky3` | `#7dd3fc` | The light end of `.text-gradient` |
| `cyan` | `#22d3ee` | Gradient partner; the brand badge and announcement bar |

### Status — semantic, never decorative

| Token | Value | Means |
| ----- | ----- | ----- |
| `emerald` | `#10b981` | Success; "upcoming"; an unread message |
| `gold` | `#f59e0b` | Attention; executive committees; unassigned members; the unread badge |
| `rose` | `#f43f5e` | Error; destructive actions; required-field markers |

Green means good, amber means look, red means stop. They are never used for branding, and
the brand is never used for status.

### Text and lines

| Token | Value | Used for |
| ----- | ----- | -------- |
| `ink` | `#e0f2fe` | Body text |
| `muted` | `#5d8fad` | Secondary text, labels, placeholders |
| `line` | `rgb(56 189 248 / 0.12)` | Default borders |
| `line2` | `rgb(56 189 248 / 0.25)` | Hover and emphasis borders |

A muted tier is made by fading an existing token (`text-ink/70`), never by inventing a
sixth colour.

### Type

| Token | Family | Used for |
| ----- | ------ | -------- |
| `font-display` | Orbitron | The wordmark, section headings, card titles |
| `font-sans` | Exo 2 | Body copy — the default |
| `font-mono` | JetBrains Mono | Numbers, dates, eyebrow labels, ids |

Self-hosted via `next/font`, so there is no render-blocking request to Google and no
layout shift. **The font variables go on `<html>`, never `<body>`** — `@theme` declares
`--font-sans: var(--font-exo2)` at `:root`, and a custom property is substituted where it
is *declared*. A variable that exists only on `<body>` resolves to nothing at `:root`, and
every heading silently falls back to the browser default. No error, no warning.

### Spacing

| Token | Value | Why |
| ----- | ----- | --- |
| `nav` | `4.375rem` (70px) | The fixed navbar height |

Used as `pt-nav`, `h-nav`, `scroll-mt-nav`, and as `scroll-padding-top` on `html` — which
is what stops every in-page anchor landing underneath the navbar. The original did that
arithmetic in JavaScript on each anchor click.

---

## Component classes

Three, in `@layer components`. Everything else is utilities on the element.

| Class | Why it exists |
| ----- | ------------- |
| `.text-gradient` | Four interdependent properties that are easy to half-copy |
| `.card-surface` | Used on ~30 elements |
| `.glow-sky` | The hover/active glow |

---

## Component inventory

### Server components — `components/ui/primitives.tsx`

`SectionHeading` · `Card` · `Badge` · `Skeleton` · `EmptyState`

No state, no handlers, so importing a `Card` does not drag `"use client"` along with it.

**`Badge` uses a full-string lookup map.** Tailwind scans source *text*: a constructed
class like `bg-${tone}/10` is not in the output CSS and renders unstyled. This is the most
common way to break styling in this codebase.

### Client components — `components/ui/interactive.tsx`

| Component | Notes |
| --------- | ----- |
| `Button` | `primary` / `ghost` / `danger`, `sm` / `md` |
| `FilterTabs` | A real `role="tablist"` — it changes what the section below shows |
| `Modal` | Native `<dialog>`: focus trapping, Escape, inert background, top layer, all free |
| `ErrorNotice` | The failure state, with retry |

### Admin — `components/admin/shared.tsx`

`Field` · `Notice` · `useActionState` · `DeleteButton` · `ImagePicker` · `Panel` ·
`TableShell`

**`DeleteButton` is a two-step confirm** — one click arms it ("Sure?"), the next commits,
and it disarms on blur. `window.confirm()` is unstyled, blocks the tab, and some browsers
suppress it entirely.

**`ImagePicker` uploads on selection**, not on submit. The upload is the slow part; doing
it up front means the admin sees the preview before committing and the save is instant.

---

## The neuron canvas

`components/core/neuron-canvas.tsx` — a faithful port of `initNeuron()`. Drifting nodes,
lines between any pair within 150px, brighter lines toward the pointer.

Three corrections the original needed:

1. **It stops.** The original called `requestAnimationFrame` forever with no cancel. In a
   page that never unmounted anything that was survivable; in React it would leak one loop
   per mount, all still drawing to detached canvases.
2. **It honours `prefers-reduced-motion`** — one static frame, so the section keeps its
   texture rather than going blank.
3. **It is sharp on retina screens.** The original set `canvas.width` to the CSS width, so
   every line drew at half resolution.

Node positions are held as 0–1 fractions and scaled at draw time, so a resize repositions
them proportionally. Storing pixels — as the original did — meant every node kept its old
coordinates after a resize and they bunched into a corner.

`density` is 110 in the hero, 45 elsewhere. The pair loop is O(n²/2), which is what keeps
it affordable.

The WebGL hero was deliberately not ported — see `architecture.md` §6.

---

## Layout conventions

- Content max width `max-w-6xl`, padding `px-4 sm:px-6`
- Sections `py-24`
- Card grids `gap-5`, `sm:grid-cols-2 lg:grid-cols-3`
- Gallery `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`, `gap-3`

## Accessibility

- One `<h1>` per page — the hero's `AISA`. Sections are `<h2>`, card titles `<h3>`.
- Decorative canvases and emoji are `aria-hidden`.
- `:focus-visible` is a 2px `sky` outline with a 2px offset. **Never removed.**
- The lightbox is keyboard-driven: `←`/`→` step, `Escape` closes.
- Async outcomes are announced — `role="status"` for success, `role="alert"` for errors.
- Reduced motion is honoured globally in `globals.css` and specifically in the canvas.
