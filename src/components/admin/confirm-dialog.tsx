"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Confirmation for a destructive action.
 *
 * Two levels, because the two actions carry very different risk:
 *
 * - `variant="warn"` — hiding a record. Reversible, so a single click confirms.
 * - `variant="danger"` — permanent deletion. The administrator must **type** a
 *   word before the button enables. Clinic records are referenced by schedules,
 *   prices and (from Phase 6) appointments, so this is the action that can
 *   actually lose data, and it should be impossible to trigger by reflex.
 *
 * Rendered as a real `<dialog>`: focus trapping, Escape and the backdrop come
 * from the platform rather than from a dependency, which keeps the Worker
 * bundle small.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmWord,
  variant = "warn",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  /** When set, the exact word the administrator must type to enable confirm. */
  confirmWord?: string;
  variant?: "warn" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("adminConfirm");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputId = useId();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const needsWord = Boolean(confirmWord);
  const canConfirm = !busy && (!needsWord || typed.trim() === confirmWord);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        setTyped("");
        onCancel();
      }}
      onClose={() => {
        // Clearing here rather than in an effect: `close` is a real event, and
        // React 19 rightly objects to synchronous setState inside an effect.
        setTyped("");
        onCancel();
      }}
      className={cn(
        "w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-ink-200 bg-white p-0 shadow-lift",
        "backdrop:bg-ink-900/40 backdrop:backdrop-blur-[2px]",
        "m-auto text-ink-800",
      )}
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              variant === "danger"
                ? "bg-accent-50 text-accent-700"
                : "bg-teal-50 text-teal-700",
            )}
          >
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink-900">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {needsWord && confirmWord ? (
          <div className="space-y-1.5">
            <label htmlFor={inputId} className="block text-sm font-medium text-ink-700">
              {t("deleteTypePrompt", { word: confirmWord })}
            </label>
            <input
              id={inputId}
              value={typed}
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm outline-none focus-visible:border-accent-600 focus-visible:ring-2 focus-visible:ring-accent-600/20"
            />
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {t("cancel")}
          </Button>
          <Button
            variant={variant === "danger" ? "cta" : "primary"}
            onClick={() => {
              setTyped("");
              onConfirm();
            }}
            disabled={!canConfirm}
          >
            {confirmLabel ?? t("confirm")}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
