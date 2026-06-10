import axiosInstance from "../axiosConfig";

export type PaymentTransaction = {
  id: string;
  userId: string;
  listingId: string | null;
  amount: number;
  packageName: string;
  status: string;
  created_at: string;
  listingTitle?: string | null;
  userName?: string | null;
  userEmail?: string | null;
};

export async function checkoutPayment(payload: { listingId: string; packageName: string; amount: number }) {
  const response = await axiosInstance.post("/api/payments/checkout", payload);
  return response.data as { message: string; transaction: PaymentTransaction };
}

export async function fetchMyPaymentHistory() {
  const response = await axiosInstance.get("/api/payments/history");
  return response.data as PaymentTransaction[];
}

export async function fetchAllPaymentHistory() {
  const response = await axiosInstance.get("/api/payments/admin/history");
  return response.data as PaymentTransaction[];
}
