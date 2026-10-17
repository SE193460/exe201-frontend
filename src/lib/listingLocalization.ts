import { useEffect, useMemo, useState } from "react";
import { getListingTranslations, type ContentLocale } from "../api/services/translation";

export const CONTENT_LOCALES: ContentLocale[] = ["vi", "en", "ja"];

/** Map an i18next language tag (e.g. `ja-JP`) to a supported content locale. */
export function contentLocaleFromLanguage(language?: string): ContentLocale {
  const value = (language ?? "").toLowerCase();
  if (value.startsWith("en")) return "en";
  if (value.startsWith("ja") || value.startsWith("jp")) return "ja";
  return "vi";
}

export type TranslatableListing = {
  id: string;
  title?: string;
  description?: string | null;
};

/** Return the listings with title/description translated into `locale`. */
export async function localizeListings<T extends TranslatableListing>(
  listings: T[],
  locale: ContentLocale
): Promise<T[]> {
  if (locale === "vi" || listings.length === 0) return listings;
  const ids = [...new Set(listings.map((listing) => listing.id))];
  const translations = await getListingTranslations(ids, locale);
  return listings.map((listing) => {
    const localized = listing.id ? translations[listing.id] : undefined;
    if (!localized) return listing;
    return {
      ...listing,
      title: localized.title || listing.title,
      description: localized.description ?? listing.description,
    };
  });
}

/**
 * Hook: given the current language and a list of listings, fetch their
 * translated title/description on demand and return the merged list.
 * Falls back to the original Vietnamese text on any error.
 */
export function useLocalizedListings<T extends TranslatableListing>(
  listings: T[],
  language: string
): { localized: T[]; loading: boolean } {
  const locale = contentLocaleFromLanguage(language);
  const [localized, setLocalized] = useState<T[]>(listings);
  const [loading, setLoading] = useState(false);

  // Stable dependency key so the effect only re-runs when the ids/locale change.
  const key = useMemo(() => `${locale}|${listings.map((l) => l.id).join(",")}`, [locale, listings]);

  useEffect(() => {
    let active = true;
    if (locale === "vi" || listings.length === 0) {
      setLocalized(listings);
      setLoading(false);
      return;
    }
    setLoading(true);
    localizeListings(listings, locale)
      .then((result) => {
        if (active) setLocalized(result);
      })
      .catch(() => {
        if (active) setLocalized(listings);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { localized, loading };
}

/**
 * Hook: same as {@link useLocalizedListings} but returns a lookup function so
 * existing render code can do `localize(listing).title` without restructuring.
 */
export function useListingLocalizer<T extends TranslatableListing>(
  listings: T[],
  language: string
): (listing: T) => T {
  const { localized } = useLocalizedListings(listings, language);
  const byId = useMemo(() => {
    const map = new Map<string, T>();
    for (const item of localized) {
      if (item.id) map.set(item.id, item);
    }
    return map;
  }, [localized]);
  return (listing: T) => (listing?.id ? byId.get(listing.id) ?? listing : listing);
}
