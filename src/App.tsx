import { Navigate, Route, Routes } from "react-router-dom";
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
import AdminImportedListingsPage from "./pages/admin/AdminImportedListingsPage";
import PaymentPackages from "./pages/PaymentPackages";
import PaymentHistory from "./pages/PaymentHistory";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReportsPage from "./pages/admin/AdminReportsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicListingsPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<ProfilePage />} />
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
      <Route path="/payment/:listingId" element={<PaymentPackages />}/>
      <Route path="/payment-history" element={<PaymentHistory />} />
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/reports" element={<AdminReportsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
