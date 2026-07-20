const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function authHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchMyContactCredits() {
  const res = await fetch(`${BASE_URL}/api/contact-views/credits`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch contact credits");
  return res.json();
}

export async function viewContact(listingId: string) {
  const res = await fetch(`${BASE_URL}/api/contact-views/view/${listingId}`, {
    method: "POST",
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to view contact");
  return res.json();
}

export async function purchaseContactViews(amount: number, packageName: string) {
  const res = await fetch(`${BASE_URL}/api/contact-views/purchase`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ amount, packageName }),
  });
  if (!res.ok) throw new Error("Failed to purchase contact views");
  return res.json();
}
