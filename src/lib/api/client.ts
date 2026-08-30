/**
 * Minimal type-safe HTTP client for the AISA Spring Boot API.
 *
 * Deliberately dependency-free: one fetch wrapper with timeouts, typed errors and the
 * API's `{message, fieldErrors}` shape decoded into something a form can display.
 */

import type { ApiErrorResponse } from "@/types/api";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export const API_V1 = "/api/v1";

/**
 * Session token, held in module scope and mirrored to localStorage.
 *
 * Module scope so every request picks it up without threading it through each call site;
 * localStorage so a refresh does not sign the admin out mid-edit.
 *
 * localStorage is readable by any script on this origin, which is the accepted trade for a
 * static site with no server to set an HttpOnly cookie. The mitigations that make it
 * defensible: the token expires in 12 hours, it grants nothing a signed-in admin could not
 * already do, and rotating JWT_SECRET on the server revokes every issued token at once.
 */
const TOKEN_KEY = "aisa.token";
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Private mode, or storage disabled. The token still works for this tab from
    // module scope; it simply will not survive a reload.
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window === "undefined") return null;
  try {
    authToken = window.localStorage.getItem(TOKEN_KEY);
  } catch {
    authToken = null;
  }
  return authToken;
}

/** Fired when the server rejects our token, so the app can show the login screen. */
export const AUTH_EXPIRED_EVENT = "aisa:auth-expired";

const DEFAULT_TIMEOUT_MS = 20_000;
/** Cloudinary uploads go direct from the browser and can be slow on campus wifi. */
const UPLOAD_TIMEOUT_MS = 120_000;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors ?? {};
  }

  /** status 0 means the request never reached the server — offline, CORS, or asleep. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** Rate-limited: the contact form and the login endpoint both use 429. */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  timeoutMs?: number;
  /** Skips the Authorization header. Used by the login call itself. */
  anonymous?: boolean;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path.startsWith("http") ? path : `${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = `${response.status} ${response.statusText}`;
  let fieldErrors: Record<string, string> | undefined;
  try {
    const payload = (await response.json()) as Partial<ApiErrorResponse>;
    if (typeof payload.message === "string" && payload.message) {
      message = payload.message;
    }
    if (payload.fieldErrors) {
      fieldErrors = payload.fieldErrors;
      /*
       * A bare "Some fields need attention" tells the user nothing if the form does not
       * render per-field messages. Fold them into the headline so the message is useful
       * wherever it is shown.
       */
      const summary = Object.values(payload.fieldErrors).join(" · ");
      if (summary) message = summary;
    }
  } catch {
    /* non-JSON body (a proxy error page, say) — keep the status line */
  }
  return new ApiError(message, response.status, fieldErrors);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, timeoutMs = DEFAULT_TIMEOUT_MS, headers, anonymous, ...rest } = options;

  const token = anonymous ? null : getAuthToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    const response = await fetch(buildUrl(path, query), {
      ...rest,
      signal: options.signal ?? controller.signal,
      headers: {
        Accept: "application/json",
        ...(isFormData || body === undefined ? {} : { "Content-Type": "application/json" }),
        // Attached centrally: a call site that forgets the header is an accidental
        // anonymous request, which the server answers with a 401 the admin cannot explain.
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      /*
       * An expired or revoked session is not an error any individual screen can handle;
       * announce it once here so the app can show the login form, rather than every
       * dashboard panel inventing its own recovery.
       */
      if (response.status === 401 && typeof window !== "undefined") {
        setAuthToken(null);
        window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
      }
      throw await toApiError(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      /*
       * Free-tier hosts sleep after inactivity and take ~50s to wake. Saying so turns a
       * mystifying failure into something the visitor knows to wait out.
       */
      throw new ApiError(
        "The server took too long to respond. If it has been idle it may be waking up — try again in a minute.",
        0,
      );
    }
    throw new ApiError(
      error instanceof Error ? error.message : "Could not reach the server",
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),

  uploadTimeoutMs: UPLOAD_TIMEOUT_MS,
};
