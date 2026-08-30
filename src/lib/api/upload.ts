import { media, type UploadFolder } from "./endpoints";
import { ApiError } from "./client";

/**
 * Uploads one image, browser → Cloudinary, using a signature minted by our API.
 *
 * The bytes never pass through the Spring Boot server. On a free-tier container that is
 * not an optimisation but a requirement: it has neither the memory to buffer several
 * multi-megabyte uploads nor a disk that survives a redeploy.
 *
 * Replaces `uploadImageToStorage()` + `compressImage()` from the original page, which
 * resized on a canvas before uploading to Firebase Storage. The resize now happens in
 * Cloudinary, inside the signed transformation, so it cannot be skipped by editing the
 * request.
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder,
): Promise<{ url: string; publicId: string }> {
  const signature = await media.sign(folder);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signature.apiKey);
  form.append("timestamp", String(signature.timestamp));
  form.append("folder", signature.folder);
  form.append("transformation", signature.transformation);
  form.append("signature", signature.signature);

  // Plain fetch, not the api client: this request goes to Cloudinary, so it must not
  // carry our Authorization header, and Cloudinary's error shape is its own.
  const response = await fetch(signature.uploadUrl, { method: "POST", body: form });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      if (payload.error?.message) detail = payload.error.message;
    } catch {
      /* keep the status line */
    }
    throw new ApiError(`Upload failed: ${detail}`, response.status);
  }

  const result = (await response.json()) as { secure_url: string; public_id: string };
  return { url: result.secure_url, publicId: result.public_id };
}

/** Client-side guard so an obviously-wrong file fails instantly instead of after a slow upload. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return `${file.name} is not an image.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name} is larger than 8 MB.`;
  }
  return null;
}
