/**
 * Where the site lives, and how to point at things inside it.
 *
 * Reads the SAME `NEXT_PUBLIC_SITE_URL` that `next.config.ts` derives `basePath` from, so
 * canonical URLs and the router cannot disagree.
 */

// `||`, NOT `??`: an unset GitHub Actions variable arrives as an EMPTY STRING, which `??`
// accepts — and `new URL("")` throws during the CI build while passing locally.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
).replace(/\/$/, "");

/** "/aisa" on a project page, "" on a custom domain. */
export const BASE_PATH = new URL(SITE_URL).pathname.replace(/\/$/, "");

/**
 * Prefixes a path in `public/` with the basePath.
 *
 * `next/link` and `next/image` do this automatically; a hand-written `<img src="/logo.png">`
 * does NOT, and on a project page it resolves to `<user>.github.io/logo.png` — a 404 with
 * no build error. Every local asset reference goes through here.
 */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE = {
  name: "AISA",
  longName: "AIML Student Association",
  department: "Department of CSE (AI & ML)",
  institute: "Dr. Bapuji Salunkhe Institute of Engineering & Technology",
  city: "Kolhapur",
  tagline: "Empowering AIML Students at BSIET Kolhapur",
  description:
    "Official website of AISA — the AIML Student Association, Department of CSE-AIML, " +
    "Dr. Bapuji Salunkhe Institute of Engineering & Technology, Kolhapur.",
} as const;

/** The in-page sections, in document order. Drives the navbar and the scroll spy. */
export const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "structure", label: "Structure" },
  { id: "events", label: "Events" },
  { id: "gallery", label: "Gallery" },
  { id: "achievements", label: "Achievements" },
  { id: "join", label: "Join us" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];
