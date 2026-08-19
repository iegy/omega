"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  BilingualField,
  Field,
  SelectInput,
  StringListField,
  SwitchInput,
  TextInput,
  cleanStringList,
} from "@/components/admin/form/fields";
import { ImageField } from "@/components/admin/form/image-field";
import { Button } from "@/components/ui/button";
import { slugify, slugSchema, toNullable } from "@/features/admin/shared";
import type { Specialty } from "@/types/catalog";
import type { Doctor } from "@/types/doctor";

/**
 * Create / edit form for one doctor.
 *
 * Uncontrolled-free and dependency-light on purpose: the shape is a handful of
 * strings, two string lists and a set of IDs, and hand-rolled state here is
 * smaller and clearer than wiring a form library through a bilingual pair.
 * Validation is the same Zod vocabulary used everywhere else (`slugSchema`).
 *
 * The rule that matters: **a blank optional field is saved as `null`.** The
 * clinic has real gaps — no photographs, no biographies for most doctors — and
 * `null` is how this project records "not supplied" so the public page hides
 * the element instead of printing an empty heading.
 */

export interface DoctorFormValues {
  nameAr: string;
  nameEn: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  bioAr: string;
  bioEn: string;
  qualificationsAr: string[];
  qualificationsEn: string[];
  specialtyIds: string[];
  imageUrl: string | null;
  imageDeleteUrl: string | null;
  active: boolean;
  featured: boolean;
  showPricePublicly: boolean;
  sortOrder: number;
}

export function emptyDoctorForm(sortOrder: number): DoctorFormValues {
  return {
    nameAr: "",
    nameEn: "",
    slug: "",
    titleAr: "",
    titleEn: "",
    bioAr: "",
    bioEn: "",
    qualificationsAr: [],
    qualificationsEn: [],
    specialtyIds: [],
    imageUrl: null,
    imageDeleteUrl: null,
    active: true,
    featured: false,
    showPricePublicly: true,
    sortOrder,
  };
}

export function doctorToForm(doctor: Doctor): DoctorFormValues {
  return {
    nameAr: doctor.nameAr,
    nameEn: doctor.nameEn,
    slug: doctor.slug,
    titleAr: doctor.titleAr ?? "",
    titleEn: doctor.titleEn ?? "",
    bioAr: doctor.bioAr ?? "",
    bioEn: doctor.bioEn ?? "",
    qualificationsAr: [...doctor.qualificationsAr],
    qualificationsEn: [...doctor.qualificationsEn],
    specialtyIds: [...doctor.specialtyIds],
    imageUrl: doctor.imageUrl,
    imageDeleteUrl: doctor.imageDeleteUrl,
    active: doctor.active,
    featured: doctor.featured,
    showPricePublicly: doctor.showPricePublicly,
    sortOrder: doctor.sortOrder,
  };
}

/** The Firestore payload. Blank optional fields become `null`, never `""`. */
export function formToDoctorPayload(values: DoctorFormValues): Record<string, unknown> {
  return {
    nameAr: values.nameAr.trim(),
    nameEn: values.nameEn.trim(),
    slug: values.slug.trim(),
    titleAr: toNullable(values.titleAr),
    titleEn: toNullable(values.titleEn),
    bioAr: toNullable(values.bioAr),
    bioEn: toNullable(values.bioEn),
    qualificationsAr: cleanStringList(values.qualificationsAr),
    qualificationsEn: cleanStringList(values.qualificationsEn),
    specialtyIds: values.specialtyIds,
    imageUrl: values.imageUrl,
    imageDeleteUrl: values.imageDeleteUrl,
    active: values.active,
    featured: values.featured,
    showPricePublicly: values.showPricePublicly,
    sortOrder: values.sortOrder,
  };
}

export type DoctorFormErrors = Partial<Record<
  "nameAr" | "nameEn" | "slug" | "specialtyIds",
  string
>>;

export function validateDoctorForm(
  values: DoctorFormValues,
  messages: { required: string; invalidSlug: string; specialtyRequired: string },
): DoctorFormErrors {
  const errors: DoctorFormErrors = {};

  if (values.nameAr.trim() === "") errors.nameAr = messages.required;
  if (values.nameEn.trim() === "") errors.nameEn = messages.required;
  if (!slugSchema.safeParse(values.slug).success) errors.slug = messages.invalidSlug;
  if (values.specialtyIds.length === 0) errors.specialtyIds = messages.specialtyRequired;

  return errors;
}

/* -------------------------------------------------------------------------- */

