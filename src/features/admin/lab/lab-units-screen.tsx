"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import {
  SimpleEntityScreen,
  type SimpleEntity,
} from "@/features/admin/simple-entity/simple-entity-screen";
import { COLLECTIONS } from "@/config/constants";
import { listAllLabUnits } from "@/services/lab";

/** Admin → Lab units. The six units of Mawoda Atef Lab. */
export function LabUnitsScreen() {
  const t = useTranslations("adminLab");
  const load = useCallback(async (): Promise<SimpleEntity[]> => listAllLabUnits(), []);

  return (
    <SimpleEntityScreen
      collectionName={COLLECTIONS.labUnits}
      load={load}
      supportsImage
      labels={{
        addTitle: t("addUnit"),
        editTitle: t("addUnit"),
        nameLabel: t("unitName"),
        descriptionLabel: t("unitDescription"),
        imageLabel: t("logo"),
      }}
    />
  );
}
