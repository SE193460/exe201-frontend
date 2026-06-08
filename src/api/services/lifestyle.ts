import axiosInstance from "../axiosConfig";

export type LifestyleProfile = {
  user_id?: string;
  preferred_district?: string | null;
  cleanliness?: number | null;
  ac_usage?: number | null;
  pet_status?: number | null;
  smoking_status?: number | null;
  cooking?: number | null;
  guest?: number | null;
  home_frequency?: number | null;
  work_schedule?: "DAY" | "FLEXIBLE" | "NIGHT" | null;
  sharing?: number | null;
  noise?: number | null;
  call_frequency?: number | null;
  game_mic?: number | null;
};

export type RoommatePreferences = {
  user_id?: string;
  pref_cleanliness?: number | null;
  pref_ac_usage?: number | null;
  pref_cooking?: number | null;
  pref_guest?: number | null;
  pref_home_frequency?: number | null;
  pref_noise?: number | null;
  pref_call_frequency?: number | null;
  pref_game_mic?: number | null;
  pref_pet?: "LOVE" | "ANY" | "DISLIKE" | "NEVER" | null;
  pref_smoking?: "YES" | "ANY" | "DISLIKE" | "NEVER" | null;
  pref_work_schedule?: "DAY" | "NIGHT" | "ANY" | null;
  pref_sharing?: "OPEN" | "ASK" | "PRIVATE" | "ANY" | null;
};

export type SoftFilterPayload = {
  user_type: "HAS_ROOM" | "NO_ROOM";
  hard_filters?: {
    district?: string | null;
    min_price?: number | null;
    max_price?: number | null;
    min_area?: number | null;
    max_area?: number | null;
  };
};

export type SoftFilterFieldScore = {
  score: number;
  label: string;
  profile_value: string;
  pref_value: string;
};

export type SoftFilterResult = {
  id: string;
  total_score: number;
  field_scores: Record<string, SoftFilterFieldScore>;
  title?: string;
  rent_price?: number;
  district?: string;
  room_area_sqm?: number | null;
  address?: string | null;
  image_url?: string | null;
  full_name?: string;
  avatar_url?: string | null;
  email?: string;
  phone_number?: string | null;
  zalo?: string | null;
  owner?: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string;
  };
};

export async function fetchLifestyleProfile() {
  const response = await axiosInstance.get("/api/lifestyle-profile");
  return response.data as LifestyleProfile;
}

export async function updateLifestyleProfile(payload: LifestyleProfile) {
  const response = await axiosInstance.put("/api/lifestyle-profile", payload);
  return response.data as LifestyleProfile;
}

export async function fetchRoommatePreferences() {
  const response = await axiosInstance.get("/api/roommate-preferences");
  return response.data as RoommatePreferences;
}

export async function updateRoommatePreferences(payload: RoommatePreferences) {
  const response = await axiosInstance.put("/api/roommate-preferences", payload);
  return response.data as RoommatePreferences;
}

export async function runSoftFilter(payload: SoftFilterPayload) {
  const response = await axiosInstance.post("/api/soft-filter", payload);
  return response.data as { results: SoftFilterResult[] };
}
