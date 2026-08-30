"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
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
import { setTokenProvider } from "@/lib/api/client";
import { auth as authApi } from "@/lib/api/endpoints";
import { firebaseAuth, isAuthConfigured } from "@/lib/firebase";
import type { Me } from "@/types/api";

/**
 * "Signed in" is four different states, and every screen needs to know which.
 *
 * A visitor with a perfectly valid Firebase token can still be unable to do anything —
 * because they never finished registering, because they have not confirmed their address,
 * or because an admin suspended them. Collapsing all of that into a boolean is what makes
 * an auth UI show a dead-end 403 with no explanation, so the state is named here and the
 * server names it too (`MeResponse.state`, and the matching authority in
 * `FirebaseAuthenticationFilter`).
 */
export type AccountState =
  | "loading"
  | "signed-out"
  | "unregistered"
  | "unverified"
  | "suspended"
  | "active";

interface AuthState {
  /** The Firestore profile, once the caller has one. */
  me: Me | null;
  state: AccountState;
  /** True once the initial check has finished, so screens do not flash. */
  ready: boolean;
  isAdmin: boolean;
  configured: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  sendReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  /** Re-reads the token and profile — after verifying an address, or a role change. */
  refresh: () => Promise<void>;
  setMe: (me: Me) => void;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  rollNumber?: string;
  year?: number | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const configured = isAuthConfigured();

  /*
   * The API client asks for a token rather than being handed one.
   *
   * Firebase ID tokens expire after an hour and are refreshed in the background, so a
   * token captured at sign-in is stale by the time a long-lived tab makes its next
   * request. `getIdToken()` returns the current one and refreshes it when needed, so
   * every request carries a valid token without anything here tracking expiry.
   *
   * It also means no token is written to localStorage. The previous build stored a JWT
   * there and documented the trade; Firebase keeps its own refresh token in IndexedDB and
   * hands out short-lived access tokens, which is strictly better and needs no such note.
   */
  useEffect(() => {
    if (!configured) return;
    setTokenProvider(async () => {
      const user = firebaseAuth().currentUser;
      return user ? user.getIdToken() : null;
    });
  }, [configured]);

  // Guards a slow /auth/me resolving after the user has signed out again.
  const generation = useRef(0);

  /*
   * Suppresses the auth listener while OUR OWN signup is running.
   *
   * `createUserWithEmailAndPassword` fires `onAuthStateChanged` immediately, long before
   * the profile exists — so mid-signup the listener would flip the app to a signed-in
   * screen, unmounting the signup form. If the registration then failed, the form
   * remounted fresh and the error it was about to display was gone with it: a refused
   * signup showed no message at all.
   *
   * `signUp` sets every piece of state itself once it knows the outcome, so there is
   * nothing for the listener to contribute in the meantime.
   */
  const signingUp = useRef(false);

  const loadProfile = useCallback(async (user: User | null) => {
    const mine = ++generation.current;
    if (!user) {
      setMe(null);
      return;
    }
    try {
      // POST /auth/session rather than GET /auth/me: it returns the same shape and also
      // stamps lastLoginAt, so "when did they last sign in" costs no extra request.
      const profile = await authApi.session();
      if (generation.current === mine) setMe(profile);
    } catch {
      /*
       * A 401/403 here is a REAL state, not a failure: an account that exists in Firebase
       * but has no profile yet. Leaving `me` null puts the app in "unregistered", which
       * has a screen. Throwing would show a generic error instead of the one thing the
       * person can act on.
       */
      if (generation.current === mine) setMe(null);
    }
  }, []);

  useEffect(() => {
    // Nothing to subscribe to, and nothing to wait for — `ready` is derived below.
    if (!configured) return;

    // onAuthStateChanged fires once on load with the restored session (or null), which is
    // what makes a reload not sign anyone out — and why `checked` is only set inside it.
    const unsubscribe = onAuthStateChanged(firebaseAuth(), async (user) => {
      if (signingUp.current) return;
      let current = user;

      /*
       * Re-check an unverified account against Firebase before believing it.
       *
       * `emailVerified` comes from the user record Firebase restored from local storage,
       * and confirming an address happens in a MAIL CLIENT — so this tab's copy is stale
       * and stays stale until the ID token happens to expire, up to an hour later.
       *
       * Without this, the flow that matters most is broken in the most demoralising way:
       * a student clicks the link in their email, comes back to the site, and is told to
       * confirm their email. They did. `reload()` refreshes the record and
       * `getIdToken(true)` mints a token carrying the new claim — which the API needs too,
       * since it reads `email_verified` from the token rather than trusting the client.
       *
       * One extra round trip, and only for accounts that are actually unverified.
       */
      if (user && !user.emailVerified) {
        try {
          await user.reload();
          await user.getIdToken(true);
          current = firebaseAuth().currentUser;
        } catch {
          // Offline, or the account was deleted. Fall through with what we have; the
          // server is the one that decides, and it will refuse a bad token.
        }
      }

      setFirebaseUser(current);
      await loadProfile(current);
      setChecked(true);
    });
    return unsubscribe;
  }, [configured, loadProfile]);

