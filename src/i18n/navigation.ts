import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation helpers.
 * Always import `Link` / `redirect` / `usePathname` / `useRouter` from here
 * instead of `next/link` or `next/navigation`, so locale prefixes stay correct.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
