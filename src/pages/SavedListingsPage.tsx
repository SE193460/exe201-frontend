import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookmarkCheck, MapPinned } from "lucide-react";
import { fetchSavedListings, resolveListingImageUrl } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";

export default function SavedListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  useEffect(() => {
    fetchSavedListings()
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải danh sách tin đã lưu. Vui lòng đăng nhập.");
        setLoading(false);
      });
  }, []);

  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const pagedListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800 flex flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 px-6 pb-16 pt-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tin đã lưu</h1>
            <p className="mt-1 text-sm text-slate-500">Các bài đăng bạn đã lưu để xem sau.</p>
          </div>
        </header>

        {loading && (
          <div className="flex h-64 items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
            <div className="text-center">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></span>
              <p className="mt-2 text-sm text-slate-700 font-semibold">Đang tải...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-100 bg-white px-6 py-8 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="rounded-[24px] border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
            <BookmarkCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Bạn chưa lưu bài đăng nào.</p>
            <button
              onClick={() => navigate("/listings")}
              className="mt-4 rounded-full bg-[#ff6a3d] px-6 py-2 text-sm font-semibold text-white"
            >
              Khám phá bài đăng
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {pagedListings.map((listing) => {
            const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
            const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
            return (
              <button
                key={listing.id}
                onClick={() => navigate(`/listings/${listing.id}`)}
                className="rounded-[22px] border border-orange-100 bg-white px-6 py-5 text-left shadow-[0_20px_50px_-35px_rgba(255,136,0,0.4)] transition hover:-translate-y-0.5"
              >
                <div className="flex gap-4">
                  <div className="h-24 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-orange-50">
                    {thumbnail ? (
                      <img src={thumbnail} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-orange-300">Chưa có ảnh</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-800 line-clamp-1">{listing.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                      <MapPinned className="h-3 w-3" />{location || "Chưa cập nhật"}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{listing.description}</p>
                    <p className="mt-2 text-base font-black text-[#ff6a3d]">{listing.rentPrice.toLocaleString("vi-VN")} đ/tháng</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!loading && !error && listings.length > 0 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </main>
      <Footer />
    </div>
  );
}
