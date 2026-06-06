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

