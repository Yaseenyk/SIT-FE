"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

/**
 * The Firebase client, used for ONE thing: proving who the visitor is.
 *
 * <h2>These values are public, and that is not a mistake</h2>
 *
 * Every `NEXT_PUBLIC_FIREBASE_*` value below is compiled into the JavaScript the browser
 * downloads. That is correct and unavoidable — a browser cannot talk to Firebase Auth
 * without them, and Google documents the web API key as a public project identifier
 * rather than a secret. It identifies the project; it authorises nothing.
 *
 * What stops that being a problem is that the key grants no data access here. Firestore is
 * never read from the browser, and the API decides what a signed-in person may do from
 * their `users` document, on the server. The original single-file site shipped the same
 * key and then let the browser read and write the database with it — the key was never the
 * bug, the trust placed in the client was.
 *
 * The private service-account key is a different thing entirely and lives only in the
 * backend's environment. It must never appear in this directory.
 *
 * <h2>Initialised lazily</h2>
 *
 * This is a static export: every page is prerendered at build time in Node, where
 * `window` does not exist. Initialising at module scope would run during that prerender
 * and throw, failing the build. Every accessor below is called from an effect or an
 * event handler instead.
 */

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

/**
 * Whether accounts can work at all.
 *
 * Checked before anything renders rather than letting `getAuth` throw. A deployment whose
 * Firebase variables were never set should say "accounts are not configured yet" — not
 * show a blank screen from an exception thrown inside a form's submit handler.
 */
export function isAuthConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId);
}

let cachedAuth: Auth | null = null;

function firebaseApp(): FirebaseApp {
  // getApps() guards Fast Refresh, which re-runs this module without clearing the
  // registry — initializeApp twice throws "Firebase App named '[DEFAULT]' already exists".
  return getApps().length ? getApp() : initializeApp(config);
}

export function firebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  if (!isAuthConfigured()) {
    throw new Error(
      "Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* variables and rebuild.",
    );
  }

  const auth = getAuth(firebaseApp());

  /*
   * Point at the emulator when one is configured, so local development signs in against
   * the same emulator the API verifies against. Without this the browser mints a token
   * from the REAL project, which the local API — running in emulator mode — cannot
   * verify, and every request 401s for no visible reason.
   */
  const emulator = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR;
  if (emulator) {
    connectAuthEmulator(auth, emulator, { disableWarnings: true });
  }

  cachedAuth = auth;
  return auth;
}

/**
 * Turns Firebase's error codes into something a student can act on.
 *
 * Firebase reports `auth/invalid-credential` and `auth/too-many-requests`, which mean
 * nothing to anyone outside the SDK. Left unmapped, a mistyped password shows a raw error
 * code — the single most common way an auth screen looks broken.
 */
export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      // One message for all three. Distinguishing "no such account" from "wrong password"
      // would let anyone test whether a given address has an account here.
      return "That email address and password do not match an account.";
    case "auth/invalid-email":
      return "That does not look like an email address.";
    case "auth/email-already-in-use":
      return "An account already exists for that address. Try signing in instead.";
    case "auth/weak-password":
      return "Choose a password of at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Could not reach the sign-in service. Check your connection and try again.";
    case "auth/requires-recent-login":
      return "For security, sign out and back in before making this change.";
    case "auth/operation-not-allowed":
      return "Email sign-in is not enabled for this Firebase project yet.";
    default:
      return error instanceof Error && error.message
        ? error.message
        : "Something went wrong. Please try again.";
  }
}
