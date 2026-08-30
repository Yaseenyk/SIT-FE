import { AnnouncementBar } from "@/components/core/announcement-bar";
import { Footer } from "@/components/core/footer";
import { Navbar } from "@/components/core/navbar";
import { About } from "@/components/sections/about";
import { Achievements } from "@/components/sections/achievements";
import { Contact } from "@/components/sections/contact";
import { Events } from "@/components/sections/events";
import { Gallery } from "@/components/sections/gallery";
import { Hero } from "@/components/sections/hero";
import { Join } from "@/components/sections/join";
import { Structure } from "@/components/sections/structure";
import { AuthProvider } from "@/lib/auth/context";
import { SettingsProvider } from "@/lib/settings-context";

/**
 * The public site — one page, seven in-page sections, as the original was.
 *
 * This component is a Server Component: it is the composition and nothing else, so it
 * ships no JavaScript of its own. Each section is a client component because each one
 * fetches its own data at runtime (there is no server to fetch on in a static export) or
 * holds interaction state.
 *
 * SettingsProvider wraps all of them so the announcement, About, Contact and the footer
 * share one `/settings` request rather than making four. AuthProvider is here because the
 * PUBLIC page now has signed-in actions on it — registering for an event, applying to a
 * committee — and each needs to know whether there is an account behind the visitor.
 */
export default function HomePage() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AnnouncementBar />
        <Navbar />
        <main>
          <Hero />
          <About />
          <Structure />
          <Events />
          <Gallery />
          <Achievements />
          <Join />
          <Contact />
        </main>
        <Footer />
      </SettingsProvider>
    </AuthProvider>
  );
}
