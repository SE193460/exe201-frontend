import axiosInstance from "../axiosConfig";

export type Listing = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  rentPrice: number;
  city: string | null;
  district: string;
  ward: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  availableFrom: string | null;
  preferredGender: string | null;
  roomType: string | null;
  roomAreaSqm: number | null;
  maxOccupants: number | null;
  currentOccupants: number | null;
  smokingAllowed: boolean;
  petAllowed: boolean;
  status: string;
  rejectionReason: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: ListingImage[];
  amenities?: { id: string; name: string }[];
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerAvatar?: string | null;
  ownerEmail?: string | null;
  ownerCreatedAt?: string | null;
  ownerLastActive?: string | null;
  ownerListingsCount?: number;
  isSaved?: boolean;
  source?: string | null;
  promoType?: string | null;
  promoPurchasedAt?: string | null;
  promoExpiresAt?: string | null;
};

export type ListingImage = {
  id: string;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
};

export function resolveListingImageUrl(imageUrl: string) {
  if (!imageUrl) return imageUrl;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  return `${baseUrl}${imageUrl}`;
}

export type CreateListingPayload = {
  title: string;
  description: string;
  rentPrice: number;
  city: string;
  district: string;
  ward: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  availableFrom?: string | null;
  preferredGender?: string | null;
  roomType?: string | null;
  roomAreaSqm?: number | null;
  maxOccupants?: number | null;
  currentOccupants?: number | null;
  smokingAllowed?: boolean;
  petAllowed?: boolean;
  expiresAt?: string | null;
  amenityIds?: string[];
  source?: string | null;
};

export async function createMyListingDraft(payload: CreateListingPayload) {
  const response = await axiosInstance.post("/api/users/me/listings", payload);
  return response.data as Listing;
}

export async function updateMyListing(id: string, payload: CreateListingPayload) {
  const response = await axiosInstance.put(`/api/users/me/listings/${id}`, payload);
  return response.data as Listing;
}

export async function listMyListings() {
  const response = await axiosInstance.get("/api/users/me/listings");
  return response.data as Listing[];
}

export async function getMyListingDetail(id: string) {
  const response = await axiosInstance.get(`/api/users/me/listings/${id}`);
  return response.data as Listing;
}

export async function uploadListingImages(listingId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await axiosInstance.post(`/api/users/me/listings/${listingId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data as { listingId: string; images: ListingImage[] };
}

export async function submitMyListingForApproval(id: string) {
  const response = await axiosInstance.put(`/api/users/me/listings/${id}/submit`);
  return response.data as Listing;
}

export async function fetchPublicListings() {
  const response = await axiosInstance.get("/api/listings");
  return response.data as Listing[];
}

export async function fetchPublicListingDetail(id: string) {
  const response = await axiosInstance.get(`/api/listings/${id}`);
  return response.data as Listing;
}

export async function deleteListingImage(listingId: string, imageId: string) {
  const response = await axiosInstance.delete(`/api/users/me/listings/${listingId}/images/${imageId}`);
  return response.data as { message: string; imageId: string; listingId: string };
}

export async function addListingImageUrls(listingId: string, urls: string[]) {
  const response = await axiosInstance.post(`/api/users/me/listings/${listingId}/images/urls`, { urls });
  return response.data as { listingId: string; images: ListingImage[] };
}

export async function toggleSaveListing(listingId: string) {
  const response = await axiosInstance.post(`/api/listings/${listingId}/save`);
  return response.data as { isSaved: boolean };
}

export async function fetchSavedListings() {
  const response = await axiosInstance.get("/api/listings/saved");
  return response.data as Listing[];
}

export async function reportListing(listingId: string, payload: { reason: string; description?: string | null }) {
  const response = await axiosInstance.post(`/api/listings/${listingId}/report`, payload);
  return response.data as { message: string; report: unknown };
}

export async function deleteMyListing(id: string) {
  const response = await axiosInstance.delete(`/api/users/me/listings/${id}`);
  return response.data as { message: string };
}

export async function unpublishMyListing(id: string) {
  const response = await axiosInstance.put(`/api/users/me/listings/${id}/unpublish`);
  return response.data as Listing;
}

