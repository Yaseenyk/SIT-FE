import type { Metadata } from "next";
import { Exo_2, JetBrains_Mono, Orbitron } from "next/font/google";
import { BASE_PATH, SITE, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * The three families the original site loaded from a Google Fonts <link>.
 *
 * Orbitron for headings and the wordmark, Exo 2 for everything else, JetBrains Mono for
 * stats and labels — restored after a spell with a text serif, which suited an
 * institutional white ground and does not suit this one.
 *
 * next/font self-hosts all three: the files are emitted into the static export and served
 * from the site's own origin. That removes a render-blocking request to a third party,
 * removes the layout shift while it resolves, and means the site keeps its typography on
 * a network that blocks fonts.googleapis.com.
 */
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-exo2",
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
  /*
   * The full logo is a 2.4:1 lockup and illegible at 32px, so the icon is the
   * "A"-with-head mark alone, flattened onto white. A tab strip is not always dark, and a
   * navy mark on a transparent ground vanishes against one that is.
   */
  icons: {
    icon: [{ url: `${BASE_PATH}/icon.png`, type: "image/png", sizes: "512x512" }],
    apple: [{ url: `${BASE_PATH}/icon.png`, sizes: "512x512" }],
  },
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
    <html lang="en" className={`${orbitron.variable} ${exo2.variable} ${jetbrains.variable}`}>
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
