import axiosInstance from "../axiosConfig";

export type Report = {

    id:string;

    listingId?:string;

    reason:string;

    description?:string|null;

    status:string;

    created_at:string;

    reporterName?:string|null;

    reporterEmail?:string|null;

    listingTitle?:string|null;

    listingOwner?:string|null;

}

export async function submitReport(payload: {
  listingId: string;
  reason: string;
}) {
  const response = await axiosInstance.post(
    "/api/reports",
    payload
  );

  return response.data as Report;
}

export async function fetchAllReports() {
  const response = await axiosInstance.get(
    "/api/reports/admin"
  );

  return response.data as Report[];
}