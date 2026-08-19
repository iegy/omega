"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import {
  SimpleEntityScreen,
  type SimpleEntity,
} from "@/features/admin/simple-entity/simple-entity-screen";
import { COLLECTIONS } from "@/config/constants";
import { listAllSpecialties } from "@/services/catalog";

/** Admin → Specialties. 19 records, name + optional description + image. */
export function SpecialtiesScreen() {
  const t = useTranslations("adminSpecialties");
  const load = useCallback(
    async (): Promise<SimpleEntity[]> => listAllSpecialties(),
    [],
  );

  return (
    <SimpleEntityScreen
      collectionName={COLLECTIONS.specialties}
      load={load}
      supportsImage
      supportsFeatured
      labels={{
        addTitle: t("addTitle"),
        editTitle: t("editTitle"),
        nameLabel: t("name"),
        descriptionLabel: t("description"),
        imageLabel: t("image"),
        featuredLabel: t("featured"),
      }}
    />
  );
}
