import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminListingsPage from "./pages/admin/AdminListingsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminAmenitiesPage from "./pages/admin/AdminAmenitiesPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import MyListingsPage from "./pages/MyListingsPage";
import CreateListingPage from "./pages/CreateListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import EditListingPage from "./pages/EditListingPage";
import PublicListingsPage from "./pages/PublicListingsPage";
import PublicListingDetailPage from "./pages/PublicListingDetailPage";
import HomePage from "./pages/HomePage";
import AdminImportedListingsPage from "./pages/admin/AdminImportedListingsPage";
import LifestyleProfilePage from "./pages/LifestyleProfilePage";
import SoftFilterPage from "./pages/SoftFilterPage";
import PaymentPackages from "./pages/PaymentPackages";
import SavedListingsPage from "./pages/SavedListingsPage";
import PaymentHistory from "./pages/PaymentHistory";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import SupportContactPage from "./pages/SupportContactPage";
import AdminFeedbacksPage from "./pages/admin/AdminFeedbacksPage";
import OnboardingPage from "./pages/OnboardingPage";
import { fetchProfile } from "./api/services/user";
import { fetchLifestyleProfile, fetchRoommatePreferences } from "./api/services/lifestyle";

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

      console.log("App: Handling Google callback...", { success, error, hasToken: !!token });

      // Clear URL params immediately to prevent re-processing
      window.history.replaceState({}, document.title, window.location.pathname);

      if (success === "google" && token) {
        localStorage.setItem("access_token", token);
        console.log("App: Token saved to localStorage");

        try {
          const profile = await fetchProfile();
          console.log("App: Profile fetched:", profile);

          if (profile.roleName === "admin") {
            console.log("App: User is admin, redirecting to admin dashboard");
            navigate("/admin/dashboard");
            return;
          }
        } catch (err) {
          console.log("App: Error fetching profile:", err);
        }

        // Check onboarding status
        const onboardingKey = `roomie_onboarding_completed_${window.location.hostname}`;
        const alreadyCompleted = localStorage.getItem(onboardingKey) === "true";
        console.log("App: Onboarding already completed:", alreadyCompleted);

        if (!alreadyCompleted) {
          try {
            console.log("App: Fetching lifestyle profile and roommate preferences...");
            const [lifestyleProfile, roommatePreferences] = await Promise.all([
              fetchLifestyleProfile(),
              fetchRoommatePreferences(),
            ]);
            console.log("App: Lifestyle profile:", lifestyleProfile);
            console.log("App: Roommate preferences:", roommatePreferences);

            const hasLifestyleData = Object.values(lifestyleProfile || {}).some(
              (value) => value !== null && value !== undefined && value !== ""
            );
            const hasPreferencesData = Object.values(roommatePreferences || {}).some(
              (value) => value !== null && value !== undefined && value !== ""
            );
            console.log("App: Has lifestyle data:", hasLifestyleData);
            console.log("App: Has preferences data:", hasPreferencesData);

            if (!hasLifestyleData && !hasPreferencesData) {
              console.log("App: No profile data, navigating to /onboarding");
              navigate("/onboarding");
              return;
            }
          } catch (err) {
            console.log("App: Error checking profile data:", err);
            console.log("App: Error occurred, navigating to /onboarding as fallback");
            navigate("/onboarding");
            return;
          }
        }

        console.log("App: User has profile data, navigating to /listings");
        navigate("/listings");
      } else if (error === "google") {
        console.log("App: Google login error");
        navigate("/auth");
      } else if (error === "inactive") {
        console.log("App: Account inactive error");
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
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/listings" element={<AdminListingsPage />} />
      <Route path="/admin/amenities" element={<AdminAmenitiesPage />} />
      <Route path="/admin/imported-listings" element={<AdminImportedListingsPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/saved-listings" element={<SavedListingsPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/payment/:listingId" element={<PaymentPackages />}/>
      <Route path="/payment-history" element={<PaymentHistory />} />
      <Route path="/support" element={<SupportContactPage />} />
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/reports" element={<AdminReportsPage />} />
      <Route path="/admin/feedbacks" element={<AdminFeedbacksPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
