"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import {
  SimpleEntityScreen,
  type SimpleEntity,
} from "@/features/admin/simple-entity/simple-entity-screen";
import { COLLECTIONS } from "@/config/constants";
import { serviceCategoriesCollection } from "@/firebase/collections";
import { safeList } from "@/services/firestore-access";
import { sortByOrderThenName } from "@/services/repository-helpers";

/**
 * Admin → Service categories.
 *
 * Reads every category including hidden ones, which the public `catalog`
 * repository deliberately does not expose.
 */
export function ServiceCategoriesScreen() {
  const t = useTranslations("adminCategories");

  const load = useCallback(async (): Promise<SimpleEntity[]> => {
    const records = await safeList(serviceCategoriesCollection(), {
      context: "listAllServiceCategories",
    });
    return sortByOrderThenName(records);
  }, []);

  return (
    <SimpleEntityScreen
      collectionName={COLLECTIONS.serviceCategories}
      load={load}
      labels={{
        addTitle: t("addTitle"),
        editTitle: t("editTitle"),
        nameLabel: t("name"),
        descriptionLabel: t("description"),
      }}
    />
  );
}
