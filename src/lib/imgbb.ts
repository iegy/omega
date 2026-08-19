import { imgbbApiKey } from "@/firebase/env";

/**
 * ImgBB image hosting.
 *
 * Every uploaded image in this project lives on ImgBB and only its URL is
 * stored in Firestore — never base64, never Firebase Storage, never R2 or
 * Cloudflare Images (spec C / BJ).
 *
 * The key is intentionally client-visible: uploads happen from the dashboard in
 * the browser, and the project owner accepted this trade-off (spec C).
 */

export const IMGBB_UPLOAD_ENDPOINT = "https://api.imgbb.com/1/upload";

export interface ImgbbConfig {
  apiKey: string;
  endpoint: string;
}

export function getImgbbConfig(): ImgbbConfig | null {
  if (!imgbbApiKey) return null;
  return { apiKey: imgbbApiKey, endpoint: IMGBB_UPLOAD_ENDPOINT };
}

/**
 * What every uploader must return and every model stores: the display URL plus
 * the delete URL, never base64 and never a Firebase Storage path (spec C / BJ).
 */
export interface UploadedImage {
  url: string;
  deleteUrl: string | null;
  imageId: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Client-side validation                                                     */
/* -------------------------------------------------------------------------- */

/** ImgBB accepts these; anything else is rejected before a byte is sent. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * 5 MB.
 *
 * ImgBB itself allows more, but a clinic photograph has no business being
 * larger, and the upload happens over whatever connection the receptionist has.
 * Rejecting early gives an instant, understandable error instead of a long
 * upload that fails.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageValidationError = "type" | "size" | "notConfigured";

export function validateImageFile(file: File): ImageValidationError | null {
  if (!getImgbbConfig()) return "notConfigured";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "type";
  }
  if (file.size > MAX_IMAGE_BYTES) return "size";
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Upload                                                                     */
/* -------------------------------------------------------------------------- */

export type UploadResult =
  | { ok: true; image: UploadedImage }
  | { ok: false; error: ImageValidationError | "network" | "rejected" };

interface ImgbbResponse {
  success?: boolean;
  data?: {
    url?: string;
    display_url?: string;
    delete_url?: string;
    id?: string;
  };
}

/**
 * Uploads one file to ImgBB and returns the URL to persist.
 *
 * `XMLHttpRequest` rather than `fetch`, purely because it reports upload
 * progress — a receptionist on a slow connection needs to see that something is
 * happening, and `fetch` still cannot report request-body progress.
 *
 * The delete URL is stored alongside the image so the dashboard can revoke a
 * replaced upload later instead of leaving it orphaned on ImgBB.
 */
export function uploadImageToImgbb(
  file: File,
  { onProgress }: { onProgress?: (percent: number) => void } = {},
): Promise<UploadResult> {
  const invalid = validateImageFile(file);
  if (invalid) return Promise.resolve({ ok: false, error: invalid });

  const config = getImgbbConfig();
  if (!config) return Promise.resolve({ ok: false, error: "notConfigured" });

  return new Promise<UploadResult>((resolve) => {
    const body = new FormData();
    body.append("image", file);

    const request = new XMLHttpRequest();
    request.open("POST", `${config.endpoint}?key=${encodeURIComponent(config.apiKey)}`);

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    request.addEventListener("error", () => resolve({ ok: false, error: "network" }));
    request.addEventListener("abort", () => resolve({ ok: false, error: "network" }));

    request.addEventListener("load", () => {
      try {
        const parsed = JSON.parse(request.responseText) as ImgbbResponse;
        const url = parsed.data?.display_url ?? parsed.data?.url;

        if (request.status >= 200 && request.status < 300 && parsed.success && url) {
          onProgress?.(100);
          resolve({
            ok: true,
            image: {
              url,
              deleteUrl: parsed.data?.delete_url ?? null,
              imageId: parsed.data?.id ?? null,
            },
          });
          return;
        }
      } catch {
        // fall through to the rejection below
      }
      resolve({ ok: false, error: "rejected" });
    });

    request.send(body);
  });
}
