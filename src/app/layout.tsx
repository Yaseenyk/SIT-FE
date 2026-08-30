import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Two families, per the streamerOS brand kit.
 *
 * Inter replaces the original site's Orbitron + Exo 2 pairing. Orbitron is a squared-off
 * display face, and setting every heading and card title in it is what made the page read
 * as a game UI rather than a university department's. Inter at 700-800 carries the same
 * confidence without the costume, and one family means a card's title, label and paragraph
 * are no longer three typefaces inside forty vertical pixels.
 *
 * next/font self-hosts both: the files are emitted into the static export and served from
 * the site's own origin. That removes a render-blocking request to a third party, removes
 * the layout shift while it resolves, and means the site keeps its typography on a network
 * that blocks fonts.googleapis.com.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.longName} | BSIET Kolhapur`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "AISA", "AIML", "AI", "Machine Learning", "BSIET", "Kolhapur",
    "CSE-AIML", "Student Association",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} | ${SITE.longName} — BSIET`,
    description: SITE.tagline,
    type: "website",
    url: SITE_URL,
    siteName: SITE.name,
  },
  robots: { index: true, follow: true },
};

/**
 * Organization + WebSite structured data.
 *
 * Rendered on the server into the static HTML, so search engines see it without executing
 * JavaScript. Built from the compile-time constants rather than the API for the same
 * reason: on a static export nothing fetched at runtime is in the HTML a crawler reads.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: `${SITE.name} — ${SITE.longName}`,
      url: SITE_URL,
      description: SITE.description,
      parentOrganization: {
        "@type": "CollegeOrUniversity",
        name: SITE.institute,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.city,
          addressRegion: "Maharashtra",
          addressCountry: "IN",
        },
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE.name,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The font variables go on <html>, never <body>. Tailwind's @theme declares
    // --font-sans: var(--font-exo2) at :root, and a custom property is substituted where
    // it is DECLARED — a variable that only exists on <body> resolves to nothing at :root,
    // and every heading silently falls back to the browser default. No error, no warning.
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // The content is a compile-time constant, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
