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

export async function generateQR(payload: { listingId: string; amount: number }) {
  const response = await axiosInstance.post("/api/payments/generate-qr", payload);
  return response.data as {
    qrUrl: string;
    bankInfo: { bank: string; accountNumber: string; accountName: string };
    amount: number;
    content: string;
    packageType: string;
    packageLabel: string;
    durationDays: number;
  };
}

export async function confirmTransfer(payload: { listingId: string; amount: number; packageName: string }) {
  const response = await axiosInstance.post("/api/payments/confirm-transfer", payload);
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

export async function fetchPendingPayments() {
  const response = await axiosInstance.get("/api/payments/admin/pending");
  return response.data as Array<PaymentTransaction & { listing_id: string; user_id: string }>;
}

export async function adminConfirmPayment(transactionId: string) {
  const response = await axiosInstance.patch(`/api/payments/admin/${transactionId}/confirm`);
  return response.data as { message: string };
}
