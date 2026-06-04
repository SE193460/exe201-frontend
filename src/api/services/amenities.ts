import axiosInstance from "../axiosConfig";

export type Amenity = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchAmenities() {
  const response = await axiosInstance.get("/api/amenities");
  return response.data as Amenity[];
}

export async function fetchAdminAmenities() {
  const response = await axiosInstance.get("/api/admin/amenities");
  return response.data as Amenity[];
}

export async function createAmenity(name: string) {
  const response = await axiosInstance.post("/api/admin/amenities", { name });
  return response.data as Amenity;
}

export async function updateAmenity(id: string, name: string) {
  const response = await axiosInstance.patch(`/api/admin/amenities/${id}`, { name });
  return response.data as Amenity;
}

export async function deleteAmenity(id: string) {
  const response = await axiosInstance.delete(`/api/admin/amenities/${id}`);
  return response.data as { message: string };
}
