"use client";

import { ArrowLeft, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AdminListState,
  AdminRecordCard,
  AdminRecordList,
  AdminToolbar,
} from "@/components/admin/admin-list";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  BilingualField,
  Field,
  SelectInput,
  SwitchInput,
  TextInput,
} from "@/components/admin/form/fields";
import { ImageField } from "@/components/admin/form/image-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reportWrite, slugify, slugSchema, toNullable } from "@/features/admin/shared";
import { useAdminData } from "@/features/admin/use-admin-data";
import { normalizeSearchText } from "@/features/doctors/doctor-search";
import {
  createDocument,
  deleteDocument,
  setRecordActive,
  updateDocument,
} from "@/services/admin-writes";
import { PUBLIC_CACHE_TTL_MINUTES } from "@/services/public-cache";

/**
 * One screen for every "name + description + slug + visibility" collection.
 *
 * Specialties, service categories and laboratory units are the same record with
 * different labels, so they share one implementation rather than three
 * near-identical files. Anything genuinely different — a doctor's schedules, a
 * service's doctor links, an offer's date window — gets its own screen.
 *
 * The behaviour that matters is the same everywhere:
 *   · blank optional fields are stored as `null`, never `""`;
 *   · "delete" means **hide** by default, because these records are referenced
 *     by doctors and services;
 *   · permanent deletion needs a typed confirmation.
 */

/** The shape every collection handled here has in common. */
export interface SimpleEntity {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  active: boolean;
  sortOrder: number;
  featured?: boolean;
  imageUrl?: string | null;
  imageDeleteUrl?: string | null;
}

export interface SimpleEntityLabels {
  addTitle: string;
  editTitle: string;
  nameLabel: string;
  descriptionLabel: string;
  /** Omit to hide the image field (service categories have no image). */
  imageLabel?: string;
  /** Omit to hide the "featured" switch. */
  featuredLabel?: string;
}

interface FormValues {
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr: string;
  descriptionEn: string;
  active: boolean;
  featured: boolean;
  sortOrder: number;
  imageUrl: string | null;
  imageDeleteUrl: string | null;
}

function toForm(entity: SimpleEntity): FormValues {
  return {
    nameAr: entity.nameAr,
    nameEn: entity.nameEn,
    slug: entity.slug,
    descriptionAr: entity.descriptionAr ?? "",
    descriptionEn: entity.descriptionEn ?? "",
    active: entity.active,
    featured: entity.featured ?? false,
    sortOrder: entity.sortOrder,
    imageUrl: entity.imageUrl ?? null,
    imageDeleteUrl: entity.imageDeleteUrl ?? null,
  };
}

function emptyForm(sortOrder: number): FormValues {
  return {
    nameAr: "",
    nameEn: "",
    slug: "",
    descriptionAr: "",
    descriptionEn: "",
    active: true,
    featured: false,
    sortOrder,
    imageUrl: null,
    imageDeleteUrl: null,
  };
}

