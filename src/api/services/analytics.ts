import axiosInstance from "../axiosConfig";

export type AnalyticsSummary = {
  activeUsersByMonth: Array<{ month: string; activeUsers: number }>;
  topListings: Array<{
    id: string;
    title: string;
    district: string | null;
    detailViewCount: number;
    phoneClickCount: number;
    zaloClickCount: number;
    cardClickCount: number;
  }>;
  areaStats: Array<{
    district: string;
    filterCount: number;
    detailClickCount: number;
    listingCount: number;
  }>;
  totals: {
    detailViewCount: number;
    phoneClickCount: number;
    zaloClickCount: number;
  };
  recommendationStats: {
    recommendedClicks: number;
    normalClicks: number;
    totalClicks: number;
    recommendedRate: number;
  };
  updates: {
    lifestyleProfileUpdates: number;
    softFilterUpdates: number;
  };
};

export type TrackEventPayload = {
  eventName: string;
  eventType?: string;
  listingId?: string;
  district?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown>;
};

export async function trackEvent(payload: TrackEventPayload) {
  try {
    await axiosInstance.post("/api/analytics/events", payload);
  } catch (error) {
    console.warn("Failed to track analytics event", error);
  }
}

export async function fetchAnalyticsSummary() {
  const response = await axiosInstance.get("/api/analytics/summary");
  return response.data as AnalyticsSummary;
}
