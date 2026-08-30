"use client";

import { useState } from "react";
import { Button, ErrorNotice, Modal } from "@/components/ui/interactive";
import { Skeleton } from "@/components/ui/primitives";
import { ApiError } from "@/lib/api/client";
import { gallery as galleryApi } from "@/lib/api/endpoints";
import { uploadImage, validateImage } from "@/lib/api/upload";
import { useApi } from "@/lib/hooks/use-api";
import { DeleteButton, FIELD, Field, Notice, Panel, useActionState } from "./shared";

type Uploaded = { url: string; publicId: string };

export function GalleryPanel() {
  const items = useApi(() => galleryApi.list(), []);
  const { notice, busy, run, clearNotice } = useActionState();

  const [open, setOpen] = useState(false);
  const [uploaded, setUploaded] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [takenOn, setTakenOn] = useState("");

  function reset() {
    setUploaded([]);
    setUploading(null);
    setUploadError(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setTakenOn("");
  }

  /**
   * Uploads the selected files one at a time, reporting progress.
   *
   * Sequential rather than Promise.all: a dozen simultaneous multi-megabyte uploads on
   * campus wifi is how you get a dozen timeouts instead of a dozen photos. It also makes
   * "Uploading 4/12" an honest number.
   */
  async function onFiles(files: FileList) {
    const list = Array.from(files);
    const invalid = list.map(validateImage).find(Boolean);
    if (invalid) {
      setUploadError(invalid);
      return;
    }

    setUploadError(null);
    setUploading({ done: 0, total: list.length });
    const results: Uploaded[] = [];

    for (const [index, file] of list.entries()) {
      try {
        results.push(await uploadImage(file, "gallery"));
        setUploading({ done: index + 1, total: list.length });
      } catch (error) {
        setUploadError(
          error instanceof ApiError
            ? `${file.name}: ${error.message}`
            : `${file.name} failed to upload.`,
        );
        break;
      }
    }

    // Keep whatever did upload. Discarding six successful uploads because the seventh
    // failed would mean re-uploading all of them.
    setUploaded((current) => [...current, ...results]);
    setUploading(null);
  }

  async function save() {
    const ok = await run(
      () =>
        galleryApi.create({
          images: uploaded,
          title,
          description,
          category,
          takenOn: takenOn || null,
        }),
      uploaded.length > 1 ? `Album of ${uploaded.length} photos added` : "Photo added",
    );
    if (ok) {
      setOpen(false);
      reset();
      items.reload();
    }
  }

  // One tile per album, plus every standalone photo — the same collapsing the public
  // gallery does, so the admin sees what visitors see.
  const albums = new Map<string, number>();
  for (const item of items.data ?? []) {
    if (item.albumId) albums.set(item.albumId, (albums.get(item.albumId) ?? 0) + 1);
  }

  return (
    <Panel
      title="Gallery"
      description="Select several photos at once to create an album."
      action={<Button onClick={() => setOpen(true)}>Add photos</Button>}
    >
      {notice ? (
        <Notice tone={notice.tone} onDismiss={clearNotice}>
          {notice.text}
        </Notice>
      ) : null}

      {items.loading ? (
        <Skeleton className="h-64" />
      ) : items.error ? (
        <ErrorNotice error={items.error} onRetry={items.reload} />
      ) : (items.data ?? []).length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-6 py-12 text-center text-xs text-muted">
          No photos yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {(items.data ?? []).map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-lg border border-line">
              <img src={item.url} alt={item.title} className="aspect-square w-full object-cover" />
              <figcaption className="space-y-2 p-2">
                <p className="truncate text-[0.65rem]" title={item.title}>
                  {item.title}
                </p>
                <DeleteButton
                  label="Delete"
                  disabled={busy}
                  onConfirm={async () => {
                    const ok = await run(() => galleryApi.remove(item.id), "Photo deleted");
                    if (ok) items.reload();
                  }}
                />
                {/* Deleting an album is one action, not one per photo — the alternative
                    leaves a half-deleted album if the tab is closed midway. */}
                {item.albumId && item.albumIndex === 0 ? (
                  <DeleteButton
                    label={`Delete album (${albums.get(item.albumId) ?? 0})`}
                    disabled={busy}
                    onConfirm={async () => {
                      const ok = await run(
                        () => galleryApi.removeAlbum(item.albumId!),
                        "Album deleted",
                      );
                      if (ok) items.reload();
                    }}
                  />
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="Add photos"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={busy || uploaded.length === 0 || uploading !== null}>
              {busy ? "Saving…" : `Save ${uploaded.length || ""}`.trim()}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Photos"
            htmlFor="g-files"
            required
            hint="Pick several at once to create an album. They upload as soon as you choose them."
          >
            <input
              id="g-files"
              type="file"
              accept="image/*"
              multiple
              disabled={uploading !== null}
              onChange={(event) => {
                if (event.target.files?.length) onFiles(event.target.files);
                event.target.value = "";
              }}
              className="w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-card2 file:px-3 file:py-1.5 file:text-xs file:text-sky"
            />
          </Field>

          {uploading ? (
            <p className="text-xs text-sky">
              Uploading {uploading.done}/{uploading.total}…
            </p>
          ) : null}
          {uploadError ? <Notice tone="error">{uploadError}</Notice> : null}

          {uploaded.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {uploaded.map((image) => (
                <img
                  key={image.publicId}
                  src={image.url}
                  alt=""
                  className="size-14 rounded-md object-cover"
                />
              ))}
            </div>
          ) : null}

          <Field
            label={uploaded.length > 1 ? "Album title" : "Title"}
            htmlFor="g-title"
            hint={uploaded.length > 1 ? "Each photo is numbered from this." : undefined}
          >
            <input
              id="g-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={FIELD}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="g-category">
              <select
                id="g-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={FIELD}
              >
                <option value="">— none —</option>
                <option value="events">Events</option>
                <option value="workshops">Workshops</option>
                <option value="competitions">Competitions</option>
              </select>
            </Field>
            <Field label="Taken on" htmlFor="g-date">
              <input
                id="g-date"
                type="date"
                value={takenOn}
                onChange={(event) => setTakenOn(event.target.value)}
                className={FIELD}
              />
            </Field>
          </div>

          <Field label="Description" htmlFor="g-desc">
            <textarea
              id="g-desc"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={FIELD}
            />
          </Field>
        </div>
      </Modal>
    </Panel>
  );
}
