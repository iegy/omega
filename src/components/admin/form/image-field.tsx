"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  uploadImageToImgbb,
  type UploadedImage,
} from "@/lib/imgbb";
import { cn } from "@/lib/utils";

/**
 * ImgBB image picker for the dashboard.
 *
 * The stored value is always **just the URL** (plus ImgBB's delete URL, kept so
 * a replaced upload can be revoked later). No base64 ever reaches Firestore, and
 * no image is copied into Firebase Storage, R2 or Cloudflare Images — ImgBB
 * stays the image host (spec C / BJ).
 *
 * Removing an image sets the field to `null`, which is what makes the public
 * site fall back to its neutral monogram rather than a broken frame.
 */
export function ImageField({
  label,
  value,
  deleteUrl,
  onChange,
  hint,
  aspect = "square",
}: {
  label: string;
  value: string | null;
  deleteUrl?: string | null;
  onChange: (image: UploadedImage | null) => void;
  hint?: string;
  aspect?: "square" | "portrait" | "wide";
}) {
  const t = useTranslations("adminImage");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploading = progress !== null;

  const aspectClass = {
    square: "aspect-square",
    portrait: "aspect-4/5",
    wide: "aspect-16/9",
  }[aspect];

  async function handleFile(file: File) {
    setError(null);
    setProgress(0);

    const result = await uploadImageToImgbb(file, { onProgress: setProgress });

    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";

    if (!result.ok) {
      setError(
        t(
          result.error === "size"
            ? "errorSize"
            : result.error === "type"
              ? "errorType"
              : result.error === "notConfigured"
                ? "errorNotConfigured"
                : "errorUpload",
          { max: Math.round(MAX_IMAGE_BYTES / (1024 * 1024)) },
        ),
      );
      return;
    }

    onChange(result.image);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink-700">{label}</p>

      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "relative w-32 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-surface-muted",
            aspectClass,
          )}
        >
          {value ? (
            <Image
              src={value}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-full items-center justify-center text-ink-300">
              <ImagePlus className="size-6" aria-hidden />
            </span>
          )}

          {uploading ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/85 text-xs font-semibold text-teal-700">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {progress}%
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            disabled={uploading}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden />
              {value ? t("replace") : t("upload")}
            </Button>

            {value ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                {t("remove")}
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            {hint ?? t("hint", { max: Math.round(MAX_IMAGE_BYTES / (1024 * 1024)) })}
          </p>

          {value && deleteUrl ? (
            <p className="text-xs text-muted-foreground">
              <a
                href={deleteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-teal-700"
              >
                {t("manageOnImgbb")}
              </a>
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="text-xs font-medium text-accent-700">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
