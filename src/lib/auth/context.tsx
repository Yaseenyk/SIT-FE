"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AUTH_EXPIRED_EVENT, getAuthToken, setAuthToken } from "@/lib/api/client";
import { auth } from "@/lib/api/endpoints";

interface AuthState {
  username: string | null;
  /** True once the stored token has been checked, so the UI can avoid flashing the login form. */
  ready: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  setUsername: (username: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Who is signed in, for the whole admin area.
 *
 * A stored token is not trusted on sight: it is verified against `/auth/me` on mount. The
 * old site restored an admin session from Firebase's local persistence and revealed the
 * dashboard before any server had confirmed anything, so a stale token showed a fully
 * populated admin UI whose every action then failed.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = getAuthToken();

    /*
     * Both branches go through a promise, so `setReady` is never called synchronously in
     * the effect body — React 19 flags that as a cascading render, and here it would also
     * mean two renders before the first paint of the admin screen.
     *
     * The token cannot be read during render instead: this page is prerendered at build
     * time, and localStorage does not exist then, so a lazy useState initialiser would
     * disagree with the server-rendered HTML and break hydration.
     */
    const check = token
      ? auth
          .me()
          .then((me) => {
            if (!cancelled) setUsernameState(me.username);
          })
          .catch(() => {
            // Expired or revoked. The client already cleared the token on the 401.
          })
      : Promise.resolve();

    check.finally(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 on any later request means the session died mid-session. One listener here
  // beats every panel handling it, and it is why the client dispatches the event at all.
  useEffect(() => {
    const onExpired = () => setUsernameState(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const signIn = useCallback(async (name: string, password: string) => {
    const response = await auth.login(name, password);
    setAuthToken(response.token);
    setUsernameState(response.username);
  }, []);

  const signOut = useCallback(() => {
    // There is no server call: the token is stateless, so signing out IS discarding it.
    setAuthToken(null);
    setUsernameState(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ username, ready, signIn, signOut, setUsername: setUsernameState }),
    [username, ready, signIn, signOut],
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
