import axiosInstance from "../axiosConfig";

export async function fetchMyContactCredits() {
  const res = await axiosInstance.get("/api/contact-views/credits");
  return res.data;
}

export async function viewContact(listingId: string) {
  const res = await axiosInstance.post(`/api/contact-views/view/${listingId}`);
  return res.data;
}

export async function purchaseContactViews(amount: number, packageName: string) {
  const res = await axiosInstance.post("/api/contact-views/purchase", {
    amount,
    packageName,
  });
  return res.data;
}
