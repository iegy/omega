"use client";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth } from "@/firebase/auth";
import { isFirebaseConfigured } from "@/firebase/env";
import { logAppError, toAppError, type AppErrorCode } from "@/lib/errors";
import { lookupAdmin, touchAdminLastLogin } from "@/services/admins";
import { can, type Permission } from "@/types/admin";

import type { AdminSession } from "./session";
import { sessionRole } from "./session";

export interface SignInOutcome {
  ok: boolean;
  code?: AppErrorCode;
}

interface AuthContextValue {
  session: AdminSession;
  signIn: (email: string, password: string) => Promise<SignInOutcome>;
  signOut: () => Promise<void>;
  /** Re-runs the `admins/{uid}` lookup, e.g. after a role change. */
  refresh: () => Promise<void>;
  /** Permission check bound to the current session's role. */
  can: (permission: Permission) => boolean;
}

/** Maximum time to wait for Firebase Authentication before giving up. */
const SIGN_IN_TIMEOUT_MS = 20000;

function withSignInTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(Object.assign(new Error("sign-in timed out"), {
        code: "auth/network-request-failed",
      }));
    }, SIGN_IN_TIMEOUT_MS);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Admin-only authentication provider (spec 6).
 *
 * Patients and visitors never authenticate, so this provider is mounted under
 * `/admin` only — the public site ships no auth code and no admin link.
 *
 * Client-side state drives the *UI*; `firestore.rules` remains the real security
 * boundary, so a tampered client can change what it renders but not what it can
 * read or write (spec 9).
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession>(() =>
    isFirebaseConfigured() ? { status: "loading" } : { status: "unconfigured" },
  );

  /** Guards against a stale lookup resolving after a newer auth change. */
  const requestId = useRef(0);

  const resolveUser = useCallback(async (user: User | null, token: number) => {
    if (!user) {
      if (requestId.current === token) setSession({ status: "signedOut" });
      return;
    }

    const result = await lookupAdmin(user.uid);
    if (requestId.current !== token) return;

    switch (result.status) {
      case "authorized":
        setSession({ status: "authorized", admin: result.admin });
        void touchAdminLastLogin(user.uid);
        break;
      case "inactive":
        setSession({ status: "inactive", email: result.admin.email || user.email });
        break;
      case "notAuthorized":
        setSession({ status: "notAuthorized", email: user.email });
        break;
      case "error":
        setSession({ status: "error", code: result.code, email: user.email });
        break;
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        requestId.current += 1;
        void resolveUser(user, requestId.current);
      },
      (error) => {
        requestId.current += 1;
        const appError = logAppError("onAuthStateChanged", error);
        setSession({ status: "error", code: appError.code, email: null });
      },
    );

    return unsubscribe;
  }, [resolveUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) return { ok: false, code: "notConfigured" as AppErrorCode };

    try {
      // Bounded wait: on a dropped connection the Firebase SDK can hang for a
      // long time, which would leave the sign-in button spinning with no
      // explanation. A timeout surfaces the bilingual "network" message instead.
      const credential = await withSignInTimeout(
        signInWithEmailAndPassword(auth, email.trim(), password),
      );
      // `onAuthStateChanged` performs the authorisation lookup; awaiting it here
      // as well makes the login button stay busy until the outcome is known.
      requestId.current += 1;
      await resolveUser(credential.user, requestId.current);
      return { ok: true };
    } catch (error) {
      const appError = logAppError("signIn", error);
      return { ok: false, code: appError.code };
    }
  }, [resolveUser]);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setSession({ status: "signedOut" });
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      logAppError("signOut", error);
    } finally {
      requestId.current += 1;
      setSession({ status: "signedOut" });
    }
  }, []);

  const refresh = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    requestId.current += 1;
    await resolveUser(auth.currentUser, requestId.current);
  }, [resolveUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      signIn,
      signOut,
      refresh,
      can: (permission: Permission) => can(sessionRole(session), permission),
    }),
    [session, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw toAppError(
      new Error("useAdminAuth must be used inside <AdminAuthProvider>"),
    );
  }
  return context;
}

/** Convenience hook: the authorised admin, or `null`. */
export function useCurrentAdmin() {
  const { session } = useAdminAuth();
  return session.status === "authorized" ? session.admin : null;
}

/** Convenience hook: `can("doctors:manage")` style checks in components. */
export function useCan(): (permission: Permission) => boolean {
  return useAdminAuth().can;
}
