"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSiteSettings } from "@/lib/api/settings";
import type { PageHeaderContent, SiteSettings } from "@/lib/api/types";
import { DEFAULT_SITE_SETTINGS } from "@/lib/branding";

interface SiteContentContextValue {
  settings: SiteSettings;
  branding: SiteSettings["branding"];
  isLoading: boolean;
  refetch: () => Promise<void>;
  getPageHeader: (key: string) => PageHeaderContent;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await getSiteSettings();
      setSettings({
        ...DEFAULT_SITE_SETTINGS,
        ...next,
        branding: { ...DEFAULT_SITE_SETTINGS.branding, ...next.branding },
        seo: { ...DEFAULT_SITE_SETTINGS.seo, ...next.seo },
        navigation: next.navigation ?? DEFAULT_SITE_SETTINGS.navigation,
        footer: next.footer ?? DEFAULT_SITE_SETTINGS.footer,
        pageHeaders: {
          ...DEFAULT_SITE_SETTINGS.pageHeaders,
          ...(next.pageHeaders ?? {}),
        },
        contactPage: {
          ...DEFAULT_SITE_SETTINGS.contactPage,
          ...next.contactPage,
        },
      });
    } catch {
      setSettings(DEFAULT_SITE_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const value = useMemo<SiteContentContextValue>(
    () => ({
      settings,
      branding: settings.branding,
      isLoading,
      refetch,
      getPageHeader: (key: string) =>
        settings.pageHeaders[key] ?? {
          eyebrow: "",
          title: key,
          description: "",
        },
    }),
    [settings, isLoading, refetch]
  );

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      branding: DEFAULT_SITE_SETTINGS.branding,
      isLoading: false,
      refetch: async () => undefined,
      getPageHeader: (key: string) =>
        DEFAULT_SITE_SETTINGS.pageHeaders[key] ?? {
          eyebrow: "",
          title: key,
          description: "",
        },
    } satisfies SiteContentContextValue;
  }
  return ctx;
}