export function SimpleEntityScreen({
  collectionName,
  load,
  labels,
  supportsImage = false,
  supportsFeatured = false,
}: {
  collectionName: string;
  /** Must be stable — wrap in `useCallback` at the call site. */
  load: () => Promise<SimpleEntity[]>;
  labels: SimpleEntityLabels;
  supportsImage?: boolean;
  supportsFeatured?: boolean;
}) {
  const tf = useTranslations("adminForm");
  const tl = useTranslations("adminList");
  const tc = useTranslations("adminConfirm");
  const te = useTranslations("errors");
  const tcache = useTranslations("publicCache");

  const records = useAdminData<SimpleEntity[]>(load);

  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(true);
  const [editing, setEditing] = useState<{ id: string | null; values: FormValues } | null>(
    null,
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"nameAr" | "nameEn" | "slug", string>>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SimpleEntity | null>(null);

  const visible = useMemo(() => {
    const needle = normalizeSearchText(search);
    return (records.data ?? [])
      .filter((entity) => (showHidden ? true : entity.active))
      .filter((entity) =>
        needle
          ? normalizeSearchText(`${entity.nameAr} ${entity.nameEn} ${entity.slug}`).includes(
              needle,
            )
          : true,
      );
  }, [records.data, search, showHidden]);

  const feedback = {
    saved: tf("saved"),
    savedDescription: tcache("savedDescription"),
    failed: tf("saveFailed"),
    describeError: (code: string) => te(code as never),
  };

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    if (!editing) return;
    setEditing({ ...editing, values: { ...editing.values, [key]: value } });
  };

  async function handleSubmit() {
    if (!editing) return;
    const { values } = editing;

    const found: typeof errors = {};
    if (values.nameAr.trim() === "") found.nameAr = tf("required");
    if (values.nameEn.trim() === "") found.nameEn = tf("required");
    if (!slugSchema.safeParse(values.slug).success) found.slug = tf("invalidSlug");
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload: Record<string, unknown> = {
      nameAr: values.nameAr.trim(),
      nameEn: values.nameEn.trim(),
      slug: values.slug.trim(),
      descriptionAr: toNullable(values.descriptionAr),
      descriptionEn: toNullable(values.descriptionEn),
      active: values.active,
      sortOrder: values.sortOrder,
    };
    if (supportsFeatured) payload.featured = values.featured;
    if (supportsImage) {
      payload.imageUrl = values.imageUrl;
      payload.imageDeleteUrl = values.imageDeleteUrl;
    }

    setSaving(true);
    const result = editing.id
      ? await updateDocument(collectionName, editing.id, payload)
      : await createDocument(collectionName, payload);
    setSaving(false);

    if (reportWrite(result, feedback)) {
      setEditing(null);
      setErrors({});
      records.reload();
    }
  }

  async function handleToggleActive(entity: SimpleEntity) {
    const result = await setRecordActive(collectionName, entity.id, !entity.active);
    if (reportWrite(result, feedback)) records.reload();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    const result = await deleteDocument(collectionName, pendingDelete.id);
    setSaving(false);
    setPendingDelete(null);
    if (reportWrite(result, feedback)) records.reload();
  }

  /* ── Form ───────────────────────────────────────────────────────────────── */

  if (editing) {
    const { values } = editing;

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-ink-900">
            {editing.id ? labels.editTitle : labels.addTitle}
          </h3>
          <Button variant="ghost" onClick={() => setEditing(null)}>
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            {tf("cancel")}
          </Button>
        </div>

        <form
          className="space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <BilingualField
            idPrefix="entity-name"
            label={labels.nameLabel}
            required
            arValue={values.nameAr}
            enValue={values.nameEn}
            onArChange={(value) => set("nameAr", value)}
            onEnChange={(value) => {
              if (!editing) return;
              setEditing({
                ...editing,
                values: {
                  ...values,
                  nameEn: value,
                  slug: slugTouched || editing.id ? values.slug : slugify(value),
                },
              });
            }}
            arError={errors.nameAr}
            enError={errors.nameEn}
          />

          <Field
            label="Slug"
            htmlFor="entity-slug"
            error={errors.slug}
            hint={tf("slugHint")}
            required
          >
            <TextInput
              id="entity-slug"
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
            idPrefix="entity-description"
            label={labels.descriptionLabel}
            hint={tf("optional")}
            multiline
            rows={3}
            arValue={values.descriptionAr}
            enValue={values.descriptionEn}
            onArChange={(value) => set("descriptionAr", value)}
            onEnChange={(value) => set("descriptionEn", value)}
          />

          {supportsImage && labels.imageLabel ? (
            <ImageField
              label={labels.imageLabel}
              value={values.imageUrl}
              deleteUrl={values.imageDeleteUrl}
              aspect="wide"
              onChange={(image) => {
                if (!editing) return;
                setEditing({
                  ...editing,
                  values: {
                    ...values,
                    imageUrl: image?.url ?? null,
                    imageDeleteUrl: image?.deleteUrl ?? null,
                  },
                });
              }}
            />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <SwitchInput
              id="entity-active"
              label={tl("active")}
              checked={values.active}
              onChange={(checked) => set("active", checked)}
            />
            {supportsFeatured && labels.featuredLabel ? (
              <SwitchInput
                id="entity-featured"
                label={labels.featuredLabel}
                checked={values.featured}
                onChange={(checked) => set("featured", checked)}
              />
            ) : null}
            <Field label={tl("actions")} htmlFor="entity-sort">
              <SelectInput
                id="entity-sort"
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
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              {tf("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? tf("saving") : tf("save")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  /* ── List ───────────────────────────────────────────────────────────────── */

  const nextSortOrder = ((records.data?.length ?? 0) + 1) * 10;

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-teal-600/20 bg-teal-50/60 px-4 py-3 text-sm leading-relaxed text-teal-900">
        <strong className="font-semibold">
          {tcache("noticeTitle", { minutes: PUBLIC_CACHE_TTL_MINUTES })}
        </strong>{" "}
        {tcache("noticeDescription")}
      </p>

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        count={visible.length}
        showHidden={showHidden}
        onShowHiddenChange={setShowHidden}
        busy={records.loading}
        onReload={records.reload}
        onAdd={() => {
          setErrors({});
          setSlugTouched(false);
          setEditing({ id: null, values: emptyForm(nextSortOrder) });
        }}
      />

      <AdminListState
        loading={records.loading}
        error={records.error}
        isEmpty={visible.length === 0}
        onRetry={records.reload}
      >
        <AdminRecordList>
          {visible.map((entity) => (
            <AdminRecordCard
              key={entity.id}
              title={entity.nameAr}
              subtitle={entity.descriptionAr ?? entity.nameEn}
              active={entity.active}
              meta={
                entity.featured && labels.featuredLabel ? (
                  <Badge tone="accent">{labels.featuredLabel}</Badge>
                ) : undefined
              }
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setErrors({});
                      setSlugTouched(true);
                      setEditing({ id: entity.id, values: toForm(entity) });
                    }}
                  >
                    <Pencil className="size-4" aria-hidden />
                    {tl("edit")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleToggleActive(entity)}
                  >
                    {entity.active ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                    {entity.active ? tl("deactivate") : tl("activate")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(entity)}
                    aria-label={tl("delete")}
                  >
                    <Trash2 className="size-4 text-accent-600" aria-hidden />
                  </Button>
                </>
              }
            />
          ))}
        </AdminRecordList>
      </AdminListState>

      <ConfirmDialog
        open={pendingDelete !== null}
        variant="danger"
        title={tc("deleteTitle")}
        description={tc("deleteDescription")}
        confirmWord={tc("deleteWord")}
        confirmLabel={tl("delete")}
        busy={saving}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
