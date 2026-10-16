import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { fetchProfile, getOnboardingStorageKey } from "./api/services/user";
import { fetchLifestyleProfile, fetchRoommatePreferences } from "./api/services/lifestyle";
import AdminRoute from "./components/AdminRoute";

// Route-level code splitting: each page is loaded on demand.
const HomePage = lazy(() => import("./pages/HomePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LifestyleProfilePage = lazy(() => import("./pages/LifestyleProfilePage"));
const SoftFilterPage = lazy(() => import("./pages/SoftFilterPage"));
const MyListingsPage = lazy(() => import("./pages/MyListingsPage"));
const CreateListingPage = lazy(() => import("./pages/CreateListingPage"));
const EditListingPage = lazy(() => import("./pages/EditListingPage"));
const ListingDetailPage = lazy(() => import("./pages/ListingDetailPage"));
const PublicListingsPage = lazy(() => import("./pages/PublicListingsPage"));
const PublicListingDetailPage = lazy(() => import("./pages/PublicListingDetailPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const SavedListingsPage = lazy(() => import("./pages/SavedListingsPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const PaymentPackages = lazy(() => import("./pages/PaymentPackages"));
const BuyContactViewsPage = lazy(() => import("./pages/BuyContactViewsPage"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const SupportContactPage = lazy(() => import("./pages/SupportContactPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminListingsPage = lazy(() => import("./pages/admin/AdminListingsPage"));
const AdminAmenitiesPage = lazy(() => import("./pages/admin/AdminAmenitiesPage"));
const AdminImportedListingsPage = lazy(() => import("./pages/admin/AdminImportedListingsPage"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminFeedbacksPage = lazy(() => import("./pages/admin/AdminFeedbacksPage"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--primary)]" />
    </div>
  );
}

function GoogleCallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const success = params.get("success");
      const error = params.get("error");
      const token = params.get("accessToken");

      // If no callback params, skip
      if (!success && !error) {
        return;
      }

      // Clear URL params immediately to prevent re-processing
      window.history.replaceState({}, document.title, window.location.pathname);

      if (success === "google" && token) {
        localStorage.setItem("access_token", token);

        let loggedInUserId = "";
        try {
          const profile = await fetchProfile();
          loggedInUserId = profile.id;

          if (profile.roleName === "admin") {
            navigate("/admin/dashboard");
            return;
          }
        } catch {
          // fall through to onboarding
        }

        // Check onboarding status
        if (!loggedInUserId) {
          navigate("/onboarding");
          return;
        }
        const onboardingKey = getOnboardingStorageKey(loggedInUserId);
        const alreadyCompleted = localStorage.getItem(onboardingKey) === "true";

        if (!alreadyCompleted) {
          try {
            const [lifestyleProfile, roommatePreferences] = await Promise.all([
              fetchLifestyleProfile(),
              fetchRoommatePreferences(),
            ]);

            const hasLifestyleData = Object.values(lifestyleProfile || {}).some(
              (value) => value !== null && value !== undefined && value !== ""
            );
            const hasPreferencesData = Object.values(roommatePreferences || {}).some(
              (value) => value !== null && value !== undefined && value !== ""
            );

            if (!hasLifestyleData && !hasPreferencesData) {
              navigate("/onboarding");
              return;
            }
          } catch {
            navigate("/onboarding");
            return;
          }
        }

        navigate("/listings");
      } else if (error === "google" || error === "inactive") {
        navigate("/auth");
      }
    };

    handleGoogleCallback();
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <>
      <GoogleCallbackHandler />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/lifestyle" element={<LifestyleProfilePage />} />
          <Route path="/soft-filter" element={<SoftFilterPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/my-listings/new" element={<CreateListingPage />} />
          <Route path="/my-listings/:id/edit" element={<EditListingPage />} />
          <Route path="/my-listings/:id" element={<ListingDetailPage />} />
          <Route path="/listings" element={<PublicListingsPage />} />
          <Route path="/listings/:id" element={<PublicListingDetailPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/listings" element={<AdminListingsPage />} />
            <Route path="/admin/amenities" element={<AdminAmenitiesPage />} />
            <Route path="/admin/imported-listings" element={<AdminImportedListingsPage />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/feedbacks" element={<AdminFeedbacksPage />} />
          </Route>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/saved-listings" element={<SavedListingsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/payment/:listingId" element={<PaymentPackages />} />
          <Route path="/buy-views" element={<BuyContactViewsPage />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/support" element={<SupportContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
