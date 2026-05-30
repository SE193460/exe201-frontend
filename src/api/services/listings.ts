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
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerAvatar?: string | null;
  ownerEmail?: string | null;
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

