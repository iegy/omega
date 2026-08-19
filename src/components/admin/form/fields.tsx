"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Form primitives for the Admin Dashboard.
 *
 * Two rules shape all of them:
 *
 * 1. **Every field is labelled and every error is announced.** Reception staff
 *    use this on a phone, sometimes one-handed, in Arabic. Labels are real
 *    `<label for>`, errors carry `aria-describedby` + `aria-invalid`, and
 *    nothing depends on colour alone.
 * 2. **Blank means `null`, not `""`.** Throughout this project a missing value
 *    is recorded as `null` because it means "the clinic has not supplied this",
 *    and the public site hides the element rather than inventing one. An empty
 *    string would quietly become published emptiness.
 */

const fieldBase =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 " +
  "outline-none transition-colors placeholder:text-ink-400 " +
  "focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600/20 " +
  "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400";

const fieldInvalid = "border-accent-500 focus-visible:border-accent-600";

/** `""` / whitespace → `null`. Use for every optional stored string. */
export function blankToNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

/** `""` → `null`; otherwise a finite number, or `null` when unparseable. */
export function blankToNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/* -------------------------------------------------------------------------- */
/*  Field shell                                                                */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
        {label}
        {required ? (
          <span className="text-accent-600" aria-hidden>
            {" *"}
          </span>
        ) : null}
      </label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-accent-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface BaseProps {
  id: string;
  error?: string;
  hint?: string;
}

/* -------------------------------------------------------------------------- */
/*  Inputs                                                                     */
/* -------------------------------------------------------------------------- */

export function TextInput({
  id,
  error,
  dir,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      id={id}
      dir={dir}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : props.placeholder ? `${id}-hint` : undefined}
      className={cn(fieldBase, error && fieldInvalid)}
      {...props}
    />
  );
}

export function TextAreaInput({
  id,
  error,
  rows = 4,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(fieldBase, "resize-y leading-relaxed", error && fieldInvalid)}
      {...props}
    />
  );
}

export function SelectInput({
  id,
  error,
  children,
  ...props
}: BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cn(fieldBase, error && fieldInvalid)}
      {...props}
    >
      {children}
    </select>
  );
}

/**
 * A labelled on/off control.
 *
 * A real `<input type="checkbox">` under the styling, so it is keyboard
 * operable, announced correctly and works before hydration.
 */
export function SwitchInput({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 bg-white p-3.5",
        "transition-colors hover:border-teal-600/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4.5 shrink-0 accent-teal-600"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bilingual pair                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Arabic and English side by side.
 *
 * Every patient-visible string in this project exists in both languages, so
 * editing them as a pair — with the correct `dir` on each box — is the only
 * shape that makes the requirement obvious to whoever is typing.
 */
export function BilingualField({
  idPrefix,
  label,
  arValue,
  enValue,
  onArChange,
  onEnChange,
  arError,
  enError,
  required,
  multiline,
  rows,
  hint,
}: {
  idPrefix: string;
  label: string;
  arValue: string;
  enValue: string;
  onArChange: (value: string) => void;
  onEnChange: (value: string) => void;
  arError?: string;
  enError?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  const t = useTranslations("adminForm");

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-ink-800">
        {label}
        {required ? (
          <span className="text-accent-600" aria-hidden>
            {" *"}
          </span>
        ) : null}
      </legend>

      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("arabic")} htmlFor={`${idPrefix}-ar`} error={arError}>
          {multiline ? (
            <TextAreaInput
              id={`${idPrefix}-ar`}
              dir="rtl"
              rows={rows}
              value={arValue}
              error={arError}
              onChange={(event) => onArChange(event.target.value)}
            />
          ) : (
            <TextInput
              id={`${idPrefix}-ar`}
              dir="rtl"
              value={arValue}
              error={arError}
              onChange={(event) => onArChange(event.target.value)}
            />
          )}
        </Field>

        <Field label={t("english")} htmlFor={`${idPrefix}-en`} error={enError}>
          {multiline ? (
            <TextAreaInput
              id={`${idPrefix}-en`}
              dir="ltr"
              rows={rows}
              value={enValue}
              error={enError}
              onChange={(event) => onEnChange(event.target.value)}
            />
          ) : (
            <TextInput
              id={`${idPrefix}-en`}
              dir="ltr"
              value={enValue}
              error={enError}
              onChange={(event) => onEnChange(event.target.value)}
            />
          )}
        </Field>
      </div>
    </fieldset>
  );
}

/* -------------------------------------------------------------------------- */
/*  Repeatable list of lines                                                   */
/* -------------------------------------------------------------------------- */

/**
 * An editable list of free-text lines — a doctor's qualifications, for example.
 *
 * Empty rows are dropped on save rather than stored, so an accidental extra row
 * never becomes a blank bullet on the public profile.
 */
export function StringListField({
  idPrefix,
  label,
  values,
  onChange,
  dir,
  addLabel,
  removeLabel,
  hint,
}: {
  idPrefix: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  dir?: "rtl" | "ltr";
  addLabel: string;
  removeLabel: string;
  hint?: string;
}) {
  const update = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink-700">{label}</legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      <ul className="space-y-2">
        {values.map((value, index) => (
          <li key={index} className="flex items-center gap-2">
            <input
              id={`${idPrefix}-${index}`}
              dir={dir}
              value={value}
              aria-label={`${label} ${index + 1}`}
              onChange={(event) => update(index, event.target.value)}
              className={fieldBase}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label={removeLabel}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-accent-50 hover:text-accent-700"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-teal-700 transition-colors hover:bg-teal-50"
      >
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </button>
    </fieldset>
  );
}

/** Drops blank rows and trims the rest. */
export function cleanStringList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value !== "");
}
