// Session-scoped client helpers.
//
// Authentication state and the match-score cache (`softFilterResults`) are tied
// to a specific account. They must never leak to anonymous visitors: after a
// logout (or when a token expires) the cached scores have to be wiped, and
// anonymous visitors must not trigger auth-only requests.

export const ACCESS_TOKEN_KEY = "access_token";
export const SOFT_FILTER_RESULTS_KEY = "softFilterResults";
export const SOFT_FILTER_SOURCE_KEY = "softFilterSource";
export const AUTO_MATCH_KEY = "autoMatchEnabled";

export function hasAccessToken(): boolean {
  try {
    return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));
  } catch {
    return false;
  }
}

/**
 * Remove cached match scores / source. Called on logout and whenever the
 * visitor is anonymous so that no compatibility score survives a session.
 */
export function clearSoftFilterCache(): void {
  try {
    localStorage.removeItem(SOFT_FILTER_RESULTS_KEY);
    localStorage.removeItem(SOFT_FILTER_SOURCE_KEY);
  } catch {
    /* localStorage unavailable — nothing to clear */
  }
}

/**
 * Whether automatic compatibility matching (auto soft-filter) is enabled.
 * Users can turn it off to browse without auto-generated scores. Defaults ON.
 */
export function isAutoMatchEnabled(): boolean {
  try {
    return localStorage.getItem(AUTO_MATCH_KEY) !== "false";
  } catch {
    return true;
  }
}

export function setAutoMatchEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(AUTO_MATCH_KEY, String(enabled));
  } catch {
    /* ignore */
  }
}
