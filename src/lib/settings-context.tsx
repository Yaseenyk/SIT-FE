"use client";

import { createContext, useContext, type ReactNode } from "react";
import { settings as settingsApi } from "@/lib/api/endpoints";
import { useApi } from "@/lib/hooks/use-api";
import type { SiteSettings } from "@/types/api";

interface SettingsState {
  settings: SiteSettings | null;
  loading: boolean;
}

const SettingsContext = createContext<SettingsState>({ settings: null, loading: true });

/**
 * Site settings, fetched once for the whole page.
 *
 * The announcement bar, the About copy, the contact block and the footer all need this
 * one object. Four independent `useApi(settings.get)` calls would be four requests for
 * identical data on every page load — which is what the original did, re-reading the
 * Firestore settings document from each render function that needed it.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, loading } = useApi(() => settingsApi.get(), []);

  return (
    <SettingsContext.Provider value={{ settings: data, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Never throws when the provider is missing or the fetch failed.
 *
 * Contact details are decoration on most of the page: if they cannot be loaded, the
 * footer should render without a phone number, not take the site down. Each consumer
 * checks the fields it needs.
 */
export function useSettings(): SettingsState {
  return useContext(SettingsContext);
}
