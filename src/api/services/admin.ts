import axiosInstance from "../axiosConfig";
import type { Listing, ListingImage } from "./listings";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  roleName: string;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
};

export type AdminListing = Listing;
export type ImportedListing = Listing;

export type CreateImportedListingPayload = {
  title: string;
  description: string;
  rentPrice: number;
  city: string;
  district: string;
  ward: string;
  address?: string | null;
  availableFrom?: string | null;
  preferredGender?: string | null;
  roomType?: string | null;
  roomAreaSqm?: number | null;
  maxOccupants?: number | null;
  currentOccupants?: number | null;
  smokingAllowed?: boolean;
  petAllowed?: boolean;
  source: string;
  amenityIds?: string[];
  imageUrls?: string[];
};

export async function fetchUsers(params: { query?: string; status?: string }) {
  const response = await axiosInstance.get("/api/admin/users", {
    params: { q: params.query || "", status: params.status || "all" },
  });
  return response.data as AdminUser[];
}

export async function fetchUserDetail(id: string) {
  const response = await axiosInstance.get(`/api/admin/users/${id}`);
  return response.data as AdminUser;
}

export async function updateUserStatus(id: string, isActive: boolean) {
  const response = await axiosInstance.patch(`/api/admin/users/${id}/status`, { isActive });
  return response.data as { id: string; isActive: boolean };
}

export async function fetchAdminListings() {
  const response = await axiosInstance.get("/api/admin/listings");
  return response.data as AdminListing[];
}

export type AdminDashboardSummary = {
  userStats: {
    total_users: number;
    active_users: number;
    new_users_last_7d: number;
    new_users_prev_7d: number;
  };
  listingStats: {
    total_listings: number;
    pending_listings: number;
    rejected_listings: number;
    approved_listings: number;
    imported_listings: number;
    imported_source_count: number;
  };
  reportStats: {
    total_reports: number;
    unresolved_reports: number;
    resolved_reports: number;
  };
  paymentStats: {
    total_revenue: number;
    pending_revenue: number;
    completed_transactions: number;
    pending_transactions: number;
    revenue_last_30d: number;
    revenue_last_7d: number;
    revenue_prev_7d: number;
  };
  topImportSources: Array<{ source: string; count: number }>;
  userGrowthWeekly: Array<{ day: string; new_users: number }>;
  revenueTrendWeekly: Array<{ day: string; revenue: number }>;
  userGrowthYearly: Array<{ month: string; new_users: number }>;
  revenueTrendYearly: Array<{ month: string; revenue: number }>;
  recentPayments: Array<{
    id: string;
    code: string | null;
    amount: number;
    package_name: string;
    status: string;
    created_at: string;
    listing_id: string | null;
    listing_title: string | null;
    user_name: string | null;
    user_email: string | null;
  }>;
  recentReports: Array<{
    id: string;
    status: string;
    reason: string;
    description: string | null;
    created_at: string;
    listing_id: string | null;
    listing_title: string | null;
    reporter_name: string | null;
    reporter_email: string | null;
  }>;
};

export async function fetchAdminDashboard() {
  const response = await axiosInstance.get("/api/admin/dashboard");
  return response.data as AdminDashboardSummary;
}

export async function approveListing(id: string) {
  const response = await axiosInstance.patch(`/api/admin/listings/${id}/approve`);
  return response.data as { id: string; status: string };
}

export async function rejectListing(id: string, rejectionReason: string) {
  const response = await axiosInstance.patch(`/api/admin/listings/${id}/reject`, { rejectionReason });
  return response.data as { id: string; status: string; rejectionReason: string };
}

// --- Imported Listings ---

export async function fetchImportedListings() {
  const response = await axiosInstance.get("/api/admin/imported-listings");
  return response.data as ImportedListing[];
}

export async function fetchImportedListingById(id: string) {
  const response = await axiosInstance.get(`/api/admin/imported-listings/${id}`);
  return response.data as ImportedListing;
}

export async function createImportedListing(payload: CreateImportedListingPayload) {
  const response = await axiosInstance.post("/api/admin/imported-listings", payload);
  return response.data as ImportedListing;
}

export async function updateImportedListing(id: string, payload: CreateImportedListingPayload) {
  const response = await axiosInstance.put(`/api/admin/imported-listings/${id}`, payload);
  return response.data as ImportedListing;
}

export async function publishImportedListing(id: string) {
  const response = await axiosInstance.patch(`/api/admin/imported-listings/${id}/publish`);
  return response.data as ImportedListing;
}

export async function unpublishImportedListing(id: string) {
  const response = await axiosInstance.patch(`/api/admin/imported-listings/${id}/unpublish`);
  return response.data as ImportedListing;
}

export async function addImportedListingImageUrls(id: string, urls: string[]) {
  const response = await axiosInstance.post(`/api/admin/imported-listings/${id}/images/urls`, { urls });
  return response.data as { listingId: string; images: ListingImage[] };
}

export async function deleteImportedListingImage(listingId: string, imageId: string) {
  const response = await axiosInstance.delete(`/api/admin/imported-listings/${listingId}/images/${imageId}`);
  return response.data;
}

