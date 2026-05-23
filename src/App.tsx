import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage.tsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import MyListingsPage from "./pages/MyListingsPage";
import CreateListingPage from "./pages/CreateListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import EditListingPage from "./pages/EditListingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/my-listings" element={<MyListingsPage />} />
      <Route path="/my-listings/new" element={<CreateListingPage />} />
      <Route path="/my-listings/:id/edit" element={<EditListingPage />} />
      <Route path="/my-listings/:id" element={<ListingDetailPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
