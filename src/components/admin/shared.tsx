"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/interactive";
import { ApiError } from "@/lib/api/client";
import { uploadImage, validateImage } from "@/lib/api/upload";
import type { UploadFolder } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";

/** The one input style used across every admin form. */
export const FIELD ="w-full rounded-lg border border-line bg-bg2 px-3 py-2 text-sm text-ink " +"placeholder:text-muted/70 focus:border-sky focus:outline-none disabled:opacity-50";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold">
        {label} {required ? <span className="text-rose">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[0.65rem] text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * A dismissible banner for the outcome of an action.
 *
 * Replaces the original's floating toasts. A banner inside the panel that caused it
 * cannot be missed by someone looking at the form, and does not disappear on a timer
 * before it has been read.
 */
export function Notice({
  tone,
  children,
  onDismiss,
}: {
  tone: "ok" | "error";
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-2.5 text-xs",
        tone === "ok"
          ? "border-emerald/25 bg-emerald/10 text-emerald"
          : "border-rose/25 bg-rose/10 text-rose",
      )}
    >
      <span>{children}</span>
      {onDismiss ? (
        <button onClick={onDismiss} aria-label="Dismiss" className="shrink-0 font-bold">
          ✕
        </button>
      ) : null}
    </div>
  );
}

/**
 * Tracks the outcome of a save/delete so panels do not each reinvent it.
 *
 * `run` swallows the error deliberately — it has been captured into state and rendered as
 * a Notice, and rethrowing would only produce an unhandled rejection in the console.
 */
export function useActionState() {
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (action: () => Promise<unknown>, successMessage: string): Promise<boolean> => {
      setBusy(true);
      setNotice(null);
      try {
        await action();
        setNotice({ tone: "ok", text: successMessage });
        return true;
      } catch (error) {
        setNotice({
          tone: "error",
          text: error instanceof ApiError ? error.message : "Something went wrong",
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { notice, busy, run, clearNotice: () => setNotice(null) };
}

/**
 * Delete, behind a two-step confirm.
 *
 * The button becomes its own confirmation rather than opening a dialog — one click to
 * arm, one to commit, and it disarms on blur. The original used window.confirm(), which
 * is unstyled, blocks the whole tab, and is suppressed entirely by some browsers.
 */
export function DeleteButton({
  onConfirm,
  label = "Delete",
  disabled,
}: {
  onConfirm: () => void;
  label?: string;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  return (
    <Button
      variant="danger"
      size="sm"
      disabled={disabled}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? "Sure?" : label}
    </Button>
  );
}

/**
 * Pick an image, upload it to Cloudinary, hand back the URL and public id.
 *
 * The upload happens here, on selection, rather than on form submit: it is the slow part,
 * and doing it up front means the admin sees the preview before they commit and the save
 * itself is instant.
 */
export function ImagePicker({
  folder,
  value,
  onChange,
}: {
  folder: UploadFolder;
  value: { url: string | null; publicId: string | null };
  onChange: (next: { url: string | null; publicId: string | null }) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      {value.url ? (
        <img src={value.url} alt="" className="size-14 rounded-lg object-cover" />
      ) : (
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-lg border border-dashed border-line text-muted"
        >
          🖼
        </span>
      )}

      <div className="min-w-0 flex-1">
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            // Reset immediately so re-picking the same file after a failure still fires.
            event.target.value = "";
            if (!file) return;

            const invalid = validateImage(file);
            if (invalid) {
              setError(invalid);
              return;
            }

            setError(null);
            setUploading(true);
            try {
              const uploaded = await uploadImage(file, folder);
              onChange(uploaded);
            } catch (uploadError) {
              setError(
                uploadError instanceof ApiError
                  ? uploadError.message
                  : "Upload failed. Check that Cloudinary is configured on the server.",
              );
            } finally {
              setUploading(false);
            }
          }}
          className="w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-card2 file:px-3 file:py-1.5 file:text-xs file:text-sky"
        />
        {uploading ? <p className="mt-1 text-[0.65rem] text-sky">Uploading…</p> : null}
        {error ? <p className="mt-1 text-[0.65rem] text-rose">{error}</p> : null}
        {value.url && !uploading ? (
          <button
            onClick={() => onChange({ url: null, publicId: null })}
            className="mt-1 text-[0.65rem] text-muted hover:text-rose"
          >
            Remove image
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** The wrapper every panel uses, so headings and spacing stay identical across tabs. */
export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** A horizontally scrollable table shell — admin tables are wide and phones are not. */
export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[40rem] text-start text-sm">{children}</table>
    </div>
  );
}
