/**
 * Sorting + filtering helpers shared by the repositories.
 *
 * Why sort in memory instead of `orderBy` in Firestore?
 * A Firestore query that combines an equality filter (`active == true`) with
 * `orderBy("sortOrder")` requires a composite index per collection. Every
 * collection here holds tens — not thousands — of documents, so filtering on the
 * server and ordering in memory keeps the project on the Spark plan with zero
 * index maintenance (spec 34: no invented indexes). Collections that will grow
 * without bound — `appointments`, `sampleCollectionRequests` — get real indexed
 * queries in the phases that build their screens.
 */

export interface Sortable {
  sortOrder: number;
}

export function bySortOrder<T extends Sortable>(a: T, b: T): number {
  return a.sortOrder - b.sortOrder;
}

export function sortRecords<T extends Sortable>(records: T[]): T[] {
  return [...records].sort(bySortOrder);
}

/** Sorts by `sortOrder`, then alphabetically on the Arabic name as a tiebreak. */
export function sortByOrderThenName<T extends Sortable & { nameAr: string }>(
  records: T[],
): T[] {
  return [...records].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.nameAr.localeCompare(b.nameAr, "ar"),
  );
}

/** ISO date (`YYYY-MM-DD`) for "today" in the clinic timezone. */
export function clinicToday(timeZone = "Africa/Cairo"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Day of week (0 = Sunday) for "today" in the clinic timezone. */
export function clinicWeekday(timeZone = "Africa/Cairo"): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(
    new Date(),
  );
  const order = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const index = order.indexOf(weekday);
  return index === -1 ? new Date().getDay() : index;
}
