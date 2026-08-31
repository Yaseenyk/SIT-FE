import { asset } from "@/lib/site";

/**
 * The association's wordmark.
 *
 * <p>One component so the file path and the alt text exist once. The asset is a WIDE
 * lockup (roughly 2.4:1) reading "AISA / AIML Student Association", not a square icon —
 * so it replaces the whole brand block wherever it appears, rather than sitting beside a
 * repeat of the same words in text.
 *
 * <p>It goes through {@link asset} because a plain {@code <img src="/logo/...">} resolves
 * to the domain root on a GitHub project page and 404s with no build error — this site is
 * served from a subpath.
 *
 * <p>Height is set and width is left to the aspect ratio, so the intrinsic dimensions are
 * declared and the row does not reflow when the image lands.
 */
export function Logo({
  className = "h-10",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={asset("/logo/aisa-logo.jpg")}
      alt="AISA — AIML Student Association"
      width={1600}
      height={676}
      // The header logo is above the fold and part of the LCP; everything else can wait.
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={`${className} w-auto object-contain`}
    />
  );
}