  /*
   * DERIVED, not a second setState in the effect above.
   *
   * With Firebase absent there is no session to check, so the app is ready immediately;
   * setting that from inside the effect would be a cascading render, which React 19 flags
   * and which costs an extra paint of the loading screen on every unconfigured build.
   */
  const ready = configured ? checked : true;

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
    setFirebaseUser(credential.user);
    await loadProfile(credential.user);
  }, [loadProfile]);

  /**
   * Creates the Firebase credential, then registers it with our API.
   *
   * The order matters and is the reason this is not one call. Only a signed-in client can
   * ask Firebase to SEND a verification email — the Admin SDK can generate the link but
   * cannot deliver it — so the browser has to hold the credential first. The API call
   * second is what applies the institute-domain rule and creates the profile; a domain it
   * refuses also deletes the credential, so a rejected signup leaves nothing behind.
   */
  const signUp = useCallback(async (input: SignUpInput) => {
    signingUp.current = true;
    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth(),
        input.email.trim(),
        input.password,
      );

      // Best-effort: the display name is a convenience, and the profile below is the real
      // record. Failing the whole signup because this one call failed would be wrong.
      try {
        await updateProfile(credential.user, { displayName: input.name.trim() });
      } catch {
        /* the name is stored on our own profile regardless */
      }

      let profile;
      try {
        profile = await authApi.register({
          name: input.name.trim(),
          rollNumber: input.rollNumber?.trim() || null,
          year: input.year ?? null,
        });
      } catch (error) {
        /*
         * The server refused the account — a non-institute address, most likely — and has
         * already deleted the Firebase credential at its end. Sign out locally too, or
         * this browser is left holding a session for an account that no longer exists.
         */
        await firebaseSignOut(firebaseAuth()).catch(() => {
          /* already gone; the throw below is what matters */
        });
        setFirebaseUser(null);
        setMe(null);
        throw error;
      }

      try {
        await sendEmailVerification(credential.user);
      } catch {
        // Rate-limited, most likely. There is a resend button on the next screen.
      }

      setFirebaseUser(credential.user);
      setMe(profile);
      setChecked(true);
    } finally {
      signingUp.current = false;
    }
  }, []);

  const signOut = useCallback(async () => {
    generation.current++;
    await firebaseSignOut(firebaseAuth());
    setFirebaseUser(null);
    setMe(null);
  }, []);

  const sendReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(firebaseAuth(), email.trim());
  }, []);

  const resendVerification = useCallback(async () => {
    const user = firebaseAuth().currentUser;
    if (user) await sendEmailVerification(user);
  }, []);

  /**
   * Re-reads everything after something changed outside this tab.
   *
   * `reload()` then `getIdToken(true)`: verifying an address happens in the MAIL CLIENT,
   * so this tab's cached user still says `emailVerified: false` and its token still
   * carries the old claim. Without forcing both, clicking the verification link appears to
   * do nothing until the token happens to expire, up to an hour later.
   */
  const refresh = useCallback(async () => {
    const user = firebaseAuth().currentUser;
    if (!user) return;
    await user.reload();
    await user.getIdToken(true);
    setFirebaseUser(firebaseAuth().currentUser);
    await loadProfile(firebaseAuth().currentUser);
  }, [loadProfile]);

  /*
   * The SERVER decides which state the account is in; this only maps its answer.
   *
   * An earlier version re-derived it here from `me` plus `firebaseUser.emailVerified`,
   * and the two drifted immediately: a caller the server reported as UNREGISTERED was
   * shown the "confirm your email" screen, because this code checked only for SUSPENDED
   * and fell through to the emailVerified test. A refused signup therefore looked like a
   * successful one.
   *
   * Duplicating the decision was the mistake. `MeResponse.state` exists precisely so that
   * this cannot happen, and the authority the filter grants is computed from the same
   * ordering — so there is one answer, not two that agree by hand.
   */
  const state: AccountState = !ready
    ? "loading"
    : !firebaseUser
      ? "signed-out"
      : !me
        ? // The request failed outright — no profile, and nothing else to go on.
          "unregistered"
        : me.state === "UNREGISTERED"
          ? "unregistered"
          : me.state === "SUSPENDED"
            ? "suspended"
            : me.state === "UNVERIFIED"
              ? "unverified"
              : "active";

  const value = useMemo<AuthState>(
    () => ({
      me,
      state,
      ready,
      // Admin is only ever true for an ACTIVE account: a suspended admin must lose the
      // dashboard, and the server refuses them regardless.
      isAdmin: state === "active" && me?.role === "ADMIN",
      configured,
      signIn,
      signUp,
      signOut,
      sendReset,
      resendVerification,
      refresh,
      setMe,
    }),
    [me, state, ready, configured, signIn, signUp, signOut, sendReset, resendVerification, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
