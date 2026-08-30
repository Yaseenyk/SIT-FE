"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";

interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

const INITIAL: AsyncState<never> = { data: null, error: null, loading: true };

/**
 * Runs an async fetch on mount and whenever `deps` change; exposes
 * {data, error, loading, reload}.
 *
 * A static export has no server to fetch on, so every piece of content on this site is
 * loaded in the browser. That makes three states — loading, failed, loaded — the normal
 * case rather than an edge case, and this hook is what stops each section inventing its
 * own version of them.
 *
 * `deps` must be PRIMITIVES (the tab, the active filter). They are joined into a string
 * key, so an object dep would collapse to "[object Object]" and the refetch would never
 * fire. Every call site passes a string or nothing.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncState<T> & { reload: () => void } {
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((value) => value + 1), []);

  // Joined into one string so the effect has a single primitive dependency. The
  // trailing nonce is what lets reload() re-fire it when no dep has changed.
  const key = [...deps, nonce].map(String).join("::");

  const [state, setState] = useState<AsyncState<T>>(INITIAL);
  const [renderedKey, setRenderedKey] = useState(key);

  /*
   * Resetting to the loading state during RENDER, not in an effect.
   *
   * This is React's documented "adjust state when a prop changes" pattern. Doing it in an
   * effect instead means one extra render in which the old tab's data is shown under the
   * new tab's heading, and React 19 flags that setState as a cascading render.
   */
  if (key !== renderedKey) {
    setRenderedKey(key);
    setState(INITIAL);
  }

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((data) => {
        // Guards a slow first request resolving after a newer one; without it a stale
        // response can overwrite fresh data when a filter is clicked twice quickly.
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          error: error instanceof ApiError ? error : new ApiError("Something went wrong", 0),
          loading: false,
        });
      });

    return () => {
      cancelled = true;
    };
    // `fetcher` is intentionally absent: it is a new closure on every render, so
    // including it would re-fire this effect forever. `key` is what decides when the
    // request should actually be made again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { ...state, reload };
}
