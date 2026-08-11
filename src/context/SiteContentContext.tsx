/**
 * Site content — admin-editable home page write-ups.
 *
 * Loaded once at app start from the `site_content` table. Components read a
 * key via `useContent(key, fallback)`; the fallback (the component's own
 * hardcoded copy) renders immediately and until the fetch resolves, and also
 * covers any key that was never seeded, so a missing row never blanks a page.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchSiteContent } from '../utils/siteContent';

const SiteContentContext = createContext<Record<string, string>>({});

export const SiteContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSiteContent()
      .then(setContent)
      .catch(() => {
        // Stay on component fallbacks if the fetch fails (e.g. offline).
      });
  }, []);

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>;
};

export function useContent(key: string, fallback: string): string {
  const content = useContext(SiteContentContext);
  return content[key] || fallback;
}
