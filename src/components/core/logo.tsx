import { asset } from "@/lib/site";

/**
 * The association's logo.
 *
 * <h2>Why it sits on a light plate</h2>
 *
 * <p>The artwork is drawn for a white ground: the "A", the head and the entire
 * "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING / STUDENT ASSOCIATION" line are deep navy.
 * Placed straight onto this site's #020c18 they have almost no contrast and roughly half
 * the mark disappears — the bright "ISA" survives and nothing else does.
 *
 * <p>Recolouring somebody's logo is not ours to do, so it gets the background it was
 * designed for. A light plate in a dark header is the ordinary answer to this and reads
 * as a badge rather than as a mistake.
 *
 * <p>The source JPEG's white background was made transparent and the margin trimmed
 * (`public/logo/aisa-logo.png`), so the plate's rounded corners are the plate's, not a
 * white rectangle showing through. The original is kept at `public/logo/logo.jpeg`.
 *
 * <p>Width and height are declared so the header does not reflow when the image lands.
 */
export function Logo({
  className = "h-10",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 shadow-raise ${className}`}
    >
      <img
        src={asset("/logo/aisa-logo.png")}
        alt="AISA — AI & ML Student Association"
        width={760}
        height={313}
        // The header logo is above the fold and part of the LCP; everything else can wait.
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="h-full w-auto object-contain"
      />
    </span>
  );
}
