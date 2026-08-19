"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AppErrorCode } from "@/lib/errors";

import { useAdminAuth } from "./auth-provider";

const schema = z.object({
  email: z.string().min(1, "emailRequired").email("emailInvalid"),
  password: z.string().min(6, "passwordMin"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const { signIn } = useAdminAuth();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [failure, setFailure] = useState<AppErrorCode | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setFailure(null);
    const outcome = await signIn(values.email, values.password);

    if (outcome.ok) {
      // The gate re-evaluates authorisation; an unauthorised account lands on
      // the "access denied" screen rather than the dashboard.
      router.replace("/admin");
      return;
    }

    const code = outcome.code ?? "unknown";
    setFailure(code);
    toast.error(tErrors(code));
  }

  const fieldClass = (invalid: boolean) =>
    cn(
      "h-12 w-full rounded-xl border bg-white px-4 text-sm text-ink-800 transition-colors",
      "placeholder:text-ink-400 focus:outline-none focus-visible:border-teal-600",
      invalid ? "border-accent-500" : "border-ink-300",
    );

  /** Zod messages are stored as i18n keys under `auth.validation`. */
  const fieldError = (key?: string) =>
    key ? t(`validation.${key}` as "validation.emailRequired") : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="admin-email" className="block text-sm font-semibold text-ink-700">
          {t("email")}
        </label>
        <input
          id="admin-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          dir="ltr"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "admin-email-error" : undefined}
          className={fieldClass(Boolean(errors.email))}
          {...register("email")}
        />
        {errors.email ? (
          <p id="admin-email-error" className="text-xs font-medium text-accent-700">
            {fieldError(errors.email.message)}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin-password"
          className="block text-sm font-semibold text-ink-700"
        >
          {t("password")}
        </label>
        {/* `dir="ltr"` on the wrapper makes the logical `end-*` / `pe-*` utilities
            resolve to the right-hand side, matching the LTR credential field
            inside an RTL page. */}
        <div className="relative" dir="ltr">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            dir="ltr"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "admin-password-error" : undefined}
            className={cn(fieldClass(Boolean(errors.password)), "pe-12")}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            className="absolute inset-y-0 flex w-12 items-center justify-center rounded-xl text-ink-500 transition-colors hover:text-teal-700 end-0"
          >
            {showPassword ? (
              <EyeOff className="size-4.5" aria-hidden />
            ) : (
              <Eye className="size-4.5" aria-hidden />
            )}
          </button>
        </div>
        {errors.password ? (
          <p id="admin-password-error" className="text-xs font-medium text-accent-700">
            {fieldError(errors.password.message)}
          </p>
        ) : null}
      </div>

      {failure ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-accent-50 px-3 py-2.5 text-sm text-accent-900"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {tErrors(failure)}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("submitting")}
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden />
            {t("submit")}
          </>
        )}
      </Button>
    </form>
  );
}
