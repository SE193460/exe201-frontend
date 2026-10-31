import axiosInstance from "../axiosConfig";

export type ContentLocale = "vi" | "en" | "ja";

export type LocalizedListingContent = {
  title: string;
  description: string | null;
};

/**
 * Fetch free-text listing content (title/description) localised into `locale`.
 * The backend translates on demand and caches the result, so this is cheap
 * after the first call. Vietnamese (`vi`) is the source — nothing to fetch.
 */
export async function getListingTranslations(
  ids: string[],
  locale: ContentLocale,
  signal?: AbortSignal
): Promise<Record<string, LocalizedListingContent>> {
  if (locale === "vi" || ids.length === 0) return {};
  const res = await axiosInstance.get("/api/translations/listings", {
    params: { ids: ids.join(","), locale },
    signal,
  });
  return res.data?.translations ?? {};
}
