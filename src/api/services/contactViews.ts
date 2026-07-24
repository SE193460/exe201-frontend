import axiosInstance from "../axiosConfig";

export async function fetchMyContactCredits() {
  const res = await axiosInstance.get("/api/contact-views/credits");
  return res.data;
}

export async function viewContact(listingId: string) {
  const res = await axiosInstance.post(`/api/contact-views/view/${listingId}`);
  return res.data;
}

export async function viewLifestyleProfile(listingId: string) {
  const res = await axiosInstance.post(`/api/contact-views/lifestyle/${listingId}`);
  return res.data;
}

export async function fetchLifestyleProfileAccess(listingId: string) {
  const res = await axiosInstance.get(`/api/contact-views/lifestyle/${listingId}`);
  return res.data;
}

export async function purchaseContactViews(amount: number, packageName: string) {
  const res = await axiosInstance.post("/api/contact-views/purchase", {
    amount,
    packageName,
  });
  return res.data;
}

export async function confirmContactViewPurchase(transactionId: string) {
  const res = await axiosInstance.post("/api/contact-views/confirm-purchase", {
    transactionId,
  });
  return res.data;
}
