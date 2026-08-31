"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, SectionHeading, Skeleton } from "@/components/ui/primitives";
import { ErrorNotice, FilterTabs } from "@/components/ui/interactive";
import { gallery as galleryApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/api";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "events", label: "Events" },
  { value: "workshops", label: "Workshops" },
  { value: "competitions", label: "Competitions" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

export function Gallery() {
  const [filter, setFilter] = useState<Filter>("all");
  const [lightbox, setLightbox] = useState<{ items: GalleryItem[]; index: number } | null>(null);

  const { data, error, loading, reload } = useApi(
    () => galleryApi.list(filter === "all" ? undefined : filter),
    [filter],
  );

  /**
   * Albums collapse to one tile.
   *
   * Twelve photos from one workshop should be one thing to click, not twelve tiles that
   * push everything else off the screen. The first photo of each album represents it.
   */
  const tiles = useMemo(() => {
    const seenAlbums = new Set<string>();
    const result: Array<{ item: GalleryItem; album: GalleryItem[] | null }> = [];
    const items = data ?? [];

    for (const item of items) {
      if (!item.albumId) {
        result.push({ item, album: null });
        continue;
      }
      if (seenAlbums.has(item.albumId)) continue;
      seenAlbums.add(item.albumId);
      const album = items
        .filter((candidate) => candidate.albumId === item.albumId)
        .sort((a, b) => (a.albumIndex ?? 0) - (b.albumIndex ?? 0));
      result.push({ item: album[0] ?? item, album });
    }
    return result;
  }, [data]);

  const close = useCallback(() => setLightbox(null), []);

  const step = useCallback((delta: number) => {
    setLightbox((current) => {
      if (!current) return current;
      const next = current.index + delta;
      // Clamped, not wrapped: at the last photo, pressing Right should do nothing rather
      // than silently restart the album.
      if (next < 0 || next >= current.items.length) return current;
      return { ...current, index: next };
    });
  }, []);

  // Arrow keys and Escape. A lightbox that can only be driven by clicking small on-image
  // buttons is unusable with a keyboard.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close, step]);

  const current = lightbox ? lightbox.items[lightbox.index] : null;

  return (
    <section id="gallery" className="border-b border-line py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Gallery"
          title="Photographs"
          description="Workshops, competitions, guest lectures and departmental events."
        />
        <FilterTabs
          label="Filter gallery"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          className="mb-8"
        />

        {/*
          A mosaic, not a uniform grid. The first tile spans two columns and two rows, so
          the section has a focal point and reads as a gallery rather than a contact sheet
          of identical squares.
        */}
        <div className="grid auto-rows-[9rem] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {loading ? (
            [0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <Skeleton key={index} className={index === 0 ? "col-span-2 row-span-2" : ""} />
            ))
          ) : error ? (
            <ErrorNotice error={error} onRetry={reload} />
          ) : tiles.length === 0 ? (
            <EmptyState
              title="No photographs published yet"
              hint="Photographs from events appear here once the Media, Design & Publicity committee uploads them."
            />
          ) : (
            tiles.map(({ item, album }, index) => (
              <button
                key={item.id}
                onClick={() => setLightbox({ items: album ?? [item], index: 0 })}
                className={cn("group card card-hover relative overflow-hidden p-0",
                  index === 0 && "col-span-2 row-span-2",
                )}
              >
                <img
                  src={item.url}
                  alt={album ? (item.albumTitle ?? item.title) : item.title}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* The scrim is always on, not hover-only: a caption that appears only on
                    hover is invisible on a touch screen. */}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sky2/90 to-transparent p-3 pt-8 text-start">
                  <span
                    className={cn("block truncate font-semibold text-white",
                      index === 0 ? "text-sm" : "text-xs",
                    )}
                  >
                    {album ? item.albumTitle : item.title}
                  </span>
                </span>
                {album ? (
                  <span className="absolute end-2 top-2 rounded bg-sky2/85 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                    {album.length} photos
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>

      {current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          onClick={close}
          className="fixed inset-0 z-70 flex flex-col items-center justify-center gap-5 bg-bg/95 p-4 backdrop-blur-sm"
        >
          <img
            src={current.url}
            alt={current.title}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[72vh] max-w-full rounded object-contain"
          />
          <div className="text-center">
            <p className="font-display text-base font-bold text-white">{current.title}</p>
            {current.description ? (
              <p className="mx-auto mt-1.5 max-w-lg text-sm text-white/70">{current.description}</p>
            ) : null}
          </div>

          {lightbox && lightbox.items.length > 1 ? (
            <div
              className="flex items-center gap-4"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                onClick={() => step(-1)}
                disabled={lightbox.index === 0}
                className="rounded border border-white/30 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                &larr; Prev
              </button>
              <span className="text-xs text-white/70 tabular-nums">
                {lightbox.index + 1} / {lightbox.items.length}
              </span>
              <button
                onClick={() => step(1)}
                disabled={lightbox.index === lightbox.items.length - 1}
                className="rounded border border-white/30 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                Next &rarr;
              </button>
            </div>
          ) : null}

          <button
            onClick={close}
            aria-label="Close"
            className="absolute end-4 top-4 rounded border border-white/30 px-3 py-1.5 text-white transition-colors hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      ) : null}
    </section>
  );
}
