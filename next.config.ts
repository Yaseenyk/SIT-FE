import type { NextConfig } from "next";

/**
 * STATIC EXPORT — GitHub Pages.
 *
 * Pages serves files. There is no Node process, so there is no server: no Server Actions,
 * no route handlers, no image optimiser, no SSR. `output: "export"` makes Next emit a
 * folder of HTML/CSS/JS into `out/` and nothing else.
 *
 * The site's content is admin-editable and changes without a rebuild, so it is fetched in
 * the browser from the Spring Boot API at NEXT_PUBLIC_API_BASE_URL. That is the same shape
 * the original single-file site had (it called Firestore from the browser); what changed
 * is that writes now go through a server that checks who is asking.
 */

/**
 * ONE source of truth for where this site lives: `NEXT_PUBLIC_SITE_URL`.
 *
 * `basePath` is DERIVED from it, exactly as `BASE_PATH` is in `src/lib/site.ts`. Both read
 * the same variable, so the router and the canonical URLs cannot drift — a site whose
 * links point at one origin while its sitemap advertises another is one Google cannot index.
 *
 * Today:  https://<user>.github.io/aisa  → basePath "/aisa"
 * Custom: https://aisa.bsiet.edu.in      → basePath ""     (and a CNAME is written)
 *
 * Moving to a custom domain is therefore a one-line change — set the variable.
 */
// `||`, NOT `??`: an unset GitHub Actions variable arrives as an EMPTY STRING, which `??`
// happily accepts — SITE_URL becomes "", `new URL("")` throws, and the build dies in CI
// while passing locally. Treat empty as unset, because that is what it means.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
).replace(/\/$/, "");

const basePath = new URL(SITE_URL).pathname.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",

  // "" on a custom domain, "/aisa" on a project page. `next/link` and `next/image` apply
  // it automatically; a hand-written `<img src="/x">` would NOT, which is why every local
  // asset in this codebase goes through `asset()` in src/lib/site.ts.
  basePath,

  images: {
    /**
     * The Next image optimiser is a SERVER. It cannot exist here. Without this flag the
     * export fails outright rather than silently degrading.
     *
     * Photos are served by Cloudinary, which resizes on its own URL, so the loss is
     * limited to the handful of local assets in public/.
     */
    unoptimized: true,
  },

  /**
   * Emits `/admin/index.html` rather than `/admin.html`, so `/admin` and `/admin/` both
   * resolve on a static host. Without it, Pages 404s the extensionless URL every link uses.
   */
  trailingSlash: true,

  reactStrictMode: true,
};

export default nextConfig;
