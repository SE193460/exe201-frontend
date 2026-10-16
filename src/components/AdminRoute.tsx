import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchProfile } from "@/api/services/user";

/**
 * Client-side guard for admin routes.
 *
 * The backend already enforces authorization (admin endpoints return 403), but
 * this prevents non-admins from landing on an admin page shell that would just
 * show empty data and errors.
 */
export default function AdminRoute() {
  const [status, setStatus] = useState<"checking" | "admin" | "denied">(
    localStorage.getItem("access_token") ? "checking" : "denied"
  );

  useEffect(() => {
    let active = true;

    if (!localStorage.getItem("access_token")) {
      setStatus("denied");
      return;
    }

    fetchProfile()
      .then((profile) => {
        if (!active) return;
        setStatus(profile.roleName === "admin" ? "admin" : "denied");
      })
      .catch(() => {
        if (!active) return;
        setStatus("denied");
      });

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--primary)]" />
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