export function DoctorForm({
  values,
  errors,
  specialties,
  saving,
  isNew,
  onChange,
  onSubmit,
  onCancel,
}: {
  values: DoctorFormValues;
  errors: DoctorFormErrors;
  specialties: Specialty[];
  saving: boolean;
  isNew: boolean;
  onChange: (values: DoctorFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("adminDoctors");
  const tf = useTranslations("adminForm");
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const set = <K extends keyof DoctorFormValues>(key: K, value: DoctorFormValues[K]) =>
    onChange({ ...values, [key]: value });

  /** New doctors get a slug suggested from the English name until it is edited. */
  const setEnglishName = (nameEn: string) => {
    onChange({
      ...values,
      nameEn,
      slug: slugTouched ? values.slug : slugify(nameEn),
    });
  };

  const toggleSpecialty = (id: string) => {
    const next = values.specialtyIds.includes(id)
      ? values.specialtyIds.filter((entry) => entry !== id)
      : [...values.specialtyIds, id];
    set("specialtyIds", next);
  };

  return (
    <form
      className="space-y-7"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <BilingualField
        idPrefix="doctor-name"
        label={t("name")}
        required
        arValue={values.nameAr}
        enValue={values.nameEn}
        onArChange={(value) => set("nameAr", value)}
        onEnChange={setEnglishName}
        arError={errors.nameAr}
        enError={errors.nameEn}
      />

      <Field
        label="Slug"
        htmlFor="doctor-slug"
        error={errors.slug}
        hint={tf("slugHint")}
        required
      >
        <TextInput
          id="doctor-slug"
          dir="ltr"
          value={values.slug}
          error={errors.slug}
          onChange={(event) => {
            setSlugTouched(true);
            set("slug", event.target.value);
          }}
        />
      </Field>

      <BilingualField
        idPrefix="doctor-title"
        label={t("jobTitle")}
        hint={tf("optional")}
        arValue={values.titleAr}
        enValue={values.titleEn}
        onArChange={(value) => set("titleAr", value)}
        onEnChange={(value) => set("titleEn", value)}
      />

      <BilingualField
        idPrefix="doctor-bio"
        label={t("bio")}
        hint={tf("optional")}
        multiline
        rows={4}
        arValue={values.bioAr}
        enValue={values.bioEn}
        onArChange={(value) => set("bioAr", value)}
        onEnChange={(value) => set("bioEn", value)}
      />

      {/* Specialties — checkboxes rather than a multi-select, because a
          multi-select on a phone hides what is already chosen. */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink-800">
          {t("specialties")}
          <span className="text-accent-600" aria-hidden>
            {" *"}
          </span>
        </legend>
        <p className="text-xs text-muted-foreground">{t("specialtiesHint")}</p>

        <ul className="grid gap-2 sm:grid-cols-2">
          {specialties.map((specialty) => (
            <li key={specialty.id}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm transition-colors hover:border-teal-600/40">
                <input
                  type="checkbox"
                  checked={values.specialtyIds.includes(specialty.id)}
                  onChange={() => toggleSpecialty(specialty.id)}
                  className="size-4 shrink-0 accent-teal-600"
                />
                <span className="min-w-0 truncate text-ink-800">{specialty.nameAr}</span>
              </label>
            </li>
          ))}
        </ul>

        {errors.specialtyIds ? (
          <p role="alert" className="text-xs font-medium text-accent-700">
            {errors.specialtyIds}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <StringListField
          idPrefix="doctor-qual-ar"
          label={t("qualificationsAr")}
          values={values.qualificationsAr}
          onChange={(next) => set("qualificationsAr", next)}
          dir="rtl"
          addLabel={tf("addLine")}
          removeLabel={tf("removeLine")}
        />
        <StringListField
          idPrefix="doctor-qual-en"
          label={t("qualificationsEn")}
          values={values.qualificationsEn}
          onChange={(next) => set("qualificationsEn", next)}
          dir="ltr"
          addLabel={tf("addLine")}
          removeLabel={tf("removeLine")}
        />
      </div>

      <ImageField
        label={t("image")}
        value={values.imageUrl}
        deleteUrl={values.imageDeleteUrl}
        aspect="portrait"
        onChange={(image) =>
          onChange({
            ...values,
            imageUrl: image?.url ?? null,
            imageDeleteUrl: image?.deleteUrl ?? null,
          })
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <SwitchInput
          id="doctor-active"
          label={t("activeLabel")}
          checked={values.active}
          onChange={(checked) => set("active", checked)}
        />
        <SwitchInput
          id="doctor-featured"
          label={t("featured")}
          description={t("featuredHint")}
          checked={values.featured}
          onChange={(checked) => set("featured", checked)}
        />
        <SwitchInput
          id="doctor-show-price"
          label={t("showPrice")}
          description={t("showPriceHint")}
          checked={values.showPricePublicly}
          onChange={(checked) => set("showPricePublicly", checked)}
        />
        <Field label={t("sortOrder")} htmlFor="doctor-sort">
          <SelectInput
            id="doctor-sort"
            value={String(values.sortOrder)}
            onChange={(event) => set("sortOrder", Number(event.target.value))}
          >
            {Array.from({ length: 40 }, (_, index) => (index + 1) * 10).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <p className="text-xs text-muted-foreground">{tf("nullNote")}</p>

      <div className="flex flex-wrap justify-end gap-2 border-t border-ink-200/70 pt-5">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          {tf("cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? tf("saving") : tf("save")}
        </Button>
      </div>
    </form>
  );
}
