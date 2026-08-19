"use client";

import { ArrowLeft, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import {
  AdminListState,
  AdminRecordCard,
  AdminRecordList,
  AdminToolbar,
} from "@/components/admin/admin-list";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EntityImage } from "@/components/public/entity-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/features/admin/use-admin-data";
import { reportWrite } from "@/features/admin/shared";
import { normalizeSearchText } from "@/features/doctors/doctor-search";
import { PUBLIC_CACHE_TTL_MINUTES } from "@/services/public-cache";
import {
  createDocument,
  deleteDocument,
  setRecordActive,
  updateDocument,
} from "@/services/admin-writes";
import { listAllSpecialties } from "@/services/catalog";
import { listAllDoctors } from "@/services/doctors";
import { COLLECTIONS } from "@/config/constants";
import type { Doctor } from "@/types/doctor";
import type { Specialty } from "@/types/catalog";

import {
  DoctorForm,
  doctorToForm,
  emptyDoctorForm,
  formToDoctorPayload,
  validateDoctorForm,
  type DoctorFormErrors,
  type DoctorFormValues,
} from "./doctor-form";

/**
 * Admin → Doctors.
 *
 * Reads run in the browser as the signed-in administrator, so `firestore.rules`
 * is the boundary that actually decides what is visible and writable —
 * `PermissionGate` only decides which controls are rendered.
 *
 * "Delete" defaults to **hiding**: doctors are referenced by schedules, prices,
 * services and (from Phase 6) appointments, so removing the document would
 * orphan them. Permanent deletion exists, behind a typed confirmation.
 */
export function DoctorsScreen() {
  const t = useTranslations("adminDoctors");
  const tf = useTranslations("adminForm");
  const tl = useTranslations("adminList");
  const tc = useTranslations("adminConfirm");
  const te = useTranslations("errors");
  const tcache = useTranslations("publicCache");

  const loadDoctors = useCallback(() => listAllDoctors(), []);
  const loadSpecialties = useCallback(() => listAllSpecialties(), []);

  const doctors = useAdminData<Doctor[]>(loadDoctors);
  const specialties = useAdminData<Specialty[]>(loadSpecialties);

  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(true);
  const [editing, setEditing] = useState<{ id: string | null; values: DoctorFormValues } | null>(
    null,
  );
  const [errors, setErrors] = useState<DoctorFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Doctor | null>(null);

  const specialtyList = useMemo(() => specialties.data ?? [], [specialties.data]);
  const specialtyById = useMemo(
    () => new Map(specialtyList.map((specialty) => [specialty.id, specialty])),
    [specialtyList],
  );

  const visible = useMemo(() => {
    const needle = normalizeSearchText(search);
    return (doctors.data ?? [])
      .filter((doctor) => (showHidden ? true : doctor.active))
      .filter((doctor) => {
        if (!needle) return true;
        return normalizeSearchText(
          [doctor.nameAr, doctor.nameEn, doctor.titleAr, doctor.titleEn, doctor.slug]
            .filter(Boolean)
            .join(" "),
        ).includes(needle);
      });
  }, [doctors.data, search, showHidden]);

  const nextSortOrder = ((doctors.data?.length ?? 0) + 1) * 10;

  const feedback = {
    saved: tf("saved"),
    savedDescription: tcache("savedDescription"),
    failed: tf("saveFailed"),
    describeError: (code: string) => te(code as never),
  };

  async function handleSubmit() {
    if (!editing) return;

    const found = validateDoctorForm(editing.values, {
      required: tf("required"),
      invalidSlug: tf("invalidSlug"),
      specialtyRequired: t("specialtyRequired"),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const payload = formToDoctorPayload(editing.values);
    const result = editing.id
      ? await updateDocument(COLLECTIONS.doctors, editing.id, payload)
      : await createDocument(COLLECTIONS.doctors, payload);
    setSaving(false);

    if (reportWrite(result, feedback)) {
      setEditing(null);
      setErrors({});
      doctors.reload();
    }
  }

  async function handleToggleActive(doctor: Doctor) {
    const result = await setRecordActive(COLLECTIONS.doctors, doctor.id, !doctor.active);
    if (reportWrite(result, feedback)) doctors.reload();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    const result = await deleteDocument(COLLECTIONS.doctors, pendingDelete.id);
    setSaving(false);
    setPendingDelete(null);
    if (reportWrite(result, feedback)) doctors.reload();
  }

  /* ── Form view ──────────────────────────────────────────────────────────── */

  if (editing) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-ink-900">
            {editing.id ? t("editTitle") : t("addTitle")}
          </h3>
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(null);
              setErrors({});
            }}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            {tf("cancel")}
          </Button>
        </div>

        <DoctorForm
          values={editing.values}
          errors={errors}
          specialties={specialtyList}
          saving={saving}
          isNew={editing.id === null}
          onChange={(values) => setEditing({ ...editing, values })}
          onSubmit={() => void handleSubmit()}
          onCancel={() => {
            setEditing(null);
            setErrors({});
          }}
        />
      </div>
    );
  }

  /* ── List view ──────────────────────────────────────────────────────────── */

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
        busy={doctors.loading}
        onReload={doctors.reload}
        onAdd={() => {
          setErrors({});
          setEditing({ id: null, values: emptyDoctorForm(nextSortOrder) });
        }}
      />

      <AdminListState
        loading={doctors.loading}
        error={doctors.error}
        isEmpty={visible.length === 0}
        onRetry={doctors.reload}
      >
        <AdminRecordList>
          {visible.map((doctor) => (
            <AdminRecordCard
              key={doctor.id}
              title={doctor.nameAr}
              subtitle={doctor.titleAr}
              active={doctor.active}
              leading={
                <EntityImage
                  src={doctor.imageUrl}
                  alt={doctor.nameAr}
                  name={doctor.nameAr}
                  sizes="56px"
                  className="size-14 shrink-0 rounded-xl ring-1 ring-ink-200/70"
                />
              }
              meta={
                <ul className="flex flex-wrap gap-1.5">
                  {doctor.specialtyIds.map((id) => {
                    const specialty = specialtyById.get(id);
                    return specialty ? (
                      <li key={id}>
                        <Badge tone="brand">{specialty.nameAr}</Badge>
                      </li>
                    ) : null;
                  })}
                  {doctor.featured ? (
                    <li>
                      <Badge tone="accent">{t("featured")}</Badge>
                    </li>
                  ) : null}
                </ul>
              }
              actions={
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setErrors({});
                      setEditing({ id: doctor.id, values: doctorToForm(doctor) });
                    }}
                  >
                    <Pencil className="size-4" aria-hidden />
                    {tl("edit")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleToggleActive(doctor)}
                  >
                    {doctor.active ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                    {doctor.active ? tl("deactivate") : tl("activate")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(doctor)}
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
