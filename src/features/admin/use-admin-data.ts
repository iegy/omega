"use client";

import { useCallback, useEffect, useState } from "react";

import { toAppError, type AppErrorCode } from "@/lib/errors";

/**
 * Client-side loading for the Admin Dashboard.
 *
 * Why the dashboard reads on the client rather than the server: this project
 * has no Firebase Admin SDK and no service account (Spark plan, no private key
 * in the repo), so a server render carries no administrator identity. Reading
 * from the browser as the signed-in admin is what makes `firestore.rules` the
 * single, real authorisation boundary for the dashboard, exactly as it is for
 * the public site.
 *
 * It also means the dashboard never reads through the 30-minute public edge
 * cache — an editor always sees what they just saved.
 */

export interface AdminDataState<T> {
  data: T | null;
  loading: boolean;
  /** `null` while loading and on success. */
  error: AppErrorCode | null;
  /** Re-runs the loader. Call it after a successful write. */
  reload: () => void;
}

interface InternalState<T> {
  data: T | null;
  loading: boolean;
  error: AppErrorCode | null;
}

/**
 * Runs `load` on mount, whenever `load` changes, and whenever `reload()` is
 * called.
 *
 * `load` **must be stable** — wrap it in `useCallback` at the call site. That
 * is deliberate: it makes the refetch triggers explicit instead of hiding them
 * behind a dependency array, and it satisfies React 19's rules about refs and
 * effects without resorting to a mutable ref written during render.
 *
 * A response from a superseded request is discarded, so a quick sequence of
 * edits can never leave an older result on screen.
 */
export function useAdminData<T>(load: () => Promise<T>): AdminDataState<T> {
  const [state, setState] = useState<InternalState<T>>({
    data: null,
    loading: true,
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    load()
      .then((result) => {
        if (!cancelled) setState({ data: result, loading: false, error: null });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setState((previous) => ({
          // Keep whatever was on screen; a failed refresh should not blank the
          // list the administrator is looking at.
          data: previous.data,
          loading: false,
          error: toAppError(caught).code,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [load, nonce]);

  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    setNonce((value) => value + 1);
  }, []);

  return { ...state, reload };
}
